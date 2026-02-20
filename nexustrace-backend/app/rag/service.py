import uuid
from neo4j import Session
from app.rag.retriever import Retriever
from app.rag.context_builder import ContextBuilder
from app.rag.generator import Generator
from app.schemas.rag import RAGQuery, RAGResponse, ExplanationResponse

class RAGService:
    def __init__(self, session: Session):
        self.session = session
        self.retriever = Retriever(session)
        self.context_builder = ContextBuilder()
        self.generator = Generator()

    def ask_question(self, user_id: str, query: RAGQuery) -> RAGResponse:
        # 1. Retrieve
        chunks = self.retriever.retrieve(user_id, query.case_id, query.question)
        
        # 2. Build Context
        context = self.context_builder.build_context(chunks)
        
        # 3. Generate
        result = self.generator.generate_answer(query.question, context)
        
        # 4. Store Query Logs (optional but good for XAI)
        query_id = str(uuid.uuid4())
        
        # Store retrieval trace in DB for XAI
        # We store the question and link to chunks that were retrieved
        cypher_log = """
        MATCH (u:User {id: $user_id})-[:CREATED]->(c:Case {case_id: $case_id})
        CREATE (q:Query {
            query_id: $query_id, 
            text: $text, 
            timestamp: timestamp(),
            answer: $answer
        })
        CREATE (c)-[:HAS_QUERY]->(q)
        WITH q
        UNWIND $chunks as chunk_data
        MATCH (ch:Chunk {chunk_id: chunk_data.chunk_id})
        CREATE (q)-[:RETRIEVED {score: chunk_data.score, source: chunk_data.source}]->(ch)
        """
        
        # Simplified chunk list for params
        chunk_params = [{"chunk_id": c["chunk_id"], "score": c.get("score"), "source": c.get("source")} for c in chunks]
        
        self.session.run(cypher_log, 
                         user_id=user_id,
                         case_id=query.case_id, 
                         query_id=query_id, 
                         text=query.question, 
                         answer=result.get("answer"),
                         chunks=chunk_params)
                         
        return RAGResponse(
            query_id=query_id,
            answer=result.get("answer", "Error"),
            cited_chunks=result.get("cited_chunks", []),
            reasoning_summary=result.get("reasoning_summary", ""),
            confidence_score=result.get("confidence_score", 0.0)
        )

    def get_explanation(self, query_id: str) -> ExplanationResponse:
        cypher = """
        MATCH (q:Query {query_id: $query_id})
        MATCH (q)-[r:RETRIEVED]->(ch:Chunk)
        OPTIONAL MATCH (ch)-[:MENTIONS]->(e:Entity)
        RETURN q.text as question, ch.chunk_id as chunk_id, ch.text as text, r.score as score, r.source as source, collect(e.name) as entities
        """
        results = self.session.run(cypher, query_id=query_id)
        
        chunks = []
        question = ""
        for record in results:
            question = record["question"]
            chunks.append({
                "chunk_id": record["chunk_id"],
                "text": record["text"],
                "score": record["score"],
                "source": record["source"],
                "entities": record["entities"]
            })
            
        return ExplanationResponse(
            query_id=query_id,
            question=question,
            retrieved_chunks=chunks,
            graph_expansion=[] # Could detail graph hops here if stored
        )
