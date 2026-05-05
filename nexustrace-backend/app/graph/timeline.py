from neo4j import Session
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
import math
import re

class TimelineService:
    CO_OCCURS_EDGE_THRESHOLD = 0
    CO_OCCURS_ENTITY_THRESHOLD = 0
    CO_OCCURS_MAX_ENTITIES = 50
    CO_OCCURS_MAX_EDGES = 100
    RELATION_TOTAL_THRESHOLD = 100
    RELATION_MAX_EDGES = 100

    def __init__(self, session: Session, user_id: str):
        self.session = session
        self.user_id = user_id

    def _classify_event_type(self, text: str) -> str:
        """Classify event type based on text content using keyword matching"""
        text_lower = text.lower()
        
        # Define event patterns with priority (most specific first)
        patterns = [
            (r'\b(login|logon|logged in|authentication|sign in|signin)\b', 'Login'),
            (r'\b(logout|logoff|logged out|sign out|signout)\b', 'Logout'),
            (r'\b(failed|failure|denied|rejected|unauthorized|invalid)\b.*\b(login|auth|access|password)\b', 'Login Failure'),
            (r'\b(file|document|folder)\b.*\b(access|open|read|view|download)\b', 'File Access'),
            (r'\b(upload|write|create|modify|edit|change|update)\b.*\b(file|document)\b', 'File Modification'),
            (r'\b(delete|remove|erase)\b.*\b(file|document|folder)\b', 'File Deletion'),
            (r'\b(email|mail|message)\b.*\b(sent|send|forward|reply)\b', 'Email Sent'),
            (r'\b(email|mail|message)\b.*\b(received|receive|inbox)\b', 'Email Received'),
            (r'\b(transaction|transfer|payment|withdraw|deposit)\b', 'Transaction'),
            (r'\b(network|connection|connect|socket)\b', 'Network Activity'),
            (r'\b(database|query|sql|db)\b.*\b(access|execute|run)\b', 'Database Access'),
            (r'\b(error|exception|crash|fault|bug)\b', 'System Error'),
            (r'\b(warning|alert|notice)\b', 'System Warning'),
            (r'\b(started|start|launch|execute|run)\b.*\b(process|service|application|program)\b', 'Process Started'),
            (r'\b(stopped|stop|terminate|kill|end)\b.*\b(process|service|application|program)\b', 'Process Stopped'),
            (r'\b(api|request|http|https|get|post|put|delete)\b', 'API Request'),
        ]
        
        for pattern, event_type in patterns:
            if re.search(pattern, text_lower):
                return event_type
        
        return 'System Event'

    def _parse_timestamp(self, timestamp_value) -> str:
        """Convert various timestamp formats to ISO 8601 string"""
        if not timestamp_value:
            return datetime.now().isoformat() + 'Z'
        
        # If it's already a string, return it
        if isinstance(timestamp_value, str):
            # Try to parse and reformat to ensure ISO 8601
            try:
                dt = datetime.fromisoformat(timestamp_value.replace('Z', '+00:00'))
                return dt.isoformat() + 'Z'
            except:
                return timestamp_value
        
        # If it's a Neo4j datetime or integer timestamp
        try:
            if isinstance(timestamp_value, int):
                # Assume milliseconds since epoch
                dt = datetime.fromtimestamp(timestamp_value / 1000.0)
                return dt.isoformat() + 'Z'
        except:
            pass
        
        return str(timestamp_value)

    def get_timeline(self, case_id: str) -> List[Dict[str, Any]]:
        """Extract chronological events from case evidence"""
        query = """
        MATCH (c:Case {case_id: $case_id})
        MATCH (c)-[:HAS_EVIDENCE]->(e:Evidence)-[:HAS_CHUNK]->(ch:Chunk)
        OPTIONAL MATCH (ch)-[:MENTIONS]->(ent:Entity)
        WITH ch, e, 
             COLLECT(DISTINCT ent.name) as entity_names,
             COALESCE(ch.timestamp, e.uploaded_at) as ts,
             ch.risk_score as risk
        RETURN ch.chunk_id as chunk_id, 
               ts as timestamp,
               ch.text as text, 
               risk as risk_score, 
               e.filename as filename,
               entity_names
        ORDER BY ts ASC
        """
        
        results = self.session.run(query, case_id=case_id)
        
        events = []
        for record in results:
            text = record["text"] or ""
            entities = [e for e in record["entity_names"] if e] if record["entity_names"] else []
            
            # Classify event type based on content
            event_type = self._classify_event_type(text)
            
            # Create description (truncate if too long)
            description = text[:200] + "..." if len(text) > 200 else text
            
            # Parse timestamp - if no timestamp, use current time
            timestamp_value = record["timestamp"]
            if timestamp_value:
                timestamp_iso = self._parse_timestamp(timestamp_value)
            else:
                # Fallback to current time if no timestamp available
                timestamp_iso = datetime.now().isoformat() + 'Z'
            
            # Calculate risk score
            risk_score = record["risk_score"] if record["risk_score"] is not None else 0.0
            
            events.append({
                "id": record["chunk_id"],
                "timestamp": timestamp_iso,
                "event_type": event_type,
                "description": description,
                "source": record["filename"] or "Unknown",
                "entities": entities,
                "risk_score": risk_score
            })
        
        return events

    def get_prioritized(self, case_id: str) -> List[Dict[str, Any]]:
        """Return entities ranked by risk and importance"""
        query = """
        MATCH (c:Case {case_id: $case_id})
        MATCH (c)-[:HAS_ENTITY]->(ent:Entity)
           OPTIONAL MATCH (ent)<-[:MENTIONS]-(ch:Chunk)
           WITH ent,
               COUNT(DISTINCT ch) as mention_count,
               AVG(ch.risk_score) as avg_risk,
               MAX(ch.timestamp) as last_occurrence,
               COLLECT(DISTINCT ch.text) as chunk_texts
           OPTIONAL MATCH (ent)-[co:CO_OCCURS]-(:Entity)
           WITH ent, mention_count, avg_risk, last_occurrence, chunk_texts,
               SUM(CASE WHEN co IS NULL THEN 0 ELSE COALESCE(co.count, 1) END) as co_score,
               COUNT(DISTINCT CASE 
                  WHEN co IS NULL THEN null
                  WHEN startNode(co) = ent THEN endNode(co)
                  ELSE startNode(co)
               END) as co_degree
           RETURN elementId(ent) as entity_id,
                ent.name as entity_name,
                ent.type as entity_type,
                mention_count,
                co_score,
                co_degree,
                avg_risk,
                last_occurrence,
                chunk_texts
           ORDER BY mention_count DESC
        LIMIT 100
        """
        
        results = self.session.run(query, case_id=case_id)

        benign_entity_types = {"PERSON", "ORG", "GPE", "NORP", "EMAIL", "DATE", "TIME", "MONEY"}
        common_benign_apps = {
            "chrome",
            "google chrome",
            "firefox",
            "microsoft",
            "microsoft edge",
            "edge",
            "windows",
            "aws",
            "amazon web services",
            "office",
            "outlook",
            "teams",
        }
        malware_keywords = [
            "malware",
            "ransomware",
            "trojan",
            "worm",
            "rootkit",
            "backdoor",
            "keylogger",
            "botnet",
            "payload",
            "c2",
            "command and control",
        ]
        anomaly_keywords = ["anomal", "suspicious", "unusual", "abnormal", "outlier", "ioc", "indicator"]
        attack_keywords = [
            "exploit",
            "exfiltrat",
            "unauthorized",
            "privilege escalation",
            "brute force",
            "persistence",
            "lateral movement",
            "beacon",
            "dropper",
            "credential dump",
            "injection",
        ]
        suspicious_exec_keywords = [
            "powershell",
            "cmd.exe",
            "wscript",
            "cscript",
            "rundll32",
            "regsvr32",
            "scheduled task",
            "autorun",
        ]
        suspicious_exec_pattern = re.compile(r"\b[a-z0-9._-]+\.(?:exe|bat|cmd|ps1|vbs|scr|dll|com)\b")

        def count_hits(text: str, keywords: List[str]) -> int:
            if not text:
                return 0
            return sum(1 for kw in keywords if kw in text)

        def looks_like_suspicious_executable(entity_name: str) -> bool:
            return bool(suspicious_exec_pattern.search((entity_name or "").lower()))

        def is_common_benign_application(entity_name: str) -> bool:
            normalized = (entity_name or "").strip().lower()
            if not normalized:
                return False
            if normalized in common_benign_apps:
                return True
            return any(normalized.startswith(f"{app} ") for app in common_benign_apps)
        
        leads = []
        for record in results:
            mention_count = record["mention_count"] or 0
            co_score = record["co_score"] or 0
            connection_count = record["co_degree"] or 0
            avg_risk = record["avg_risk"] if record["avg_risk"] is not None else None
            
            # Generate reason based on analysis
            reason_parts = []
            
            if mention_count > 20:
                reason_parts.append(f"Appears in {mention_count} evidence chunks")
            elif mention_count > 10:
                reason_parts.append(f"Mentioned {mention_count} times across evidence")
            elif mention_count > 1:
                reason_parts.append(f"Found in {mention_count} locations")
            else:
                reason_parts.append("Single occurrence")
            
            if connection_count > 15:
                reason_parts.append(f"connected to {connection_count} other entities")
            elif connection_count > 5:
                reason_parts.append(f"{connection_count} entity connections")
            elif connection_count > 0:
                reason_parts.append(f"{connection_count} connections")
            
            # Analyze chunk texts for suspicious patterns
            chunk_texts = record["chunk_texts"] or []
            combined_text = " ".join(chunk_texts[:10]).lower() if chunk_texts else ""
            if combined_text:
                
                if any(word in combined_text for word in ['failed', 'denied', 'unauthorized', 'blocked']):
                    reason_parts.append("involvement in failed/denied activities")
                if any(word in combined_text for word in ['sensitive', 'confidential', 'secret', 'private']):
                    reason_parts.append("access to sensitive resources")
                if any(word in combined_text for word in ['transfer', 'exfiltrate', 'download', 'export']):
                    reason_parts.append("data transfer activity")
                if any(word in combined_text for word in ['suspicious', 'anomal', 'unusual', 'abnormal']):
                    reason_parts.append("flagged as unusual behavior")
            
            # Parse timestamp
            last_seen = self._parse_timestamp(record["last_occurrence"])

            # Map entity type to frontend format
            raw_entity_type = (record["entity_type"] or "").upper()
            entity_type_map = {
                "PERSON": "person",
                "ORG": "organization",
                "GPE": "location",
                "PRODUCT": "application",
                "EMAIL": "email",
                "IP_ADDRESS": "ip",
                "URL": "url",
                "PHONE": "phone",
                "DATE": "other"
            }
            entity_type = entity_type_map.get(raw_entity_type, "other")
            
            leads.append({
                "id": record["entity_id"],
                "entity": record["entity_name"] or "Unknown",
                "entity_type": entity_type,
                "raw_entity_type": raw_entity_type,
                "mention_count": mention_count,
                "co_score": co_score,
                "connections": connection_count,
                "avg_risk": avg_risk,
                "last_seen": last_seen,
                "reason_parts": reason_parts,
                "chunk_texts": chunk_texts,
                "combined_text": combined_text,
            })

        def norm_log(value: float, max_value: float) -> float:
            if max_value <= 0:
                return 0.0
            return math.log1p(value) / math.log1p(max_value)

        def recency_score(last_seen_value: str, half_life_days: float = 30.0) -> float:
            if not last_seen_value:
                return 0.3
            try:
                dt = datetime.fromisoformat(last_seen_value.replace("Z", "+00:00"))
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                now = datetime.now(timezone.utc)
                age_days = max((now - dt).total_seconds() / 86400.0, 0)
                return math.exp(-age_days / half_life_days)
            except Exception:
                return 0.3

        max_mentions = max((lead["mention_count"] for lead in leads), default=0) or 1
        max_co_score = max((lead["co_score"] for lead in leads), default=0) or 1

        factor_weights = {
            "intrinsic_risk_signal": 0.45,
            "frequency_signal": 0.20,
            "graph_connectivity_signal": 0.25,
            "recency_signal": 0.10,
        }
        factor_labels = {
            "intrinsic_risk_signal": "intrinsic risk language",
            "frequency_signal": "mention frequency",
            "graph_connectivity_signal": "entity co-occurrence density",
            "recency_signal": "recent activity",
        }

        def inverse_norm_log(norm_value: float, max_value: float) -> float:
            if max_value <= 0:
                return 0.0
            bounded_norm = min(max(norm_value, 0.0), 1.0)
            return math.expm1(bounded_norm * math.log1p(max_value))

        for lead in leads:
            mention_norm = norm_log(lead["mention_count"], max_mentions)
            co_norm = norm_log(lead["co_score"], max_co_score)
            risk_norm = lead["avg_risk"] if lead["avg_risk"] is not None else 0.3
            risk_norm = min(max(risk_norm, 0.0), 1.0)
            recency = recency_score(lead["last_seen"])

            factor_norm_values = {
                "intrinsic_risk_signal": risk_norm,
                "frequency_signal": mention_norm,
                "graph_connectivity_signal": co_norm,
                "recency_signal": recency,
            }
            weighted_components = {
                key: factor_weights[key] * factor_norm_values[key]
                for key in factor_weights
            }
            base_risk = sum(weighted_components.values())

            combined_text = lead["combined_text"]
            entity_name = lead["entity"]
            entity_name_lower = entity_name.lower()

            malware_hits = count_hits(combined_text, malware_keywords) + count_hits(entity_name_lower, malware_keywords)
            anomaly_hits = count_hits(combined_text, anomaly_keywords)
            attack_hits = count_hits(combined_text, attack_keywords)
            exec_hits = count_hits(combined_text, suspicious_exec_keywords)
            has_suspicious_executable = looks_like_suspicious_executable(entity_name)

            strong_harm_link = has_suspicious_executable or malware_hits > 0 or (anomaly_hits > 0 and attack_hits > 0)
            weak_harm_link = strong_harm_link or anomaly_hits > 0 or attack_hits > 0 or exec_hits > 0

            is_context_sensitive_entity = (
                lead["raw_entity_type"] in benign_entity_types
                or is_common_benign_application(entity_name)
            )

            final_risk = base_risk

            # Keep very high risk bands for entities with concrete malicious linkage.
            if is_context_sensitive_entity:
                if not weak_harm_link:
                    final_risk = min(final_risk, 0.40)
                    lead["reason_parts"].append("risk reduced: no direct malicious linkage")
                elif not strong_harm_link:
                    final_risk = min(final_risk, 0.65)
                    lead["reason_parts"].append("risk constrained pending stronger malware linkage")

            if has_suspicious_executable:
                lead["reason_parts"].append("suspicious executable/script artifact observed")
            if malware_hits > 0:
                lead["reason_parts"].append("malware indicators in linked evidence")
            elif anomaly_hits > 0:
                lead["reason_parts"].append("anomalous behavior in linked evidence")

            final_risk = min(final_risk, 1.0)
            cap_adjustment = max(base_risk - final_risk, 0.0)
            lead["risk_score"] = round(final_risk, 2)

            # Default reason if none generated
            if len(lead["reason_parts"]) == 1:
                if lead["risk_score"] >= 0.7:
                    lead["reason_parts"].append("high-risk activity detected")
                elif lead["risk_score"] >= 0.5:
                    lead["reason_parts"].append("moderate-risk patterns observed")
                else:
                    lead["reason_parts"].append("low-risk profile")

            deduped_parts = []
            seen_parts = set()
            for part in lead["reason_parts"]:
                if part in seen_parts:
                    continue
                seen_parts.add(part)
                deduped_parts.append(part)

            lead["reason"] = ", ".join(deduped_parts).capitalize()

            sorted_components = sorted(
                weighted_components.items(),
                key=lambda item: item[1],
                reverse=True,
            )
            lead["risk_breakdown"] = {
                key: round(value, 3)
                for key, value in weighted_components.items()
            }
            if cap_adjustment > 0:
                lead["risk_breakdown"]["cap_adjustment"] = round(-cap_adjustment, 3)

            lead["top_risk_drivers"] = [
                f"{factor_labels[key]} contributes {value:.2f}"
                for key, value in sorted_components[:3]
                if value > 0
            ]

            counterfactuals = []
            positive_components = [item for item in sorted_components if item[1] > 0]
            if positive_components:
                top_key, top_value = positive_components[0]
                second_key, second_value = positive_components[1] if len(positive_components) > 1 else (None, 0.0)

                if second_key:
                    reduction_ratio = 0.35
                    estimated_drop = reduction_ratio * (top_value + second_value)
                    reduced_risk = max(0.0, final_risk - estimated_drop)
                    counterfactuals.append(
                        f"If {factor_labels[top_key]} and {factor_labels[second_key]} dropped by about 35%, "
                        f"risk could move from {final_risk:.2f} to around {reduced_risk:.2f}."
                    )
                else:
                    reduction_ratio = 0.35
                    estimated_drop = reduction_ratio * top_value
                    reduced_risk = max(0.0, final_risk - estimated_drop)
                    counterfactuals.append(
                        f"If {factor_labels[top_key]} dropped by about 35%, risk could move from "
                        f"{final_risk:.2f} to around {reduced_risk:.2f}."
                    )

                if final_risk > 0.40:
                    required_delta = final_risk - 0.40
                    top_weight = factor_weights[top_key]
                    top_norm = factor_norm_values[top_key]
                    required_norm_drop = min(top_norm, required_delta / top_weight) if top_weight > 0 else 0.0
                    target_norm = max(0.0, top_norm - required_norm_drop)

                    if top_key == "frequency_signal":
                        target_mentions = int(round(inverse_norm_log(target_norm, max_mentions)))
                        counterfactuals.append(
                            f"To reduce below 0.40, mention frequency would need to drop to about {target_mentions} "
                            f"mentions (from {lead['mention_count']})."
                        )
                    elif top_key == "graph_connectivity_signal":
                        target_co_score = int(round(inverse_norm_log(target_norm, max_co_score)))
                        counterfactuals.append(
                            f"To reduce below 0.40, co-occurrence pressure would need to drop to about {target_co_score} "
                            f"co-occurrence points (from {lead['co_score']})."
                        )
                    elif top_key == "intrinsic_risk_signal":
                        counterfactuals.append(
                            f"To reduce below 0.40, intrinsic risk language signal would need to drop from "
                            f"{top_norm:.2f} to about {target_norm:.2f}."
                        )
                    else:
                        counterfactuals.append(
                            f"To reduce below 0.40, the recent activity signal would need to decay from "
                            f"{top_norm:.2f} to about {target_norm:.2f}."
                        )

                if final_risk < 0.70 and second_key:
                    growth_ratio = 0.25
                    top_growth = growth_ratio * factor_weights[top_key] * max(0.0, 1.0 - factor_norm_values[top_key])
                    second_growth = growth_ratio * factor_weights[second_key] * max(0.0, 1.0 - factor_norm_values[second_key])
                    raised_risk = min(1.0, final_risk + top_growth + second_growth)
                    counterfactuals.append(
                        f"If {factor_labels[top_key]} and {factor_labels[second_key]} increased by about 25%, "
                        f"risk could rise from {final_risk:.2f} to around {raised_risk:.2f}."
                    )

            lead["counterfactual_explanations"] = counterfactuals[:3]

        leads.sort(
            key=lambda item: (
                item["risk_score"],
                item["mention_count"],
                item["co_score"],
            ),
            reverse=True,
        )

        for lead in leads:
            lead.pop("avg_risk", None)
            lead.pop("mention_count", None)
            lead.pop("co_score", None)
            lead.pop("raw_entity_type", None)
            lead.pop("reason_parts", None)
            lead.pop("chunk_texts", None)
            lead.pop("combined_text", None)

        return leads
        
    def get_entities(self, case_id: str):
        query = """
        MATCH (c:Case {case_id: $case_id})
        MATCH (c)-[:HAS_EVIDENCE]->(:Evidence)-[:HAS_CHUNK]->(ch:Chunk)-[:MENTIONS]->(ent:Entity)
        RETURN elementId(ent) as id,
               ent.name as name,
               ent.type as type,
               count(DISTINCT ch) as mentions,
               avg(ch.risk_score) as risk_score
        ORDER BY mentions DESC, risk_score DESC
        """
        results = self.session.run(query, user_id=self.user_id, case_id=case_id)
        return [record.data() for record in results]

    def get_entity(self, entity_id: str):
        query = """
        MATCH (c:Case)-[:HAS_EVIDENCE]->(e:Evidence)-[:HAS_CHUNK]->(ch:Chunk)-[:MENTIONS]->(ent:Entity)
        WHERE elementId(ent) = $entity_id
        RETURN ent.name as name, ent.type as type, count(ch) as mention_count, collect(distinct e.filename) as evidence_files
        """
        result = self.session.run(query, user_id=self.user_id, entity_id=entity_id).single()
        
        if not result:
            return None
            
        return result.data()

    def _normalize_relation_types(self, relation_types: Optional[List[str]]) -> List[str]:
        if not relation_types:
            return []
        normalized = []
        seen = set()
        for rel in relation_types:
            if not rel:
                continue
            rel_name = rel.strip().upper()
            if not rel_name or rel_name in seen:
                continue
            seen.add(rel_name)
            normalized.append(rel_name)
        return normalized

    def _primary_label(self, labels: List[str]) -> str:
        if labels:
            return labels[0]
        return "Node"

    def _sanitize_node_properties(self, node_type: str, props: Dict[str, Any]) -> Dict[str, Any]:
        safe_props = dict(props or {})
        if node_type == "Chunk":
            safe_props.pop("embedding", None)
            safe_props.pop("text", None)
        return safe_props

    def _format_node_label(self, node_type: str, props: Dict[str, Any]) -> str:
        if node_type == "Case":
            return props.get("name") or props.get("case_id") or "Case"
        if node_type == "Evidence":
            return props.get("filename") or props.get("evidence_id") or "Evidence"
        if node_type == "Entity":
            return props.get("name") or "Entity"
        if node_type == "Chunk":
            chunk_index = props.get("chunk_index")
            if chunk_index is not None:
                return f"Chunk {chunk_index}"
            return props.get("chunk_id") or "Chunk"
        return props.get("name") or props.get("id") or node_type

    def _build_node(self, node_id: str, labels: List[str], props: Dict[str, Any]) -> Dict[str, Any]:
        node_type = self._primary_label(labels)
        safe_props = self._sanitize_node_properties(node_type, props)
        return {
            "id": node_id,
            "label": self._format_node_label(node_type, safe_props),
            "type": node_type,
            "properties": safe_props
        }

    def _get_co_occurs_stats(self, case_id: str) -> Tuple[int, int]:
        query = """
        MATCH (c:Case {case_id: $case_id})-[:HAS_ENTITY]->(ent:Entity)-[r:CO_OCCURS]->(other:Entity)
        WITH count(r) as rel_count,
             collect(DISTINCT ent) as sources,
             collect(DISTINCT other) as targets
        WITH rel_count, sources + targets as all_nodes
        UNWIND all_nodes as node
        RETURN rel_count, count(DISTINCT node) as entity_count
        """
        result = self.session.run(query, user_id=self.user_id, case_id=case_id).single()
        if not result:
            return 0, 0
        return int(result["rel_count"] or 0), int(result["entity_count"] or 0)

    def _get_relation_stats(self, case_id: str, relation_type: str) -> Tuple[int, int]:
        rel_type = (relation_type or "").strip().upper()
        if not rel_type:
            return 0, 0
        if rel_type == "CO_OCCURS":
            return self._get_co_occurs_stats(case_id)

        relation_queries = {
            "HAS_EVIDENCE": """
            MATCH (c:Case {case_id: $case_id})-[r:HAS_EVIDENCE]->(e:Evidence)
            WITH count(r) as rel_count,
                 collect(DISTINCT c) as sources,
                 collect(DISTINCT e) as targets
            WITH rel_count, sources + targets as all_nodes
            UNWIND all_nodes as node
            RETURN rel_count, count(DISTINCT node) as entity_count
            """,
            "HAS_ENTITY": """
            MATCH (c:Case {case_id: $case_id})-[r:HAS_ENTITY]->(ent:Entity)
            WITH count(r) as rel_count,
                 collect(DISTINCT c) as sources,
                 collect(DISTINCT ent) as targets
            WITH rel_count, sources + targets as all_nodes
            UNWIND all_nodes as node
            RETURN rel_count, count(DISTINCT node) as entity_count
            """,
            "HAS_CHUNK": """
            MATCH (c:Case {case_id: $case_id})-[:HAS_EVIDENCE]->(e:Evidence)-[r:HAS_CHUNK]->(ch:Chunk)
            WITH count(r) as rel_count,
                 collect(DISTINCT e) as sources,
                 collect(DISTINCT ch) as targets
            WITH rel_count, sources + targets as all_nodes
            UNWIND all_nodes as node
            RETURN rel_count, count(DISTINCT node) as entity_count
            """,
            "MENTIONS": """
            MATCH (c:Case {case_id: $case_id})-[:HAS_EVIDENCE]->(:Evidence)-[:HAS_CHUNK]->(ch:Chunk)-[r:MENTIONS]->(ent:Entity)
            WITH count(r) as rel_count,
                 collect(DISTINCT ch) as sources,
                 collect(DISTINCT ent) as targets
            WITH rel_count, sources + targets as all_nodes
            UNWIND all_nodes as node
            RETURN rel_count, count(DISTINCT node) as entity_count
            """,
        }

        if rel_type in relation_queries:
            result = self.session.run(
                relation_queries[rel_type],
                user_id=self.user_id,
                case_id=case_id,
            ).single()
        else:
            result = self.session.run(
                """
                MATCH (c:Case {case_id: $case_id})
                MATCH p = (c)-[*1..4]-(n)
                UNWIND relationships(p) as rel
                WITH DISTINCT rel
                WHERE type(rel) = $relation_type
                WITH collect(rel) as rels
                WITH rels, size(rels) as rel_count
                UNWIND rels as rel
                WITH rel_count,
                     collect(DISTINCT startNode(rel)) as sources,
                     collect(DISTINCT endNode(rel)) as targets
                WITH rel_count, sources + targets as all_nodes
                UNWIND all_nodes as node
                RETURN rel_count, count(DISTINCT node) as entity_count
                """,
                user_id=self.user_id,
                case_id=case_id,
                relation_type=rel_type,
            ).single()

        if not result:
            return 0, 0
        return int(result["rel_count"] or 0), int(result["entity_count"] or 0)

    def _should_limit_relation(self, case_id: str, relation_type: str) -> bool:
        rel_count, entity_count = self._get_relation_stats(case_id, relation_type)
        return (rel_count + entity_count) > self.RELATION_TOTAL_THRESHOLD

    def get_network(
        self,
        case_id: str,
        relation_types: Optional[List[str]] = None,
        co_occurs_max_entities: Optional[int] = None,
        co_occurs_max_edges: Optional[int] = None,
    ):
        if not relation_types:
            # Fetch Case node
            case_query = """
            MATCH (c:Case {case_id: $case_id})
            RETURN elementId(c) as id, c.name as label, "Case" as type, properties(c) as props
            """
            case_result = self.session.run(case_query, user_id=self.user_id, case_id=case_id).single()
            
            if not case_result:
                return {"nodes": [], "edges": []}
                
            nodes = [{
                "id": case_result["id"],
                "label": case_result["label"],
                "type": "Case",
                "properties": case_result["props"]
            }]
            edges = []
            
            # Fetch Evidence nodes and edges
            evidence_query = """
            MATCH (c:Case {case_id: $case_id})-[:HAS_EVIDENCE]->(e:Evidence)
            RETURN elementId(e) as id, e.filename as label, "Evidence" as type, properties(e) as props, elementId(c) as source_id
            """
            evidence_results = self.session.run(evidence_query, user_id=self.user_id, case_id=case_id)
            
            for record in evidence_results:
                nodes.append({
                    "id": record["id"],
                    "label": record["label"],
                    "type": "Evidence",
                    "properties": record["props"]
                })
                edges.append({
                    "id": f"{record['source_id']}_{record['id']}",
                    "source": record["source_id"],
                    "target": record["id"],
                    "label": "HAS_EVIDENCE"
                })
                
            # Fetch Entity nodes and edges (aggregated from evidence)
            entity_query = """
            MATCH (c:Case {case_id: $case_id})
            MATCH (c)-[:HAS_EVIDENCE]->(e:Evidence)-[:HAS_CHUNK]->(ch:Chunk)-[:MENTIONS]->(ent:Entity)
            RETURN DISTINCT elementId(ent) as id, ent.name as label, "Entity" as type, properties(ent) as props, elementId(e) as source_id
            """
            entity_results = self.session.run(entity_query, user_id=self.user_id, case_id=case_id)
            
            existing_node_ids = {n["id"] for n in nodes}
            
            for record in entity_results:
                if record["id"] not in existing_node_ids:
                    nodes.append({
                        "id": record["id"],
                        "label": record["label"],
                        "type": "Entity", # could be specific type from props
                        "properties": record["props"]
                    })
                    existing_node_ids.add(record["id"])
                
                # Add edge from Evidence to Entity
                edge_id = f"{record['source_id']}_{record['id']}"
                edges.append({
                    "id": edge_id,
                    "source": record["source_id"],
                    "target": record["id"],
                    "label": "MENTIONS"
                })
                
            return {"nodes": nodes, "edges": edges}

        normalized_relations = self._normalize_relation_types(relation_types)
        if not normalized_relations:
            return {"nodes": [], "edges": []}

        nodes_by_id: Dict[str, Dict[str, Any]] = {}
        edges: List[Dict[str, Any]] = []
        edge_ids = set()

        def add_edge_record(record: Any):
            source_id = record["source_id"]
            target_id = record["target_id"]
            rel_type = record["rel_type"]
            rel_id = record.get("rel_id") or f"{source_id}_{target_id}_{rel_type}"

            if rel_id in edge_ids:
                return
            edge_ids.add(rel_id)

            if source_id not in nodes_by_id:
                nodes_by_id[source_id] = self._build_node(
                    source_id,
                    record.get("source_labels") or [],
                    record.get("source_props") or {}
                )
            if target_id not in nodes_by_id:
                nodes_by_id[target_id] = self._build_node(
                    target_id,
                    record.get("target_labels") or [],
                    record.get("target_props") or {}
                )

            edges.append({
                "id": rel_id,
                "source": source_id,
                "target": target_id,
                "label": rel_type
            })

        def run_relation_query(query: str, params: Optional[Dict[str, Any]] = None):
            query_params = {"case_id": case_id}
            if params:
                query_params.update(params)
            results = self.session.run(query, user_id=self.user_id, **query_params)
            for record in results:
                add_edge_record(record)

        known_relations = {"HAS_EVIDENCE", "HAS_ENTITY", "HAS_CHUNK", "MENTIONS", "CO_OCCURS"}
        explicit_relations = {rel for rel in normalized_relations if rel in known_relations}
        other_relations = [rel for rel in normalized_relations if rel not in known_relations]

        if "HAS_EVIDENCE" in explicit_relations:
             limit_edges = self._should_limit_relation(case_id, "HAS_EVIDENCE")
             if limit_edges:
              run_relation_query("""
              MATCH (c:Case {case_id: $case_id})-[r:HAS_EVIDENCE]->(e:Evidence)
              WITH c, e, r
              ORDER BY coalesce(e.uploaded_at, 0) DESC
              LIMIT $max_edges
              RETURN elementId(c) as source_id,
                  labels(c) as source_labels,
                  properties(c) as source_props,
                  elementId(e) as target_id,
                  labels(e) as target_labels,
                  properties(e) as target_props,
                  type(r) as rel_type,
                  elementId(r) as rel_id
              """, {"max_edges": self.RELATION_MAX_EDGES})
             else:
              run_relation_query("""
              MATCH (c:Case {case_id: $case_id})-[r:HAS_EVIDENCE]->(e:Evidence)
              RETURN elementId(c) as source_id,
                  labels(c) as source_labels,
                  properties(c) as source_props,
                  elementId(e) as target_id,
                  labels(e) as target_labels,
                  properties(e) as target_props,
                  type(r) as rel_type,
                  elementId(r) as rel_id
              """)

        if "HAS_ENTITY" in explicit_relations:
             limit_edges = self._should_limit_relation(case_id, "HAS_ENTITY")
             if limit_edges:
              run_relation_query("""
              MATCH (c:Case {case_id: $case_id})-[r:HAS_ENTITY]->(ent:Entity)
              WITH c, ent, r
              ORDER BY coalesce(ent.created_at, 0) DESC, ent.name ASC
              LIMIT $max_edges
              RETURN elementId(c) as source_id,
                  labels(c) as source_labels,
                  properties(c) as source_props,
                  elementId(ent) as target_id,
                  labels(ent) as target_labels,
                  properties(ent) as target_props,
                  type(r) as rel_type,
                  elementId(r) as rel_id
              """, {"max_edges": self.RELATION_MAX_EDGES})
             else:
              run_relation_query("""
              MATCH (c:Case {case_id: $case_id})-[r:HAS_ENTITY]->(ent:Entity)
              RETURN elementId(c) as source_id,
                  labels(c) as source_labels,
                  properties(c) as source_props,
                  elementId(ent) as target_id,
                  labels(ent) as target_labels,
                  properties(ent) as target_props,
                  type(r) as rel_type,
                  elementId(r) as rel_id
              """)

        if "HAS_CHUNK" in explicit_relations:
             limit_edges = self._should_limit_relation(case_id, "HAS_CHUNK")
             if limit_edges:
              run_relation_query("""
              MATCH (c:Case {case_id: $case_id})-[:HAS_EVIDENCE]->(e:Evidence)-[r:HAS_CHUNK]->(ch:Chunk)
              WITH e, ch, r
              ORDER BY coalesce(ch.timestamp, 0) DESC, coalesce(ch.chunk_index, 0) DESC
              LIMIT $max_edges
              RETURN elementId(e) as source_id,
                  labels(e) as source_labels,
                  properties(e) as source_props,
                  elementId(ch) as target_id,
                  labels(ch) as target_labels,
                  properties(ch) as target_props,
                  type(r) as rel_type,
                  elementId(r) as rel_id
              """, {"max_edges": self.RELATION_MAX_EDGES})
             else:
              run_relation_query("""
              MATCH (c:Case {case_id: $case_id})-[:HAS_EVIDENCE]->(e:Evidence)-[r:HAS_CHUNK]->(ch:Chunk)
              RETURN elementId(e) as source_id,
                  labels(e) as source_labels,
                  properties(e) as source_props,
                  elementId(ch) as target_id,
                  labels(ch) as target_labels,
                  properties(ch) as target_props,
                  type(r) as rel_type,
                  elementId(r) as rel_id
              """)

        if "MENTIONS" in explicit_relations:
            limit_edges = self._should_limit_relation(case_id, "MENTIONS")
            if "HAS_CHUNK" in explicit_relations:
                if limit_edges:
                    run_relation_query("""
                    MATCH (c:Case {case_id: $case_id})-[:HAS_EVIDENCE]->(:Evidence)-[:HAS_CHUNK]->(ch:Chunk)-[r:MENTIONS]->(ent:Entity)
                    WITH ch, ent, r
                    ORDER BY coalesce(ch.risk_score, 0) DESC
                    LIMIT $max_edges
                    RETURN elementId(ch) as source_id,
                           labels(ch) as source_labels,
                           properties(ch) as source_props,
                           elementId(ent) as target_id,
                           labels(ent) as target_labels,
                           properties(ent) as target_props,
                           type(r) as rel_type,
                           elementId(r) as rel_id
                    """, {"max_edges": self.RELATION_MAX_EDGES})
                else:
                    run_relation_query("""
                    MATCH (c:Case {case_id: $case_id})-[:HAS_EVIDENCE]->(:Evidence)-[:HAS_CHUNK]->(ch:Chunk)-[r:MENTIONS]->(ent:Entity)
                    RETURN elementId(ch) as source_id,
                           labels(ch) as source_labels,
                           properties(ch) as source_props,
                           elementId(ent) as target_id,
                           labels(ent) as target_labels,
                           properties(ent) as target_props,
                           type(r) as rel_type,
                           elementId(r) as rel_id
                    """)
            else:
                if limit_edges:
                    run_relation_query("""
                    MATCH (c:Case {case_id: $case_id})-[:HAS_EVIDENCE]->(e:Evidence)-[:HAS_CHUNK]->(:Chunk)-[:MENTIONS]->(ent:Entity)
                    WITH e, ent
                    ORDER BY coalesce(e.uploaded_at, 0) DESC, ent.name ASC
                    LIMIT $max_edges
                    RETURN DISTINCT elementId(e) as source_id,
                           labels(e) as source_labels,
                           properties(e) as source_props,
                           elementId(ent) as target_id,
                           labels(ent) as target_labels,
                           properties(ent) as target_props,
                           "MENTIONS" as rel_type
                    """, {"max_edges": self.RELATION_MAX_EDGES})
                else:
                    run_relation_query("""
                    MATCH (c:Case {case_id: $case_id})-[:HAS_EVIDENCE]->(e:Evidence)-[:HAS_CHUNK]->(:Chunk)-[:MENTIONS]->(ent:Entity)
                    RETURN DISTINCT elementId(e) as source_id,
                           labels(e) as source_labels,
                           properties(e) as source_props,
                           elementId(ent) as target_id,
                           labels(ent) as target_labels,
                           properties(ent) as target_props,
                           "MENTIONS" as rel_type
                    """)

        if "CO_OCCURS" in explicit_relations:
            force_optimized = (
                self.CO_OCCURS_EDGE_THRESHOLD <= 0
                and self.CO_OCCURS_ENTITY_THRESHOLD <= 0
            )
            rel_count, entity_count = (0, 0)
            if not force_optimized:
                rel_count, entity_count = self._get_co_occurs_stats(case_id)
            if (
                force_optimized
                or rel_count >= self.CO_OCCURS_EDGE_THRESHOLD
                or entity_count >= self.CO_OCCURS_ENTITY_THRESHOLD
            ):
                max_entities = (
                    co_occurs_max_entities
                    if co_occurs_max_entities and co_occurs_max_entities > 0
                    else self.CO_OCCURS_MAX_ENTITIES
                )
                max_edges = (
                    co_occurs_max_edges
                    if co_occurs_max_edges and co_occurs_max_edges > 0
                    else self.CO_OCCURS_MAX_EDGES
                )
                run_relation_query("""
                MATCH (c:Case {case_id: $case_id})-[:HAS_ENTITY]->(ent:Entity)
                MATCH (ent)-[r:CO_OCCURS]-(:Entity)
                WITH ent, sum(coalesce(r.count, 1)) as co_score
                ORDER BY co_score DESC
                LIMIT $max_entities
                WITH collect(ent) as ents
                UNWIND ents as ent
                MATCH (ent)-[r:CO_OCCURS]->(other:Entity)
                WHERE other IN ents
                WITH ent, other, r
                ORDER BY coalesce(r.count, 1) DESC
                LIMIT $max_edges
                RETURN elementId(ent) as source_id,
                       labels(ent) as source_labels,
                       properties(ent) as source_props,
                       elementId(other) as target_id,
                       labels(other) as target_labels,
                       properties(other) as target_props,
                       type(r) as rel_type,
                       elementId(r) as rel_id
                """, {
                    "max_entities": max_entities,
                    "max_edges": max_edges,
                })
            else:
                run_relation_query("""
                MATCH (c:Case {case_id: $case_id})-[:HAS_ENTITY]->(ent:Entity)-[r:CO_OCCURS]->(other:Entity)
                RETURN elementId(ent) as source_id,
                       labels(ent) as source_labels,
                       properties(ent) as source_props,
                       elementId(other) as target_id,
                       labels(other) as target_labels,
                       properties(other) as target_props,
                       type(r) as rel_type,
                       elementId(r) as rel_id
                """)

        if other_relations:
            for relation_type in other_relations:
                limit_edges = self._should_limit_relation(case_id, relation_type)
                if limit_edges:
                    run_relation_query("""
                    MATCH (c:Case {case_id: $case_id})
                    MATCH p = (c)-[*1..4]-(n)
                    UNWIND relationships(p) as rel
                    WITH DISTINCT rel
                    WHERE type(rel) = $relation_type
                    WITH rel
                    ORDER BY elementId(rel)
                    LIMIT $max_edges
                    RETURN elementId(startNode(rel)) as source_id,
                           labels(startNode(rel)) as source_labels,
                           properties(startNode(rel)) as source_props,
                           elementId(endNode(rel)) as target_id,
                           labels(endNode(rel)) as target_labels,
                           properties(endNode(rel)) as target_props,
                           type(rel) as rel_type,
                           elementId(rel) as rel_id
                    """, {
                        "relation_type": relation_type,
                        "max_edges": self.RELATION_MAX_EDGES,
                    })
                else:
                    run_relation_query("""
                    MATCH (c:Case {case_id: $case_id})
                    MATCH p = (c)-[*1..4]-(n)
                    UNWIND relationships(p) as rel
                    WITH DISTINCT rel
                    WHERE type(rel) = $relation_type
                    RETURN elementId(startNode(rel)) as source_id,
                           labels(startNode(rel)) as source_labels,
                           properties(startNode(rel)) as source_props,
                           elementId(endNode(rel)) as target_id,
                           labels(endNode(rel)) as target_labels,
                           properties(endNode(rel)) as target_props,
                           type(rel) as rel_type,
                           elementId(rel) as rel_id
                    """, {"relation_type": relation_type})

        return {"nodes": list(nodes_by_id.values()), "edges": edges}

    def get_network_relations(self, case_id: str) -> List[Dict[str, Any]]:
        query = """
        MATCH (c:Case {case_id: $case_id})
        MATCH p = (c)-[*1..4]-(n)
        UNWIND relationships(p) as rel
        WITH DISTINCT rel, type(rel) as rel_type
        RETURN rel_type, count(rel) as rel_count
        ORDER BY rel_count DESC
        """
        results = self.session.run(query, user_id=self.user_id, case_id=case_id)
        return [
            {"type": record["rel_type"], "count": record["rel_count"]}
            for record in results
            if record.get("rel_type")
        ]

    def get_mindmap(self, case_id: str):
        query = """
        MATCH (c:Case {case_id: $case_id})
        OPTIONAL MATCH (c)-[:HAS_EVIDENCE]->(e:Evidence)
        OPTIONAL MATCH (e)-[:HAS_CHUNK]->(ch:Chunk)-[:MENTIONS]->(ent:Entity)
        RETURN c.name as case_name, e.filename as evidence_name, ent.type as entity_type, ent.name as entity_name
        """
        results = self.session.run(query, user_id=self.user_id, case_id=case_id)
        
        data = [record.data() for record in results]
        
        if not data:
            return None
            
        # Build Tree
        root = {
            "id": "root",
            "label": data[0]["case_name"] if data[0]["case_name"] else "Case",
            "type": "root",
            "children": []
        }
        
        evidence_map = {}
        
        for row in data:
            ev_name = row.get("evidence_name")
            if not ev_name:
                continue
                
            if ev_name not in evidence_map:
                ev_node = {
                    "id": f"ev_{ev_name}",
                    "label": ev_name,
                    "type": "evidence",
                    "children": []
                }
                root["children"].append(ev_node)
                evidence_map[ev_name] = {
                    "node": ev_node,
                    "types": {}
                }
            
            ent_type = row.get("entity_type")
            ent_name = row.get("entity_name")
            
            if ent_type and ent_name:
                type_map = evidence_map[ev_name]["types"]
                if ent_type not in type_map:
                    type_node = {
                        "id": f"type_{ev_name}_{ent_type}",
                        "label": ent_type,
                        "type": "entity_type",
                        "children": []
                    }
                    evidence_map[ev_name]["node"]["children"].append(type_node)
                    type_map[ent_type] = {
                        "node": type_node,
                        "entities": set()
                    }
                
                if ent_name not in type_map[ent_type]["entities"]:
                    ent_node = {
                        "id": f"ent_{ev_name}_{ent_type}_{ent_name}",
                        "label": ent_name,
                        "type": "entity",
                        "children": []
                    }
                    type_map[ent_type]["node"]["children"].append(ent_node)
                    type_map[ent_type]["entities"].add(ent_name)
                    
        return {"root": root}
