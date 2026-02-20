import re
from datetime import datetime

def calculate_risk_score(text: str, metadata: dict) -> float:
    """
    Calculate risk score for a chunk based on content analysis and metadata.
    Returns a float between 0.0 (low risk) and 1.0 (high risk).
    """
    score = 0.0
    text_lower = text.lower()
    
    # 1. Out of hours timestamp (Standard business hours: 9am-6pm)
    timestamp_str = metadata.get("timestamp")
    if timestamp_str:
        try:
            dt = datetime.fromisoformat(str(timestamp_str).replace('Z', '+00:00'))
            hour = dt.hour
            # After hours or weekend activity
            if hour < 9 or hour > 18:
                score += 0.2
            if dt.weekday() >= 5:  # Saturday or Sunday
                score += 0.15
        except:
            pass
    
    # 2. Critical security keywords (highest priority)
    critical_keywords = {
        'unauthorized': 0.25,
        'breach': 0.3,
        'attack': 0.3,
        'exploit': 0.3,
        'malware': 0.3,
        'ransomware': 0.35,
        'exfiltrat': 0.35,  # matches exfiltrate, exfiltration
        'backdoor': 0.3,
        'rootkit': 0.3,
        'privilege escalation': 0.3,
        'sql injection': 0.3,
        'cross-site scripting': 0.25,
        'brute force': 0.25,
    }
    
    for keyword, weight in critical_keywords.items():
        if keyword in text_lower:
            score += weight
    
    # 3. Warning/error indicators
    warning_keywords = {
        'failed': 0.15,
        'failure': 0.15,
        'denied': 0.2,
        'rejected': 0.15,
        'error': 0.1,
        'critical': 0.15,
        'alert': 0.15,
        'blocked': 0.15,
        'suspicious': 0.2,
        'anomalous': 0.2,
        'unusual': 0.15,
    }
    
    for keyword, weight in warning_keywords.items():
        if keyword in text_lower:
            score += weight
    
    # 4. Privileged access indicators
    privilege_keywords = [
        'root', 'admin', 'administrator', 'sudo', 'superuser',
        'system', 'elevated', 'privilege'
    ]
    privilege_count = sum(1 for kw in privilege_keywords if kw in text_lower)
    if privilege_count > 0:
        score += min(privilege_count * 0.15, 0.3)
    
    # 5. Sensitive data indicators
    sensitive_keywords = [
        'password', 'credential', 'secret', 'token', 'key',
        'confidential', 'private', 'sensitive', 'classified'
    ]
    sensitive_count = sum(1 for kw in sensitive_keywords if kw in text_lower)
    if sensitive_count > 0:
        score += min(sensitive_count * 0.1, 0.25)
    
    # 6. Network indicators (IPs, external connections)
    ips = re.findall(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', text)
    if ips:
        score += min(len(ips) * 0.05, 0.2)
    
    # Check for external/unknown IPs (not 192.168.x.x, 10.x.x.x, 127.x.x.x)
    external_ips = [ip for ip in ips if not (
        ip.startswith('192.168.') or 
        ip.startswith('10.') or 
        ip.startswith('127.') or
        ip.startswith('172.')
    )]
    if external_ips:
        score += 0.15
    
    # 7. Unusual ports
    unusual_ports = re.findall(r'\b(?:port|:)\s*(\d{4,5})\b', text_lower)
    if unusual_ports:
        for port in unusual_ports:
            port_num = int(port)
            # Non-standard ports (not 80, 443, 22, 21, 25, etc.)
            if port_num not in [80, 443, 22, 21, 25, 110, 143, 3306, 5432, 8080, 8443]:
                score += 0.1
    
    # 8. Data transfer indicators
    transfer_keywords = ['download', 'upload', 'transfer', 'export', 'copy', 'move']
    transfer_count = sum(1 for kw in transfer_keywords if kw in text_lower)
    if transfer_count > 0:
        score += min(transfer_count * 0.08, 0.2)
    
    # 9. Multiple failed attempts
    failed_match = re.search(r'(\d+)\s+(?:failed|attempt|tries)', text_lower)
    if failed_match:
        try:
            attempt_count = int(failed_match.group(1))
            if attempt_count > 3:
                score += min(0.05 * (attempt_count - 3), 0.25)
        except:
            pass
    
    # 10. Large data sizes (potential exfiltration)
    size_match = re.search(r'(\d+(?:\.\d+)?)\s*(gb|mb|tb)', text_lower)
    if size_match:
        try:
            size = float(size_match.group(1))
            unit = size_match.group(2)
            if (unit == 'gb' and size > 1) or (unit == 'tb'):
                score += 0.2
            elif unit == 'mb' and size > 500:
                score += 0.1
        except:
            pass
    
    # Cap at 1.0
    return min(score, 1.0)
