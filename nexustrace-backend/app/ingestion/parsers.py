import json
import csv
import io
import pypdf
from fastapi import UploadFile

def parse_txt(content: bytes) -> str:
    return content.decode("utf-8", errors="ignore")

def parse_json(content: bytes) -> str:
    data = json.loads(content.decode("utf-8"))
    return json.dumps(data, indent=2)

def parse_csv(content: bytes) -> str:
    """Parse CSV into structured markdown table for better LLM comprehension"""
    decoded = content.decode("utf-8", errors="ignore")
    io_string = io.StringIO(decoded)
    reader = csv.reader(io_string)
    rows = list(reader)
    
    if not rows:
        return ""
    
    # If first row looks like headers (non-numeric), treat as header
    header = rows[0]
    data_rows = rows[1:] if len(rows) > 1 else []
    
    # Build markdown table
    lines = []
    lines.append("| " + " | ".join(header) + " |")
    lines.append("| " + " | ".join(["---"] * len(header)) + " |")
    for row in data_rows:
        # Pad row if shorter than header
        padded = row + [""] * (len(header) - len(row))
        lines.append("| " + " | ".join(padded[:len(header)]) + " |")
    
    return "\n".join(lines)

def parse_pdf(content: bytes) -> dict:
    """Parse PDF and return text with page numbers for metadata enrichment"""
    reader = pypdf.PdfReader(io.BytesIO(content))
    pages = {}
    full_text = ""
    for i, page in enumerate(reader.pages):
        page_text = page.extract_text() or ""
        pages[i + 1] = page_text
        full_text += page_text + "\n"
    return {"text": full_text, "pages": pages, "total_pages": len(reader.pages)}

def parse_image(content: bytes, filename: str) -> str:
    """Extract text from images using OCR (pytesseract)"""
    try:
        from PIL import Image
        import pytesseract
        
        img = Image.open(io.BytesIO(content))
        text = pytesseract.image_to_string(img)
        
        if text.strip():
            return f"[OCR extracted from image: {filename}]\n\n{text.strip()}"
        else:
            return f"[Image file: {filename} — OCR could not extract readable text. Image size: {img.size}, Mode: {img.mode}]"
    except ImportError:
        # pytesseract or Pillow not installed — graceful fallback
        try:
            from PIL import Image
            img = Image.open(io.BytesIO(content))
            return f"[Image file: {filename} — OCR not available (install pytesseract). Image size: {img.size}, Mode: {img.mode}]"
        except Exception:
            return f"[Image file: {filename} — Could not process image]"
    except Exception as e:
        return f"[Image file: {filename} — OCR error: {str(e)}]"

def parse_docx(content: bytes) -> str:
    """Parse DOCX files"""
    try:
        from docx import Document
        doc = Document(io.BytesIO(content))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs)
    except ImportError:
        return "[DOCX parsing unavailable — install python-docx]"
    except Exception as e:
        return f"[DOCX parsing error: {str(e)}]"

async def parse_file(file: UploadFile, file_type: str) -> dict:
    """
    Parse file and return either a string or a dict with text + metadata.
    Returns dict with keys: text, pages (optional), total_pages (optional), file_type
    """
    content = await file.read()
    filename = file.filename or "unknown"
    
    result = {"file_type": file_type, "filename": filename}
    
    if file_type == "txt":
        result["text"] = parse_txt(content)
    elif file_type == "json":
        result["text"] = parse_json(content)
    elif file_type == "csv":
        result["text"] = parse_csv(content)
    elif file_type == "pdf":
        pdf_data = parse_pdf(content)
        result["text"] = pdf_data["text"]
        result["pages"] = pdf_data["pages"]
        result["total_pages"] = pdf_data["total_pages"]
    elif file_type in ["png", "jpg", "jpeg", "gif", "bmp", "tiff", "webp"]:
        result["text"] = parse_image(content, filename)
    elif file_type == "docx":
        result["text"] = parse_docx(content)
    else:
        # Fallback to text
        result["text"] = parse_txt(content)
    
    return result
