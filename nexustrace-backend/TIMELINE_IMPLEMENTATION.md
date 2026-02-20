# Timeline & Prioritized Leads Implementation Summary

## ✅ What Was Implemented

### 1. **Timeline Endpoint** (`GET /graph/timeline/{caseId}`)

**Location:** `app/graph/router.py` + `app/graph/timeline.py`

**What it does:**
- Extracts chronological events from case evidence stored in Neo4j
- Automatically classifies events into 17+ types (Login, File Access, Email Sent, etc.)
- Includes entity mentions for each event
- Calculates risk scores based on content analysis
- Returns events sorted by timestamp

**Response Schema:** `TimelineEvent`
```python
{
    "id": str,              # Chunk ID
    "timestamp": str,       # ISO 8601 format
    "event_type": str,      # Auto-classified (Login, File Access, etc.)
    "description": str,     # Event description (truncated to 200 chars)
    "source": str,          # Evidence filename
    "entities": List[str],  # Mentioned entities
    "risk_score": float     # 0.0-1.0
}
```

**Event Classification:**
The system automatically detects event types from text content:
- Login/Logout events
- Login Failures
- File Access/Modification/Deletion
- Email Sent/Received
- Transactions
- Network Activity
- Database Access
- System Errors/Warnings
- Process Start/Stop
- API Requests
- Generic System Events

---

### 2. **Prioritized Leads Endpoint** (`GET /graph/prioritized/{caseId}`)

**Location:** `app/graph/router.py` + `app/graph/timeline.py`

**What it does:**
- Ranks entities by risk and importance
- Calculates risk scores based on:
  - Mention frequency across chunks
  - Average risk of associated chunks
  - Connection count to other entities
  - Suspicious activity patterns (failed attempts, sensitive access, data transfers)
- Generates intelligent reasons for prioritization
- Returns top 100 entities sorted by risk

**Response Schema:** `PrioritizedLead`
```python
{
    "id": str,              # Entity ID
    "entity": str,          # Entity name
    "entity_type": str,     # person, organization, location, email, ip, other
    "risk_score": float,    # 0.0-1.0
    "reason": str,          # Auto-generated explanation
    "connections": int,     # Number of connected entities
    "last_seen": str        # ISO 8601 timestamp
}
```

**Risk Calculation Factors:**
- Mention frequency (more mentions = higher risk)
- Average chunk risk scores
- Connection density in graph
- Pattern detection:
  - Failed/denied activities
  - Sensitive resource access
  - Data transfer activity
  - Flagged unusual behavior

**Reason Generation:**
Automatically generates explanations like:
- "Appears in 23 evidence chunks, connected to 47 other entities, involvement in failed/denied activities"
- "Mentioned 12 times across evidence, 8 connections, access to sensitive resources"
- "Single occurrence, 2 connections, low-risk profile"

---

### 3. **Enhanced Timestamp Extraction**

**Location:** `app/ingestion/chunker.py`

**Improvements:**
- Detects 7+ timestamp formats:
  - ISO 8601: `2024-02-15T14:30:00Z`
  - Common logs: `2024-02-15 14:30:00`
  - US format: `02/15/2024 14:30:00`
  - Apache/Nginx: `[15/Feb/2024:14:30:00 +0000]`
  - Syslog: `Feb 15 14:30:00`
  - Date only: `2024-02-15`
  - And more...
- Normalizes all timestamps to ISO 8601 format
- Handles timezone information

---

### 4. **Advanced Risk Scoring**

**Location:** `app/ai/metadata.py`

**10 Risk Factors Analyzed:**

1. **After-hours activity** (+0.2-0.35)
   - Non-business hours (before 9am, after 6pm)
   - Weekend activity

2. **Critical security keywords** (+0.25-0.35)
   - Breach, attack, exploit, malware, ransomware, exfiltration, etc.

3. **Warning/error indicators** (+0.1-0.2)
   - Failed, denied, error, critical, suspicious, anomalous

4. **Privileged access** (+0.15 per indicator, max 0.3)
   - root, admin, sudo, elevated privileges

5. **Sensitive data** (+0.1 per indicator, max 0.25)
   - password, credential, secret, token, confidential

6. **Network indicators** (+0.05 per IP, max 0.2)
   - IP addresses detected
   - External IPs (+0.15 bonus)

7. **Unusual ports** (+0.1 per non-standard port)
   - Ports other than 80, 443, 22, 21, 25, etc.

8. **Data transfer activity** (+0.08 per keyword, max 0.2)
   - download, upload, transfer, export

9. **Multiple failed attempts** (+0.05 per attempt over 3, max 0.25)
   - Detects patterns like "15 failed login attempts"

10. **Large data sizes** (+0.1-0.2)
    - Large file transfers (>1GB, >500MB)

**Total:** Capped at 1.0 (100% risk)

---

## 📊 Data Flow

```
Evidence Upload
    ↓
Chunking + Timestamp Extraction (enhanced)
    ↓
Entity Extraction
    ↓
Risk Scoring (10 factors)
    ↓
Neo4j Storage
    ↓
Timeline/Prioritized Endpoints
    ↓
Frontend Display
```

---

## 🧪 Testing

### Prerequisites:
1. Upload evidence with timestamps to a case
2. Get JWT token from login
3. Note your case ID

### Using the test script:
```bash
# Edit the script with your values
nano test_timeline_endpoints.sh

# Run tests
./test_timeline_endpoints.sh
```

### Manual testing:
```bash
# Timeline
curl -X GET "http://localhost:8000/graph/timeline/{case_id}" \
  -H "Authorization: Bearer {your_token}"

# Prioritized Leads
curl -X GET "http://localhost:8000/graph/prioritized/{case_id}" \
  -H "Authorization: Bearer {your_token}"
```

---

## 🔍 Example Responses

### Timeline Response:
```json
[
  {
    "id": "chunk_abc123",
    "timestamp": "2024-02-15T14:30:00Z",
    "event_type": "Login Failure",
    "description": "Failed SSH login attempt from 203.0.113.0 to server using credentials admin:password123",
    "source": "auth.log",
    "entities": ["203.0.113.0", "admin"],
    "risk_score": 0.85
  },
  {
    "id": "chunk_def456",
    "timestamp": "2024-02-15T14:32:15Z",
    "event_type": "File Access",
    "description": "User john.doe accessed /etc/shadow file at 14:32 from terminal session",
    "source": "audit.log",
    "entities": ["john.doe", "/etc/shadow"],
    "risk_score": 0.72
  }
]
```

### Prioritized Leads Response:
```json
[
  {
    "id": "ent_789xyz",
    "entity": "john.doe",
    "entity_type": "person",
    "risk_score": 0.92,
    "reason": "Appears in 23 evidence chunks, connected to 47 other entities, access to sensitive resources, involvement in failed/denied activities",
    "connections": 47,
    "last_seen": "2024-02-15T14:35:00Z"
  },
  {
    "id": "ent_456abc",
    "entity": "203.0.113.0",
    "entity_type": "ip",
    "risk_score": 0.85,
    "reason": "Mentioned 12 times across evidence, 8 connections, involvement in failed/denied activities",
    "connections": 8,
    "last_seen": "2024-02-15T14:30:00Z"
  }
]
```

---

## 🚀 Next Steps

1. **Restart the backend server** to load the new code
2. **Upload test evidence** with timestamps (logs, CSV files, etc.)
3. **Check the Timeline page** in the frontend
4. **Check the Prioritized Leads page** in the frontend

---

## 📝 Notes

- **No hardcoded data** - all responses come from Neo4j graph database
- **Intelligent event classification** - automatically detects event types
- **Smart risk scoring** - uses 10 different factors
- **Entity-centric analysis** - tracks connections in the graph
- **ISO 8601 timestamps** - standardized format across all responses
- **Automatic reason generation** - explains why entities are prioritized

---

## 🔧 Files Modified

1. `app/schemas/graph.py` - Added TimelineEvent and PrioritizedLead schemas
2. `app/graph/timeline.py` - Implemented timeline and prioritized logic
3. `app/graph/router.py` - Added response models and documentation
4. `app/ingestion/chunker.py` - Enhanced timestamp extraction (7+ formats)
5. `app/ai/metadata.py` - Advanced risk scoring (10 factors)

All implementations use **real data from Neo4j** and include **intelligent analysis** without any hardcoding.
