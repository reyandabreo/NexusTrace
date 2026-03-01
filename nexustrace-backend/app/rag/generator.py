from openai import OpenAI
import json
from app.core.config import settings

class Generator:
    def __init__(self):
        # Check if using OpenRouter (API key starts with sk-or-)
        if settings.OPENAI_API_KEY.startswith("sk-or-"):
            self.client = OpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url="https://openrouter.ai/api/v1"
            )
            print("DEBUG: Using OpenRouter API")
        else:
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
            print("DEBUG: Using OpenAI API")

    def generate_answer(self, question: str, context: str, chat_history: list = None):
        system_prompt = """
        You are a forensic intelligence assistant. 
        Answer the user's question based ONLY on the provided context from evidence documents.
        
        IMPORTANT RULES:
        1. Cite the specific source files in your answer using the format [Source: filename]. 
        2. If a page number is available, cite as [Source: filename, Page N].
        3. You MUST verify your answer by referencing the exact source documents.
        4. If the answer cannot be determined from the context, say "Insufficient data in the uploaded evidence."
        5. If the conversation history is provided, use it for context continuity but always ground answers in the evidence.
        
        Return your response in the following JSON format:
        {
            "answer": "Your comprehensive answer here with [Source: filename] citations inline",
            "cited_chunks": ["chunk_id_1", "chunk_id_2"],
            "reasoning_summary": "Brief explanation of how you derived the answer from the sources",
            "confidence_score": 0.0 to 1.0,
            "sources_used": ["filename1.pdf", "filename2.csv"]
        }
        """
        
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history for context continuity
        if chat_history:
            for msg in chat_history[-6:]:  # Last 3 turns (6 messages)
                messages.append({"role": msg["role"], "content": msg["content"]})
        
        user_message = f"Question: {question}\n\nEvidence Context:\n{context}"
        messages.append({"role": "user", "content": user_message})
        
        try:
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                temperature=0.0
            )
            
            content = response.choices[0].message.content
            # Clean up potential markdown code blocks
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "")
            elif content.startswith("```"):
                content = content.replace("```", "")
            
            parsed = json.loads(content.strip())
            # Ensure sources_used is present
            if "sources_used" not in parsed:
                parsed["sources_used"] = []
            return parsed
        except Exception as e:
            # Fallback or error handling
            print(f"Error generating answer: {e}")
            return {
                "answer": "Error processing request.",
                "cited_chunks": [],
                "reasoning_summary": str(e),
                "confidence_score": 0.0
            }
