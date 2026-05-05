import uuid
from collections import Counter

from neo4j import Session
from app.rag.retriever import Retriever
from app.rag.context_builder import ContextBuilder
from app.rag.generator import Generator
from app.schemas.rag import RAGQuery, RAGResponse, ExplanationResponse, SourceAttribution
from fastapi import HTTPException

class RAGService:
    def __init__(self, session: Session):
        self.session = session
        self.retriever = Retriever(session)
        self.context_builder = ContextBuilder()
        self.generator = Generator()

    def ask_question(self, user_id: str, query: RAGQuery) -> RAGResponse:
        # 1. Retrieve
        chunks = self.retriever.retrieve(user_id, query.case_id, query.question)
        
        # 2. Build Context (with source attribution)
        context = self.context_builder.build_context(chunks)
        source_list = self.context_builder.get_source_list(chunks)
        
        # 3. Build chat history for conversation memory
        chat_history = None
        if query.chat_history:
            chat_history = [{"role": m.role, "content": m.content} for m in query.chat_history]
        
        # 4. Generate (with chat history for context continuity)
        result = self.generator.generate_answer(
            query.question,
            context,
            chat_history=chat_history,
            provider=query.provider,
        )
        
        # 5. Store Query Logs for XAI
        query_id = str(uuid.uuid4())
        
        # Store retrieval trace in DB for XAI
        # We store the question and link to chunks that were retrieved
        cypher_log = """
        MATCH (u:User {id: $user_id})-[:CREATED]->(c:Case {case_id: $case_id})
        CREATE (q:Query {
            query_id: $query_id, 
            text: $text, 
            timestamp: timestamp(),
            answer: $answer,
            reasoning_summary: $reasoning_summary,
            confidence_score: $confidence_score,
            provider_requested: $provider_requested,
            provider_used: $provider_used
        })
        CREATE (c)-[:HAS_QUERY]->(q)
        WITH q
        UNWIND $chunks as chunk_data
        MATCH (ch:Chunk {chunk_id: chunk_data.chunk_id})
        CREATE (q)-[:RETRIEVED {score: chunk_data.score, source: chunk_data.source}]->(ch)
        """
        
        # Simplified chunk list for params
        chunk_params = [{"chunk_id": c["chunk_id"], "score": c.get("score"), "source": c.get("source"), "filename": c.get("filename", "")} for c in chunks]
        
        self.session.run(cypher_log, 
                         user_id=user_id,
                         case_id=query.case_id, 
                         query_id=query_id, 
                         text=query.question, 
                         answer=result.get("answer"),
                         reasoning_summary=result.get("reasoning_summary", ""),
                         confidence_score=float(result.get("confidence_score", 0.0) or 0.0),
                         provider_requested=result.get("provider_requested", query.provider),
                         provider_used=result.get("provider_used", "unknown"),
                         chunks=chunk_params)
        
        # Build source attribution objects
        sources = [SourceAttribution(**s) for s in source_list]
                         
        return RAGResponse(
            query_id=query_id,
            answer=result.get("answer", "Error"),
            cited_chunks=result.get("cited_chunks", []),
            reasoning_summary=result.get("reasoning_summary", ""),
            confidence_score=result.get("confidence_score", 0.0),
            sources=sources,
            provider_requested=result.get("provider_requested", query.provider),
            provider_used=result.get("provider_used", "unknown"),
        )

    def _fallback_reasoning(self, chunks: list[dict], confidence_score: float) -> str:
        if not chunks:
            return "No retrieval trace is available for this response yet."

        source_counts = Counter(chunk.get("source", "unknown") for chunk in chunks)
        source_summary = ", ".join(f"{source} ({count})" for source, count in source_counts.items())
        top_chunk = chunks[0]
        top_score = top_chunk.get("similarity_score", 0.0)

        reasoning = (
            f"This answer was grounded in {len(chunks)} retrieved chunk(s) "
            f"across source types: {source_summary}."
        )

        if isinstance(top_score, (int, float)) and top_score > 0:
            reasoning += f" Top chunk similarity was {top_score * 100:.1f}%."

        if isinstance(confidence_score, (int, float)) and confidence_score > 0:
            reasoning += f" Model confidence was {confidence_score * 100:.0f}%."

        return reasoning

    def get_explanation(self, query_id: str) -> ExplanationResponse:
        cypher = """
        MATCH (q:Query {query_id: $query_id})
        OPTIONAL MATCH (q)-[r:RETRIEVED]->(ch:Chunk)
        OPTIONAL MATCH (ch)-[:MENTIONS]->(e:Entity)
        WITH q, ch, r, collect(DISTINCT e.name) as entities
        RETURN
            q.text as question,
            q.answer as answer,
            q.reasoning_summary as reasoning_summary,
            q.confidence_score as confidence_score,
            ch.chunk_id as chunk_id,
            ch.text as text,
            r.score as score,
            r.source as source,
            entities
        ORDER BY score DESC
        """
        rows = list(self.session.run(cypher, query_id=query_id))

        if not rows:
            raise HTTPException(status_code=404, detail="Query explanation not found")
        
        chunks = []
        question = rows[0].get("question") or ""
        reasoning_summary = rows[0].get("reasoning_summary") or ""
        confidence_score = rows[0].get("confidence_score") or 0.0

        for record in rows:
            chunk_id = record.get("chunk_id")
            if not chunk_id:
                continue

            entities = record.get("entities") or []
            score = record.get("score")
            chunks.append({
                "chunk_id": chunk_id,
                "content": record.get("text") or "",
                "similarity_score": float(score) if isinstance(score, (int, float)) else 0.0,
                "source": record.get("source") or "vector",
                "entities": [e for e in entities if isinstance(e, str) and e],
            })

        entity_counts = Counter()
        for chunk in chunks:
            for entity in chunk.get("entities", []):
                entity_counts[entity] += 1

        graph_path = [name for name, _count in entity_counts.most_common(8)]

        reasoning = reasoning_summary.strip() if isinstance(reasoning_summary, str) else ""
        if not reasoning:
            reasoning = self._fallback_reasoning(chunks, float(confidence_score or 0.0))
            
        return ExplanationResponse(
            query_id=query_id,
            retrieved_chunks=chunks,
            graph_path=graph_path,
            reasoning=reasoning,
            question=question,
            graph_expansion=[]
        )

    def get_query_history(self, case_id: str):
        """Get all queries for a specific case"""
        cypher = """
        MATCH (c:Case {case_id: $case_id})-[:HAS_QUERY]->(q:Query)
        OPTIONAL MATCH (q)-[r:RETRIEVED]->(ch:Chunk)
        WITH q, COUNT(DISTINCT ch) as chunks_count
        RETURN q.query_id as query_id, q.text as question, q.answer as answer, 
               q.timestamp as timestamp, $case_id as case_id, chunks_count as chunks_retrieved
        ORDER BY q.timestamp DESC
        """
        results = self.session.run(cypher, case_id=case_id)
        
        from app.schemas.rag import QueryHistory
        return [QueryHistory(**record) for record in results]

    def get_all_query_history(self, user_id: str):
        """Get all queries for all user's cases"""
        cypher = """
        MATCH (u:User {id: $user_id})-[:CREATED]->(c:Case)-[:HAS_QUERY]->(q:Query)
        OPTIONAL MATCH (q)-[r:RETRIEVED]->(ch:Chunk)
        WITH q, c.case_id as case_id, COUNT(DISTINCT ch) as chunks_count
        RETURN q.query_id as query_id, q.text as question, q.answer as answer,
               q.timestamp as timestamp, case_id, chunks_count as chunks_retrieved
        ORDER BY q.timestamp DESC
        """
        results = self.session.run(cypher, user_id=user_id)
        
        from app.schemas.rag import QueryHistory
        return [QueryHistory(**record) for record in results]

    def delete_query(self, user_id: str, case_id: str, query_id: str):
        """Delete a query history record that belongs to a user's case."""
        cypher = """
        MATCH (u:User {id: $user_id})-[:CREATED]->(c:Case {case_id: $case_id})-[:HAS_QUERY]->(q:Query {query_id: $query_id})
        OPTIONAL MATCH (f:Feedback)-[:LINKED_TO]->(q)
        WITH q, collect(DISTINCT f) as feedback_nodes
        FOREACH (fb IN feedback_nodes | DETACH DELETE fb)
        WITH q, size(feedback_nodes) as feedback_deleted
        DETACH DELETE q
        RETURN feedback_deleted
        """

        result = self.session.run(
            cypher,
            user_id=user_id,
            case_id=case_id,
            query_id=query_id,
        ).single()

        if not result:
            raise HTTPException(status_code=404, detail="Query not found for this case")

        return {
            "status": "deleted",
            "query_id": query_id,
            "case_id": case_id,
            "feedback_deleted": int(result.get("feedback_deleted", 0)),
        }
