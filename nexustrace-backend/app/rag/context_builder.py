from typing import List, Dict, Any

class ContextBuilder:
    def build_context(self, chunks: List[Dict[str, Any]]) -> str:
        if not chunks:
            print("DEBUG: No chunks provided to context builder")
            return ""
        
        print(f"DEBUG: Building context from {len(chunks)} chunks")
        context_str = ""
        for chunk in chunks:
            source_info = f"[Chunk ID: {chunk['chunk_id']}]"
            if chunk.get("source") == "graph":
                source_info += f" (Linked via Entities: {chunk.get('shared_entities')})"
                
            context_str += f"{source_info}\n{chunk['text']}\n\n"
        return context_str
