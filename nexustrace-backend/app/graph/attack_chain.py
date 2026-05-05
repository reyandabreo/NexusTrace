from datetime import datetime, timedelta, timezone
import re
from typing import Any, Dict, List, Optional

from neo4j import Session


class AttackChainService:
    STAGE_ORDER = [
        "Initial Access",
        "Execution",
        "Persistence",
        "Privilege Escalation",
        "Defense Evasion",
        "Credential Access",
        "Discovery",
        "Lateral Movement",
        "Command and Control",
        "Collection",
        "Exfiltration",
        "Impact",
    ]

    TECHNIQUE_LIBRARY: List[Dict[str, Any]] = [
        {
            "technique_id": "T1566",
            "technique_name": "Phishing",
            "tactic": "Initial Access",
            "stage": "Initial Access",
            "keywords": [
                "phishing",
                "spearphish",
                "malicious attachment",
                "credential lure",
                "spoofed email",
                "urgent",
                "verify",
                "impersonation",
                "suspicious link",
            ],
        },
        {
            "technique_id": "T1190",
            "technique_name": "Exploit Public-Facing Application",
            "tactic": "Initial Access",
            "stage": "Initial Access",
            "keywords": [
                "exploit",
                "rce",
                "sql injection",
                "command injection",
                "public-facing",
            ],
        },
        {
            "technique_id": "T1059",
            "technique_name": "Command and Scripting Interpreter",
            "tactic": "Execution",
            "stage": "Execution",
            "keywords": [
                "powershell",
                "powershell.exe",
                "cmd.exe",
                "bash",
                "wscript",
                "cscript",
                "script",
                "base64",
                "encoded",
                "process chain",
            ],
        },
        {
            "technique_id": "T1204",
            "technique_name": "User Execution",
            "tactic": "Execution",
            "stage": "Execution",
            "keywords": [
                "opened attachment",
                "enabled macro",
                "user executed",
                "double clicked",
                "clicked hyperlink",
                "clicked link",
                "opened message",
                "uac prompt",
                "override accepted",
            ],
        },
        {
            "technique_id": "T1547",
            "technique_name": "Boot or Logon Autostart Execution",
            "tactic": "Persistence",
            "stage": "Persistence",
            "keywords": [
                "autorun",
                "startup folder",
                "run key",
                "logon script",
                "registry run",
                "registry modification",
            ],
        },
        {
            "technique_id": "T1053",
            "technique_name": "Scheduled Task or Job",
            "tactic": "Persistence",
            "stage": "Persistence",
            "keywords": [
                "scheduled task",
                "schtasks",
                "cron job",
                "task scheduler",
            ],
        },
        {
            "technique_id": "T1068",
            "technique_name": "Exploitation for Privilege Escalation",
            "tactic": "Privilege Escalation",
            "stage": "Privilege Escalation",
            "keywords": [
                "privilege escalation",
                "uac bypass",
                "token impersonation",
                "elevated privileges",
            ],
        },
        {
            "technique_id": "T1070",
            "technique_name": "Indicator Removal on Host",
            "tactic": "Defense Evasion",
            "stage": "Defense Evasion",
            "keywords": [
                "clear logs",
                "log tampering",
                "delete traces",
                "wiped logs",
                "remove artifacts",
            ],
        },
        {
            "technique_id": "T1562",
            "technique_name": "Impair Defenses",
            "tactic": "Defense Evasion",
            "stage": "Defense Evasion",
            "keywords": [
                "disable antivirus",
                "defender disabled",
                "disable edr",
                "turn off security",
                "tamper protection",
                "av bypass",
                "obfuscation",
                "polymorphic",
            ],
        },
        {
            "technique_id": "T1003",
            "technique_name": "OS Credential Dumping",
            "tactic": "Credential Access",
            "stage": "Credential Access",
            "keywords": [
                "credential dump",
                "mimikatz",
                "lsass",
                "lsass access",
                "memory dump",
                "hash dump",
                "sam hive",
            ],
        },
        {
            "technique_id": "T1110",
            "technique_name": "Brute Force",
            "tactic": "Credential Access",
            "stage": "Credential Access",
            "keywords": [
                "brute force",
                "password spray",
                "credential stuffing",
                "multiple login failure",
            ],
        },
        {
            "technique_id": "T1087",
            "technique_name": "Account Discovery",
            "tactic": "Discovery",
            "stage": "Discovery",
            "keywords": [
                "account discovery",
                "enumerated users",
                "net user",
                "whoami",
                "user list",
            ],
        },
        {
            "technique_id": "T1082",
            "technique_name": "System Information Discovery",
            "tactic": "Discovery",
            "stage": "Discovery",
            "keywords": [
                "systeminfo",
                "hostname",
                "os version",
                "ipconfig",
                "port scan",
                "network scan",
            ],
        },
        {
            "technique_id": "T1021",
            "technique_name": "Remote Services",
            "tactic": "Lateral Movement",
            "stage": "Lateral Movement",
            "keywords": [
                "remote desktop",
                "rdp",
                "psexec",
                "wmic",
                "ssh",
                "smb",
            ],
        },
        {
            "technique_id": "T1071",
            "technique_name": "Application Layer Protocol",
            "tactic": "Command and Control",
            "stage": "Command and Control",
            "keywords": [
                "beacon",
                "c2 server",
                "command and control",
                "http callback",
                "dns tunnel",
                "heartbeat",
                "outbound https",
                "known c2",
                "certificate mismatch",
                "beaconing",
            ],
        },
        {
            "technique_id": "T1005",
            "technique_name": "Data from Local System",
            "tactic": "Collection",
            "stage": "Collection",
            "keywords": [
                "collect files",
                "staged data",
                "archive data",
                "sensitive file collection",
            ],
        },
        {
            "technique_id": "T1041",
            "technique_name": "Exfiltration Over C2 Channel",
            "tactic": "Exfiltration",
            "stage": "Exfiltration",
            "keywords": [
                "exfiltration",
                "data upload",
                "large outbound transfer",
                "ftp upload",
                "cloud sync",
                "post /api",
                "outbound transfer",
                "exfil",
            ],
        },
        {
            "technique_id": "T1486",
            "technique_name": "Data Encrypted for Impact",
            "tactic": "Impact",
            "stage": "Impact",
            "keywords": [
                "ransomware",
                "encrypted files",
                "file encryption",
                "payment demand",
            ],
        },
        {
            "technique_id": "T1490",
            "technique_name": "Inhibit System Recovery",
            "tactic": "Impact",
            "stage": "Impact",
            "keywords": [
                "delete shadow copies",
                "vssadmin delete",
                "disable recovery",
                "backup deletion",
            ],
        },
    ]

    STAGE_GAP_GUIDANCE: Dict[str, List[str]] = {
        "Initial Access": ["email headers", "web access logs", "external authentication logs"],
        "Execution": ["process execution logs", "script block logs", "endpoint telemetry"],
        "Persistence": ["startup entries", "scheduled task artifacts", "registry autorun keys"],
        "Privilege Escalation": ["token usage events", "admin group changes", "security event IDs"],
        "Defense Evasion": ["EDR tamper logs", "log deletion events", "service state changes"],
        "Credential Access": ["authentication failures", "LSASS access telemetry", "password reset trails"],
        "Discovery": ["system inventory commands", "network scan traces", "account enumeration logs"],
        "Lateral Movement": ["remote service logs", "RDP session history", "SMB share access logs"],
        "Command and Control": ["DNS query anomalies", "outbound proxy logs", "beaconing intervals"],
        "Collection": ["file archive creation", "sensitive directory access", "bulk read activity"],
        "Exfiltration": ["egress transfer logs", "cloud upload records", "DLP alerts"],
        "Impact": ["ransom notes", "mass file changes", "recovery service disablement"],
    }

    BASELINE_HINT_KEYWORDS = [
        "authenticated",
        "session initialized",
        "baseline",
        "within normal",
        "within baseline",
        "allowed",
        "no policy",
        "tls verified",
        "idle",
        "screen locked",
        "unlocked",
        "scan: clean",
    ]

    FLOW_BUCKETS: List[Dict[str, Any]] = [
        {
            "key": "delivery",
            "title": "Suspicious Message or Delivery",
            "summary": (
                "Potentially malicious content or trust-control anomalies were observed, "
                "indicating an external entry path into the environment."
            ),
            "keywords": [
                "phish",
                "spoof",
                "urgent",
                "verify",
                "spf",
                "dkim",
                "dmarc",
                "suspicious domain",
                "reputation",
                "legacy exception",
            ],
            "related_stages": ["Initial Access"],
        },
        {
            "key": "interaction",
            "title": "User Interaction and Trust Decision",
            "summary": (
                "User actions moved the event from passive exposure to active risk, "
                "including opening, clicking, or approving suspicious prompts."
            ),
            "keywords": [
                "opened message",
                "opened email",
                "clicked hyperlink",
                "clicked link",
                "user override",
                "override prompted",
                "override accepted",
                "form submitted",
                "uac prompt",
                "approved",
            ],
            "related_stages": ["Initial Access", "Execution"],
        },
        {
            "key": "execution",
            "title": "Payload Download and Execution",
            "summary": (
                "Execution behaviors were observed, including suspicious binaries, script interpreters, "
                "or process chains consistent with malware activation."
            ),
            "keywords": [
                ".exe",
                "executed",
                "powershell",
                "cmd.exe",
                "base64",
                "memory injection",
                "process chain",
                "obfuscation",
                "payload",
                "trojan",
                "malware",
            ],
            "related_stages": ["Execution", "Defense Evasion"],
        },
        {
            "key": "foothold",
            "title": "Malware Foothold and Remote Control",
            "summary": (
                "Post-execution behaviors suggest foothold establishment, such as persistence mechanisms "
                "or outbound control-channel communication."
            ),
            "keywords": [
                "scheduled task",
                "registry",
                "run key",
                "persistence",
                "loader",
                "c2",
                "command and control",
                "outbound https",
                "beacon",
                "certificate mismatch",
            ],
            "related_stages": ["Persistence", "Command and Control"],
        },
        {
            "key": "response",
            "title": "Detection and Containment",
            "summary": (
                "Security controls and responders detected the sequence, correlated incident evidence, "
                "and initiated containment/recovery actions."
            ),
            "keywords": [
                "alert",
                "siem",
                "incident",
                "correlation",
                "ticket",
                "isolated",
                "segmentation",
                "quarantined",
                "blocked",
                "escalated",
                "containment",
                "credential reset",
                "threat hunt",
                "forensic",
            ],
            "related_stages": ["Impact"],
        },
    ]

    SUSPICIOUS_SIGNAL_KEYWORDS = sorted(
        {
            keyword
            for bucket in FLOW_BUCKETS
            for keyword in bucket["keywords"]
        }
    )

    def __init__(self, session: Session, user_id: str):
        self.session = session
        self.user_id = user_id

    def _parse_timestamp(self, value: Any) -> str:
        if not value:
            return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

        if isinstance(value, str):
            try:
                dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
            except Exception:
                return value

        if isinstance(value, (int, float)):
            try:
                timestamp = float(value)
                if timestamp > 9999999999:
                    timestamp = timestamp / 1000.0
                dt = datetime.fromtimestamp(timestamp, tz=timezone.utc)
                return dt.isoformat().replace("+00:00", "Z")
            except Exception:
                return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

        timestamp_fn = getattr(value, "isoformat", None)
        if callable(timestamp_fn):
            try:
                return self._parse_timestamp(timestamp_fn())
            except Exception:
                return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

        return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    def _check_case_access(self, case_id: str) -> bool:
        result = self.session.run(
            """
            MATCH (u:User {id: $user_id})-[:CREATED]->(c:Case {case_id: $case_id})
            RETURN c.case_id as case_id
            """,
            user_id=self.user_id,
            case_id=case_id,
        ).single()
        return bool(result)

    def _to_datetime(self, timestamp_iso: str) -> Optional[datetime]:
        if not timestamp_iso:
            return None
        try:
            dt = datetime.fromisoformat(timestamp_iso.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except Exception:
            return None

    def _format_time_window(self, events: List[Dict[str, Any]]) -> str:
        if not events:
            return "Unknown"

        start = events[0].get("timestamp_dt")
        end = events[-1].get("timestamp_dt")
        if not isinstance(start, datetime) or not isinstance(end, datetime):
            return "Unknown"

        if start.date() == end.date():
            if start.hour == end.hour and start.minute == end.minute:
                return start.strftime("%H:%M")
            return f"{start.strftime('%H:%M')} - {end.strftime('%H:%M')}"
        return f"{start.strftime('%Y-%m-%d %H:%M')} - {end.strftime('%Y-%m-%d %H:%M')}"

    def _event_contains_any(self, event: Dict[str, Any], keywords: List[str]) -> bool:
        haystack = event.get("text") or ""
        return any(keyword in haystack for keyword in keywords)

    def _extract_matched_signals(self, events: List[Dict[str, Any]], keywords: List[str]) -> List[str]:
        found: List[str] = []
        for keyword in keywords:
            if any(keyword in (event.get("text") or "") for event in events):
                found.append(keyword)
            if len(found) >= 3:
                break
        return found

    def _coerce_line_timestamp(
        self,
        line: str,
        fallback_dt: Optional[datetime],
        line_index: int,
    ):
        explicit_match = re.match(
            r"^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?",
            line,
        )
        if explicit_match:
            dt = datetime(
                year=int(explicit_match.group(1)[0:4]),
                month=int(explicit_match.group(1)[5:7]),
                day=int(explicit_match.group(1)[8:10]),
                hour=int(explicit_match.group(2)),
                minute=int(explicit_match.group(3)),
                second=int(explicit_match.group(4)),
                tzinfo=timezone.utc,
            )
            iso = dt.isoformat().replace("+00:00", "Z")
            return iso, dt, True

        time_only_match = re.match(r"^\[?(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?\]?", line)
        if time_only_match:
            base_date = fallback_dt.date() if isinstance(fallback_dt, datetime) else datetime.now(timezone.utc).date()
            dt = datetime(
                year=base_date.year,
                month=base_date.month,
                day=base_date.day,
                hour=int(time_only_match.group(1)),
                minute=int(time_only_match.group(2)),
                second=int(time_only_match.group(3)),
                tzinfo=timezone.utc,
            )
            iso = dt.isoformat().replace("+00:00", "Z")
            return iso, dt, True

        if isinstance(fallback_dt, datetime):
            dt = fallback_dt + timedelta(seconds=line_index)
        else:
            dt = datetime.now(timezone.utc) + timedelta(seconds=line_index)
        iso = dt.isoformat().replace("+00:00", "Z")
        return iso, dt, False

    def _extract_description_from_line(self, line: str) -> str:
        text = line.strip()
        if "|" in text:
            parts = [part.strip() for part in text.split("|") if part.strip()]
            if parts:
                text = parts[-1]

        text = re.sub(r"^\[[^\]]+\]\s*", "", text)
        text = re.sub(r"^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:-\d{2}:\d{2}:\d{2})?\s*", "", text)
        text = text.strip()
        return text or line.strip()

    def _compute_line_risk(self, line: str, base_risk: float) -> float:
        line_lower = line.lower()
        boost = 0.0

        if "crit" in line_lower or "critical" in line_lower:
            boost += 0.35
        elif "alert" in line_lower:
            boost += 0.25
        elif "warn" in line_lower or "warning" in line_lower:
            boost += 0.15
        elif "error" in line_lower:
            boost += 0.10

        if any(
            marker in line_lower
            for marker in [
                "malware",
                "trojan",
                "ransomware",
                "payload",
                "injection",
                "c2",
                "command and control",
                "persistence",
            ]
        ):
            boost += 0.20

        return min(1.0, max(base_risk, base_risk + boost))

    def _split_compact_log_entries(self, text: str) -> List[str]:
        compact = re.sub(r"\s+", " ", text or "").strip()
        if not compact:
            return []

        boundary_pattern = re.compile(
            r"(\[\d{2}:\d{2}:\d{2}(?:\.\d+)?\]|\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?)"
        )
        matches = list(boundary_pattern.finditer(compact))
        if len(matches) < 2:
            return [compact]

        records: List[str] = []
        for index, match in enumerate(matches):
            start = match.start()
            end = matches[index + 1].start() if index + 1 < len(matches) else len(compact)
            candidate = compact[start:end].strip()
            if candidate:
                records.append(candidate)

        return records if len(records) >= 2 else [compact]

    def _explode_chunk_events(
        self,
        chunk_id: str,
        chunk_timestamp_iso: str,
        chunk_text: str,
        source: str,
        entities: List[str],
        base_risk: float,
        chunk_order: int,
    ) -> List[Dict[str, Any]]:
        fallback_dt = self._to_datetime(chunk_timestamp_iso)
        line_candidates = [
            line.strip()
            for line in chunk_text.splitlines()
            if line.strip() and not line.strip().startswith("#")
        ]

        lines = line_candidates
        if len(lines) <= 1:
            lines = self._split_compact_log_entries(chunk_text)

        if not lines:
            lines = [chunk_text.strip()] if chunk_text.strip() else []

        parsed_events: List[Dict[str, Any]] = []
        explicit_timestamp_lines = 0
        for line_index, line in enumerate(lines):
            timestamp_iso, timestamp_dt, has_explicit_ts = self._coerce_line_timestamp(
                line,
                fallback_dt,
                line_index,
            )
            if has_explicit_ts:
                explicit_timestamp_lines += 1

            description = self._extract_description_from_line(line)
            if len(description) > 220:
                description = f"{description[:220].rstrip()}..."

            parsed_events.append(
                {
                    "id": f"{chunk_id}:{line_index}",
                    "timestamp": timestamp_iso,
                    "timestamp_dt": timestamp_dt,
                    "text": line.lower(),
                    "raw_text": line,
                    "description": description,
                    "source": source,
                    "entities": entities,
                    "risk_score": self._compute_line_risk(line, base_risk),
                    "order": (chunk_order * 1000) + line_index,
                }
            )

        should_expand = len(parsed_events) >= 4 and explicit_timestamp_lines >= 2
        if should_expand:
            return parsed_events

        fallback_description = chunk_text.strip()
        if len(fallback_description) > 220:
            fallback_description = f"{fallback_description[:220].rstrip()}..."

        return [
            {
                "id": chunk_id,
                "timestamp": chunk_timestamp_iso,
                "timestamp_dt": fallback_dt,
                "text": chunk_text.lower(),
                "raw_text": chunk_text,
                "description": fallback_description,
                "source": source,
                "entities": entities,
                "risk_score": max(0.0, min(base_risk, 1.0)),
                "order": chunk_order,
            }
        ]

    def _format_actor_name(self, raw_name: str) -> str:
        if not raw_name:
            return "The user"
        cleaned = re.sub(r"[^A-Za-z0-9]+", " ", raw_name).strip()
        if not cleaned:
            return "The user"

        lowered = cleaned.lower()
        if lowered in {"system", "unknown", "exch mta", "kernel"}:
            return "The user"

        tokens = [token.title() for token in cleaned.split() if token]
        if not tokens:
            return "The user"
        return " ".join(tokens[:3])

    def _extract_actor_from_events(self, events: List[Dict[str, Any]]) -> str:
        for event in events:
            raw_text = event.get("raw_text") or event.get("description") or ""
            if not raw_text:
                continue

            if "|" in raw_text:
                parts = [part.strip() for part in raw_text.split("|")]
                if len(parts) >= 6:
                    candidate = parts[4]
                    actor = self._format_actor_name(candidate)
                    if actor != "The user":
                        return actor

            user_match = re.search(r"\buser\s+([A-Za-z][A-Za-z0-9._-]*)", raw_text, re.IGNORECASE)
            if user_match:
                actor = self._format_actor_name(user_match.group(1))
                if actor != "The user":
                    return actor

        return "The user"

    def _load_case_events(self, case_id: str) -> List[Dict[str, Any]]:
        results = self.session.run(
            """
            MATCH (u:User {id: $user_id})-[:CREATED]->(c:Case {case_id: $case_id})
            MATCH (c)-[:HAS_EVIDENCE]->(e:Evidence)-[:HAS_CHUNK]->(ch:Chunk)
            OPTIONAL MATCH (ch)-[:MENTIONS]->(ent:Entity)
            WITH ch, e,
                 collect(DISTINCT ent.name) as entity_names,
                 COALESCE(ch.timestamp, e.uploaded_at) as ts,
                 COALESCE(ch.risk_score, 0.0) as risk
            RETURN ch.chunk_id as chunk_id,
                   ts as timestamp,
                   ch.text as text,
                   risk as risk_score,
                   e.filename as filename,
                   entity_names
            ORDER BY ts ASC
            """,
            user_id=self.user_id,
            case_id=case_id,
        )

        events: List[Dict[str, Any]] = []
        for index, record in enumerate(results):
            raw_text = (record["text"] or "").strip()
            entities = [name for name in (record["entity_names"] or []) if name]
            timestamp_iso = self._parse_timestamp(record["timestamp"])

            risk_score = record["risk_score"] if record["risk_score"] is not None else 0.0
            try:
                risk_score = float(risk_score)
            except (TypeError, ValueError):
                risk_score = 0.0

            chunk_id = record["chunk_id"] or f"event-{index}"
            chunk_events = self._explode_chunk_events(
                chunk_id=chunk_id,
                chunk_timestamp_iso=timestamp_iso,
                chunk_text=raw_text,
                source=record["filename"] or "Unknown",
                entities=entities,
                base_risk=max(0.0, min(risk_score, 1.0)),
                chunk_order=index,
            )
            events.extend(chunk_events)

        max_dt = datetime.max.replace(tzinfo=timezone.utc)
        events.sort(key=lambda event: (event.get("timestamp_dt") or max_dt, event.get("order", 0)))
        for event_index, event in enumerate(events):
            event["order"] = event_index
            if not event.get("timestamp"):
                timestamp_dt = event.get("timestamp_dt")
                if isinstance(timestamp_dt, datetime):
                    event["timestamp"] = timestamp_dt.isoformat().replace("+00:00", "Z")
                else:
                    event["timestamp"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

        return events

    def _score_match(
        self,
        risk_score: float,
        hit_count: int,
        keyword_count: int,
        entity_count: int,
    ) -> float:
        normalized_hits = min(hit_count / max(keyword_count, 1), 1.0)
        entity_bonus = 0.05 if entity_count > 0 else 0.0
        score = 0.25 + (0.40 * risk_score) + (0.25 * normalized_hits) + entity_bonus
        return round(min(score, 0.99), 2)

    def _infer_techniques(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        buckets: Dict[str, Dict[str, Any]] = {}

        for event in events:
            if not event["text"]:
                continue

            for template in self.TECHNIQUE_LIBRARY:
                matched_terms = [
                    term for term in template["keywords"] if term in event["text"]
                ]
                if not matched_terms:
                    continue

                technique_id = template["technique_id"]
                bucket = buckets.setdefault(
                    technique_id,
                    {
                        "technique_id": template["technique_id"],
                        "technique_name": template["technique_name"],
                        "tactic": template["tactic"],
                        "stage": template["stage"],
                        "scores": [],
                        "event_ids": set(),
                        "hit_terms": set(),
                    },
                )

                score = self._score_match(
                    event["risk_score"],
                    len(matched_terms),
                    len(template["keywords"]),
                    len(event["entities"]),
                )
                bucket["scores"].append(score)
                bucket["event_ids"].add(event["id"])
                for term in matched_terms:
                    bucket["hit_terms"].add(term)

        techniques: List[Dict[str, Any]] = []
        for bucket in buckets.values():
            scores = bucket["scores"]
            if not scores:
                continue

            average_score = sum(scores) / len(scores)
            event_count = len(bucket["event_ids"])
            confidence = min(0.99, average_score + min(event_count, 3) * 0.03)

            matched_terms = sorted(bucket["hit_terms"])
            rationale = (
                f"Matched terms: {', '.join(matched_terms[:4])}. "
                f"Observed in {event_count} timeline event(s)."
            )

            techniques.append(
                {
                    "technique_id": bucket["technique_id"],
                    "technique_name": bucket["technique_name"],
                    "tactic": bucket["tactic"],
                    "stage": bucket["stage"],
                    "confidence": round(confidence, 2),
                    "evidence_event_ids": sorted(bucket["event_ids"]),
                    "rationale": rationale,
                }
            )

        techniques.sort(
            key=lambda item: (
                self.STAGE_ORDER.index(item["stage"]) if item["stage"] in self.STAGE_ORDER else len(self.STAGE_ORDER),
                item["confidence"],
            ),
            reverse=False,
        )
        return techniques

    def _build_stage_view(
        self,
        techniques: List[Dict[str, Any]],
        events: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        event_order = {event["id"]: event["order"] for event in events}
        stage_map: Dict[str, Dict[str, Any]] = {}

        for technique in techniques:
            stage_name = technique["stage"]
            stage_bucket = stage_map.setdefault(
                stage_name,
                {
                    "stage": stage_name,
                    "techniques": [],
                    "event_ids": [],
                    "confidence_values": [],
                },
            )
            stage_bucket["techniques"].append(technique)
            stage_bucket["event_ids"].extend(technique["evidence_event_ids"])
            stage_bucket["confidence_values"].append(technique["confidence"])

        stages: List[Dict[str, Any]] = []
        for stage_name in self.STAGE_ORDER:
            if stage_name not in stage_map:
                continue

            stage_bucket = stage_map[stage_name]
            confidence_values = stage_bucket["confidence_values"]
            if not confidence_values:
                continue

            unique_event_ids = sorted(
                set(stage_bucket["event_ids"]),
                key=lambda event_id: event_order.get(event_id, 999999),
            )
            sorted_techniques = sorted(
                stage_bucket["techniques"],
                key=lambda item: item["confidence"],
                reverse=True,
            )
            top_confidence = max(confidence_values)
            average_confidence = sum(confidence_values) / len(confidence_values)
            coverage_bonus = min(len(unique_event_ids) * 0.03, 0.15)
            stage_confidence = min(
                0.99,
                (0.55 * top_confidence) + (0.45 * average_confidence) + coverage_bonus,
            )

            stages.append(
                {
                    "stage": stage_name,
                    "confidence": round(stage_confidence, 2),
                    "summary": (
                        f"Mapped {len(sorted_techniques)} MITRE technique(s) across "
                        f"{len(unique_event_ids)} timeline event(s)."
                    ),
                    "event_count": len(unique_event_ids),
                    "techniques": sorted_techniques,
                }
            )

        return stages

    def _compute_overall_confidence(self, stages: List[Dict[str, Any]]) -> float:
        if not stages:
            return 0.0
        average_stage_confidence = sum(stage["confidence"] for stage in stages) / len(stages)
        stage_coverage = len(stages) / len(self.STAGE_ORDER)
        overall = (0.80 * average_stage_confidence) + (0.20 * stage_coverage)
        return round(min(overall, 0.99), 2)

    def _derive_chain_status(self, stages: List[Dict[str, Any]]) -> str:
        if not stages:
            return "insufficient_signal"

        stage_names = {stage["stage"] for stage in stages}
        if (
            len(stage_names) >= 6
            and "Initial Access" in stage_names
            and ("Exfiltration" in stage_names or "Impact" in stage_names)
        ):
            return "probable_end_to_end"
        if len(stage_names) >= 3:
            return "multi_stage"
        return "early_stage"

    def _build_stage_gaps(self, detected_stages: List[str]) -> List[Dict[str, Any]]:
        detected_set = set(detected_stages)
        stage_index = {name: idx for idx, name in enumerate(self.STAGE_ORDER)}

        candidate_stages: List[str] = []
        if not detected_set:
            candidate_stages = self.STAGE_ORDER[:4]
        else:
            last_detected_index = max(stage_index[name] for name in detected_set if name in stage_index)
            for offset in range(1, 5):
                idx = last_detected_index + offset
                if idx >= len(self.STAGE_ORDER):
                    break
                stage_name = self.STAGE_ORDER[idx]
                if stage_name not in detected_set:
                    candidate_stages.append(stage_name)

            if len(candidate_stages) < 3:
                for stage_name in self.STAGE_ORDER:
                    if stage_name in detected_set or stage_name in candidate_stages:
                        continue
                    candidate_stages.append(stage_name)
                    if len(candidate_stages) >= 4:
                        break

        gaps: List[Dict[str, Any]] = []
        for stage_name in candidate_stages[:4]:
            gaps.append(
                {
                    "stage": stage_name,
                    "reason": f"No high-confidence evidence currently maps to {stage_name.lower()}.",
                    "recommended_artifacts": self.STAGE_GAP_GUIDANCE.get(
                        stage_name,
                        ["host logs", "network logs", "identity logs"],
                    ),
                }
            )
        return gaps

    def _extract_action_phrase(self, event: Dict[str, Any]) -> str:
        raw_text = (event.get("raw_text") or event.get("description") or "").strip()
        if not raw_text:
            return ""

        if "|" in raw_text:
            parts = [part.strip() for part in raw_text.split("|") if part.strip()]
            if parts:
                raw_text = parts[-1]

        raw_text = re.sub(r"^user\s+[A-Za-z0-9._-]+\s*", "", raw_text, flags=re.IGNORECASE)
        raw_text = raw_text.strip().strip('"').rstrip(".")

        if len(raw_text) > 140:
            raw_text = f"{raw_text[:137].rstrip()}..."
        return raw_text

    def _summarize_actions(self, events: List[Dict[str, Any]], max_items: int = 3) -> List[str]:
        actions: List[str] = []
        seen = set()

        for event in events:
            phrase = self._extract_action_phrase(event)
            if not phrase:
                continue

            normalized = re.sub(r"[^a-z0-9]+", " ", phrase.lower()).strip()
            if not normalized or normalized in seen:
                continue

            seen.add(normalized)
            actions.append(phrase)
            if len(actions) >= max_items:
                break

        return actions

    def _compose_flow_summary(
        self,
        step_key: str,
        base_summary: str,
        actor_name: str,
        events: List[Dict[str, Any]],
        signals: List[str],
    ) -> str:
        actions = self._summarize_actions(events)
        action_text = "; ".join(actions)
        actor = actor_name if actor_name else "The user"
        signal_text = ", ".join(signals)

        if step_key == "baseline":
            if action_text:
                return f"{actor} appears to perform routine work before compromise indicators appear: {action_text}."
            return f"{actor} appears to perform routine work before compromise indicators appear."

        if step_key == "delivery":
            if action_text and signal_text:
                return f"A suspicious delivery phase begins: {action_text}. Notable indicators include {signal_text}."
            if action_text:
                return f"A suspicious delivery phase begins: {action_text}."
            return base_summary

        if step_key == "interaction":
            if action_text:
                return f"{actor} then interacts with suspicious content: {action_text}."
            return f"{actor} then interacts with suspicious content, increasing compromise risk."

        if step_key == "execution":
            if action_text:
                return f"The sequence progresses to execution behavior: {action_text}."
            return "The sequence progresses to execution behavior associated with malware activation."

        if step_key == "foothold":
            if action_text:
                return f"Malware foothold behavior appears, including persistence or remote control activity: {action_text}."
            return "Malware foothold behavior appears, including persistence or remote control activity."

        if step_key == "response":
            if action_text:
                return f"Detection and response actions follow: {action_text}."
            return "Detection and response actions follow to contain the incident."

        if step_key == "escalation":
            if action_text:
                return f"Additional high-risk telemetry indicates escalation: {action_text}."
            return "Additional high-risk telemetry indicates escalation and supports deeper investigation."

        if action_text:
            return f"{base_summary} Observed activity: {action_text}."
        return base_summary

    def _build_flow_step(
        self,
        step_key: str,
        title: str,
        base_summary: str,
        events: List[Dict[str, Any]],
        related_stages: List[str],
        signal_keywords: List[str],
        actor_name: str,
    ) -> Dict[str, Any]:
        signals = self._extract_matched_signals(events, signal_keywords)
        summary = self._compose_flow_summary(
            step_key=step_key,
            base_summary=base_summary,
            actor_name=actor_name,
            events=events,
            signals=signals,
        )

        return {
            "title": title,
            "time_window": self._format_time_window(events),
            "summary": summary,
            "related_stages": related_stages,
            "supporting_event_ids": [event["id"] for event in events[:6]],
        }

    def _infer_baseline_events(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not events:
            return []

        first_suspicious_index: Optional[int] = None
        for idx, event in enumerate(events):
            is_keyword_suspicious = self._event_contains_any(event, self.SUSPICIOUS_SIGNAL_KEYWORDS)
            is_risk_suspicious = float(event.get("risk_score") or 0.0) >= 0.65
            if is_keyword_suspicious or is_risk_suspicious:
                first_suspicious_index = idx
                break

        if first_suspicious_index is None:
            avg_risk = sum(float(event.get("risk_score") or 0.0) for event in events) / max(len(events), 1)
            if len(events) >= 3 and avg_risk < 0.45:
                return events
            return []

        candidate = events[:first_suspicious_index]
        if len(candidate) >= 2:
            return candidate

        keyword_only = [
            event
            for event in candidate
            if self._event_contains_any(event, self.BASELINE_HINT_KEYWORDS)
        ]
        return keyword_only if len(keyword_only) >= 2 else []

    def _build_logical_flow(
        self,
        events: List[Dict[str, Any]],
        stages: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        if not events:
            return []

        detected_stage_names = {stage["stage"] for stage in stages}
        actor_name = self._extract_actor_from_events(events)
        flow_steps: List[Dict[str, Any]] = []
        assigned_event_ids = set()

        baseline_events = self._infer_baseline_events(events)
        if baseline_events:
            baseline_step = self._build_flow_step(
                step_key="baseline",
                title="Baseline Activity",
                base_summary=(
                    "Routine user and system operations appeared consistent with normal behavior "
                    "and did not show immediate high-confidence compromise indicators."
                ),
                events=baseline_events,
                related_stages=[],
                signal_keywords=self.BASELINE_HINT_KEYWORDS,
                actor_name=actor_name,
            )
            baseline_step["_order"] = baseline_events[0]["order"]
            flow_steps.append(baseline_step)
            assigned_event_ids.update(event["id"] for event in baseline_events)

        for bucket in self.FLOW_BUCKETS:
            bucket_events = [
                event
                for event in events
                if event["id"] not in assigned_event_ids
                and self._event_contains_any(event, bucket["keywords"])
            ]
            if not bucket_events:
                continue

            related_stages = [
                stage_name
                for stage_name in bucket["related_stages"]
                if stage_name in detected_stage_names
            ]

            step = self._build_flow_step(
                step_key=bucket["key"],
                title=bucket["title"],
                base_summary=bucket["summary"],
                events=bucket_events,
                related_stages=related_stages,
                signal_keywords=bucket["keywords"],
                actor_name=actor_name,
            )
            step["_order"] = bucket_events[0]["order"]
            flow_steps.append(step)
            assigned_event_ids.update(event["id"] for event in bucket_events)

        leftover_high_risk = [
            event
            for event in events
            if event["id"] not in assigned_event_ids and float(event.get("risk_score") or 0.0) >= 0.75
        ]
        if leftover_high_risk:
            escalation_step = self._build_flow_step(
                step_key="escalation",
                title="Escalation Signals",
                base_summary=(
                    "Additional high-risk telemetry indicates escalation beyond expected behavior "
                    "and supports further analyst review."
                ),
                events=leftover_high_risk,
                related_stages=[],
                signal_keywords=[],
                actor_name=actor_name,
            )
            escalation_step["_order"] = leftover_high_risk[0]["order"]
            flow_steps.append(escalation_step)

        if not flow_steps and stages:
            stage_story_templates = {
                "Initial Access": "Signals indicate a likely initial entry path into the environment.",
                "Execution": "Observed behavior suggests attacker code or script execution.",
                "Persistence": "Evidence indicates mechanisms likely intended to survive reboot or logoff.",
                "Privilege Escalation": "Activity suggests attempts to increase privilege or access scope.",
                "Defense Evasion": "Behavior appears consistent with attempts to reduce detection visibility.",
                "Credential Access": "Telemetry suggests credential targeting or credential theft behavior.",
                "Discovery": "Events indicate internal discovery of users, hosts, or system information.",
                "Lateral Movement": "Evidence suggests movement from one host/session to another.",
                "Command and Control": "Outbound patterns indicate possible remote attacker control.",
                "Collection": "Data collection behavior is visible prior to potential exfiltration.",
                "Exfiltration": "Signals indicate potential data transfer out of controlled boundaries.",
                "Impact": "High-severity effects were observed on systems, data, or availability.",
            }

            event_by_id = {event["id"]: event for event in events}
            for stage in stages:
                technique_event_ids: List[str] = []
                for technique in stage.get("techniques", []):
                    technique_event_ids.extend(technique.get("evidence_event_ids", []))

                stage_events = [
                    event_by_id[event_id]
                    for event_id in dict.fromkeys(technique_event_ids)
                    if event_id in event_by_id
                ]
                if not stage_events:
                    continue

                fallback_step = self._build_flow_step(
                    step_key="stage_fallback",
                    title=stage["stage"],
                    base_summary=stage_story_templates.get(
                        stage["stage"],
                        "Evidence indicates activity consistent with this stage in the attack lifecycle.",
                    ),
                    events=stage_events,
                    related_stages=[stage["stage"]],
                    signal_keywords=[],
                    actor_name=actor_name,
                )
                fallback_step["_order"] = stage_events[0]["order"]
                flow_steps.append(fallback_step)

        if not flow_steps:
            default_events = events[: min(5, len(events))]
            default_step = self._build_flow_step(
                step_key="default",
                title="Observed Event Sequence",
                base_summary=(
                    "Collected telemetry forms a chronological sequence that should be reviewed "
                    "for possible attack progression."
                ),
                events=default_events,
                related_stages=[],
                signal_keywords=[],
                actor_name=actor_name,
            )
            default_step["_order"] = default_events[0]["order"]
            flow_steps.append(default_step)

        flow_steps.sort(key=lambda item: item.get("_order", 999999))
        cleaned: List[Dict[str, Any]] = []
        for step in flow_steps:
            step.pop("_order", None)
            cleaned.append(step)
        return cleaned[:8]

    def _build_narrative_overview(self, logical_flow: List[Dict[str, Any]]) -> str:
        if not logical_flow:
            return "No clear end-to-end storyline could be derived from the available events."

        transitions = ["First", "Then", "Next", "After that", "Later", "Finally"]
        parts: List[str] = []
        for index, step in enumerate(logical_flow[:6]):
            summary = (step.get("summary") or "").strip()
            if not summary:
                continue
            if not summary.endswith("."):
                summary = f"{summary}."

            prefix = transitions[index] if index < len(transitions) else "Then"
            parts.append(f"{prefix}: {summary}")

        return " ".join(parts) if parts else "No clear end-to-end storyline could be derived from the available events."

    def reconstruct_attack_chain(self, case_id: str) -> Dict[str, Any]:
        if not self._check_case_access(case_id):
            raise ValueError("Case not found or access denied")

        events = self._load_case_events(case_id)
        techniques = self._infer_techniques(events)
        stages = self._build_stage_view(techniques, events)
        overall_confidence = self._compute_overall_confidence(stages)
        chain_status = self._derive_chain_status(stages)
        gaps = self._build_stage_gaps([stage["stage"] for stage in stages])
        logical_flow = self._build_logical_flow(events, stages)
        narrative_overview = self._build_narrative_overview(logical_flow)

        return {
            "case_id": case_id,
            "overall_confidence": overall_confidence,
            "chain_status": chain_status,
            "timeline_event_count": len(events),
            "identified_stages": stages,
            "uncovered_stages": gaps,
            "logical_flow": logical_flow,
            "narrative_overview": narrative_overview,
            "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }