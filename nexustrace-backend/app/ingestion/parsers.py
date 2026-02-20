import json
import csv
import io
import pypdf
from fastapi import UploadFile

def parse_txt(content: bytes) -> str:
    return content.decode("utf-8")

def parse_json(content: bytes) -> str:
    data = json.loads(content.decode("utf-8"))
    return json.dumps(data, indent=2)

def parse_csv(content: bytes) -> str:
    decoded = content.decode("utf-8")
    io_string = io.StringIO(decoded)
    reader = csv.reader(io_string)
    rows = [", ".join(row) for row in reader]
    return "\n".join(rows)

def parse_pdf(content: bytes) -> str:
    reader = pypdf.PdfReader(io.BytesIO(content))
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text

async def parse_file(file: UploadFile, file_type: str) -> str:
    content = await file.read()
    if file_type == "txt":
        return parse_txt(content)
    elif file_type == "json":
        return parse_json(content)
    elif file_type == "csv":
        return parse_csv(content)
    elif file_type == "pdf":
        return parse_pdf(content)
    else:
        # Fallback to text
        return parse_txt(content)
