from typing import List, Dict, Any

class ContextBuilder:
    def build_context(self, chunks: List[Dict[str, Any]]) -> str:
        if not chunks:
            print("DEBUG: No chunks provided to context builder")
            return ""
        
        print(f"DEBUG: Building context from {len(chunks)} chunks")
        context_str = ""
        for chunk in chunks:
            # Build rich source attribution header
            filename = chunk.get("filename", "Unknown")
            page = chunk.get("page_number")
            file_type = chunk.get("file_type", "")
            chunk_idx = chunk.get("chunk_index", 0)
            
            source_parts = [f"Source: {filename}"]
            if page:
                source_parts.append(f"Page {page}")
            source_parts.append(f"Chunk {chunk_idx}")
            source_parts.append(f"ID: {chunk['chunk_id']}")
            
            source_info = f"[{' | '.join(source_parts)}]"
            
            if chunk.get("source") == "graph":
                source_info += f" (Linked via Entities: {chunk.get('shared_entities')})"
            elif chunk.get("score"):
                source_info += f" (Relevance: {chunk['score']:.2f})"
                
            context_str += f"{source_info}\n{chunk['text']}\n\n"
        return context_str
    
    def get_source_list(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract deduplicated source information from chunks for attribution"""
        seen = set()
        sources = []
        for chunk in chunks:
            filename = chunk.get("filename", "Unknown")
            evidence_id = chunk.get("evidence_id", "")
            key = f"{evidence_id}:{filename}"
            if key not in seen:
                seen.add(key)
                source_entry = {
                    "filename": filename,
                    "evidence_id": evidence_id,
                    "file_type": chunk.get("file_type", ""),
                    "pages_referenced": [],
                }
                sources.append(source_entry)
            
            # Track page numbers per source
            page = chunk.get("page_number")
            if page:
                for s in sources:
                    if s["evidence_id"] == evidence_id and page not in s["pages_referenced"]:
                        s["pages_referenced"].append(page)
        
        return sources
