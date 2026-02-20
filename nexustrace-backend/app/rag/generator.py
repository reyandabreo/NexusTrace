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

    def generate_answer(self, question: str, context: str):
        system_prompt = """
        You are a forensic intelligence assistant. 
        Answer the user's question based ONLY on the provided context.
        You MUST verify your answer by citing the exact Chunk IDs in the format [Chunk ID].
        If the answer cannot be determined from the context, say "Insufficient data".
        
        Return your response in the following JSON format:
        {
            "answer": "Your comprehensive answer here",
            "cited_chunks": ["chunk_id_1", "chunk_id_2"],
            "reasoning_summary": "Brief explanation of how you derived the answer",
            "confidence_score": 0.0 to 1.0
        }
        """
        
        user_message = f"Question: {question}\n\nContext:\n{context}"
        
        try:
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.0
            )
            
            content = response.choices[0].message.content
            # Clean up potential markdown code blocks
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "")
            
            return json.loads(content)
        except Exception as e:
            # Fallback or error handling
            print(f"Error generating answer: {e}")
            return {
                "answer": "Error processing request.",
                "cited_chunks": [],
                "reasoning_summary": str(e),
                "confidence_score": 0.0
            }
