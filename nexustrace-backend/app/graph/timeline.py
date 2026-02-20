from neo4j import Session
from typing import List, Dict, Any
from datetime import datetime
import re

class TimelineService:
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
        WHERE ch.timestamp IS NOT NULL
        OPTIONAL MATCH (ch)-[:MENTIONS]->(ent:Entity)
        WITH ch, e, 
             COLLECT(DISTINCT ent.name) as entity_names,
             ch.timestamp as ts,
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
            
            # Parse timestamp
            timestamp_iso = self._parse_timestamp(record["timestamp"])
            
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
        MATCH (ent)<-[:MENTIONS]-(ch:Chunk)
        WITH ent, 
             COUNT(DISTINCT ch) as mention_count,
             AVG(ch.risk_score) as avg_risk,
             MAX(ch.timestamp) as last_occurrence,
             COLLECT(DISTINCT ch.risk_score) as risk_scores,
             COLLECT(DISTINCT ch.text) as chunk_texts
        WITH ent,
             mention_count,
             avg_risk,
             last_occurrence,
             risk_scores,
             chunk_texts,
             // Calculate entity risk score based on mentions and avg chunk risk
             CASE 
                WHEN avg_risk IS NULL THEN 0.3 + (mention_count * 0.05)
                ELSE avg_risk + (mention_count * 0.02)
             END as entity_risk
        // Count connections to other entities
        OPTIONAL MATCH (ent)<-[:MENTIONS]-(ch1:Chunk)-[:MENTIONS]->(other:Entity)
        WHERE elementId(other) <> elementId(ent)
        WITH ent, mention_count, entity_risk, last_occurrence, chunk_texts,
             COUNT(DISTINCT other) as connection_count
        // Cap risk score at 1.0
        WITH ent, mention_count, 
             CASE WHEN entity_risk > 1.0 THEN 1.0 ELSE entity_risk END as final_risk,
             connection_count, last_occurrence, chunk_texts
        RETURN elementId(ent) as entity_id,
               ent.name as entity_name,
               ent.type as entity_type,
               final_risk as risk_score,
               mention_count,
               connection_count,
               last_occurrence,
               chunk_texts
        ORDER BY final_risk DESC, mention_count DESC
        LIMIT 100
        """
        
        results = self.session.run(query, case_id=case_id)
        
        leads = []
        for record in results:
            mention_count = record["mention_count"] or 0
            connection_count = record["connection_count"] or 0
            risk_score = record["risk_score"] or 0.0
            
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
            if chunk_texts:
                combined_text = " ".join(chunk_texts[:10]).lower()  # Sample first 10 chunks
                
                if any(word in combined_text for word in ['failed', 'denied', 'unauthorized', 'blocked']):
                    reason_parts.append("involvement in failed/denied activities")
                if any(word in combined_text for word in ['sensitive', 'confidential', 'secret', 'private']):
                    reason_parts.append("access to sensitive resources")
                if any(word in combined_text for word in ['transfer', 'exfiltrate', 'download', 'export']):
                    reason_parts.append("data transfer activity")
                if any(word in combined_text for word in ['suspicious', 'anomal', 'unusual', 'abnormal']):
                    reason_parts.append("flagged as unusual behavior")
            
            # Default reason if none generated
            if len(reason_parts) == 1:
                if risk_score >= 0.7:
                    reason_parts.append("high-risk activity detected")
                elif risk_score >= 0.5:
                    reason_parts.append("moderate-risk patterns observed")
                else:
                    reason_parts.append("low-risk profile")
            
            reason = ", ".join(reason_parts).capitalize()
            
            # Parse timestamp
            last_seen = self._parse_timestamp(record["last_occurrence"])
            
            # Map entity type to frontend format
            entity_type_map = {
                "PERSON": "person",
                "ORG": "organization",
                "GPE": "location",
                "EMAIL": "email",
                "IP_ADDRESS": "ip",
                "DATE": "other"
            }
            entity_type = entity_type_map.get(record["entity_type"], "other")
            
            leads.append({
                "id": record["entity_id"],
                "entity": record["entity_name"] or "Unknown",
                "entity_type": entity_type,
                "risk_score": round(risk_score, 2),
                "reason": reason,
                "connections": connection_count,
                "last_seen": last_seen
            })
        
        return leads
        
    def get_entities(self, case_id: str):
        query = """
        MATCH (c:Case {case_id: $case_id})
        MATCH (c)-[:HAS_EVIDENCE]->(e:Evidence)-[:HAS_CHUNK]->(ch:Chunk)-[:MENTIONS]->(ent:Entity)
        RETURN ent.name as name, ent.type as type, count(ch) as mentions
        ORDER BY mentions DESC
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

    def get_network(self, case_id: str):
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
