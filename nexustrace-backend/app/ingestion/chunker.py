from typing import List, Dict, Any
from app.core.config import settings
import re
from datetime import datetime

def extract_timestamp(text: str) -> str:
    """Extract timestamp from text using multiple patterns"""
    # Define timestamp patterns in order of preference (most specific first)
    patterns = [
        # ISO 8601: 2024-02-15T14:30:00Z or 2024-02-15T14:30:00+00:00
        (r'\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?', '%Y-%m-%dT%H:%M:%S'),
        # Common log format: 2024-02-15 14:30:00
        (r'\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}', '%Y-%m-%d %H:%M:%S'),
        # Date with time: 02/15/2024 14:30:00 or 15/02/2024 14:30:00
        (r'\d{1,2}/\d{1,2}/\d{4}\s+\d{2}:\d{2}:\d{2}', '%m/%d/%Y %H:%M:%S'),
        # Apache/Nginx log: [15/Feb/2024:14:30:00 +0000]
        (r'\[(\d{2}/\w{3}/\d{4}:\d{2}:\d{2}:\d{2})\s+[+-]\d{4}\]', '%d/%b/%Y:%H:%M:%S'),
        # Syslog format: Feb 15 14:30:00
        (r'\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}', '%b %d %H:%M:%S'),
        # Date only: 2024-02-15
        (r'\d{4}-\d{2}-\d{2}', '%Y-%m-%d'),
        # US format: 02/15/2024
        (r'\d{1,2}/\d{1,2}/\d{4}', '%m/%d/%Y'),
    ]
    
    for pattern, date_format in patterns:
        match = re.search(pattern, text)
        if match:
            timestamp_str = match.group(1) if match.groups() else match.group(0)
            try:
                # Parse and convert to ISO 8601
                if 'T' in timestamp_str or 'Z' in timestamp_str or '+' in timestamp_str:
                    # Already ISO-ish format, clean it up
                    timestamp_str = timestamp_str.replace('Z', '+00:00')
                    try:
                        dt = datetime.fromisoformat(timestamp_str)
                        return dt.isoformat() + 'Z'
                    except:
                        # Try with just the date/time part
                        timestamp_str = re.sub(r'[+-]\d{2}:\d{2}$', '', timestamp_str)
                        dt = datetime.fromisoformat(timestamp_str)
                        return dt.isoformat() + 'Z'
                else:
                    # Parse with format and convert
                    if '%b' in date_format and '%Y' not in timestamp_str:
                        # Syslog doesn't have year, use current year
                        current_year = datetime.now().year
                        timestamp_str = f"{timestamp_str} {current_year}"
                        date_format = f"{date_format} %Y"
                    
                    dt = datetime.strptime(timestamp_str, date_format)
                    return dt.isoformat() + 'Z'
            except Exception as e:
                # If parsing fails, continue to next pattern
                continue
    
    return None

def chunk_text(text: str, evidence_id: str) -> List[Dict[str, Any]]:
    tokens = text.split()  # Simple whitespace tokenization for speed/simplicity
    chunk_size = settings.MAX_CHUNK_TOKENS
    overlap = settings.CHUNK_OVERLAP
    
    chunks = []
    start = 0
    total_tokens = len(tokens)
    
    chunk_index = 0
    
    while start < total_tokens:
        end = min(start + chunk_size, total_tokens)
        chunk_tokens = tokens[start:end]
        chunk_text_str = " ".join(chunk_tokens)
        
        # Extract timestamp from chunk text
        timestamp = extract_timestamp(chunk_text_str)

        chunks.append({
            "chunk_index": chunk_index,
            "text": chunk_text_str,
            "timestamp": timestamp,
            "evidence_id": evidence_id
        })
        
        chunk_index += 1
        start += (chunk_size - overlap)
        
    return chunks
