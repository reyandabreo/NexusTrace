from neo4j import Session
from app.ai.embeddings import get_embedding
from app.core.config import settings

class Retriever:
    def __init__(self, session: Session):
        self.session = session

    def retrieve(self, user_id: str, case_id: str, question: str):
        # 1. Embed Question
        question_embedding = get_embedding(question)
        
        # 2. Vector Search using manual cosine similarity
        # Manual cosine similarity calculation that works without GDS library
        vector_query = """
        MATCH (u:User {id: $user_id})-[:CREATED]->(c:Case {case_id: $case_id})-[:HAS_EVIDENCE]->(:Evidence)-[:HAS_CHUNK]->(ch:Chunk)
        WHERE ch.embedding IS NOT NULL
        WITH ch, 
             reduce(dot = 0.0, i IN range(0, size(ch.embedding)-1) | dot + ch.embedding[i] * $embedding[i]) as dotProduct,
             reduce(norm1 = 0.0, i IN range(0, size(ch.embedding)-1) | norm1 + ch.embedding[i] * ch.embedding[i]) as norm1,
             reduce(norm2 = 0.0, i IN range(0, size($embedding)-1) | norm2 + $embedding[i] * $embedding[i]) as norm2
        WITH ch, dotProduct / (sqrt(norm1) * sqrt(norm2)) AS score
        WHERE score > 0.3
        RETURN ch, score
        ORDER BY score DESC
        LIMIT $top_k
        """
        
        results = self.session.run(vector_query, 
                                   user_id=user_id,
                                   case_id=case_id, 
                                   embedding=question_embedding, 
                                   top_k=settings.TOP_K_RETRIEVAL)
        
        print(f"DEBUG: Searching for chunks in case_id={case_id}, user_id={user_id}")
        
        vector_chunks = []
        for record in results:
            node = record["ch"]
            vector_chunks.append({
                "chunk_id": node["chunk_id"],
                "text": node["text"],
                "score": record["score"],
                "source": "vector"
            })
        
        print(f"DEBUG: Found {len(vector_chunks)} chunks via vector search")
        if vector_chunks:
            print(f"DEBUG: Top chunk score: {vector_chunks[0]['score']}")
        else:
            # Debug: Check if chunks exist at all for this case
            debug_query = """
            MATCH (c:Case {case_id: $case_id})-[:HAS_EVIDENCE]->(e:Evidence)-[:HAS_CHUNK]->(ch:Chunk)
            RETURN count(ch) as total_chunks
            """
            debug_result = self.session.run(debug_query, case_id=case_id).single()
            if debug_result:
                total = debug_result["total_chunks"]
                print(f"DEBUG: Total chunks in case {case_id}: {total}")
                if total == 0:
                    print(f"DEBUG: No chunks found for case {case_id}. Evidence may not be uploaded or processed.")
                else:
                    print(f"DEBUG: Chunks exist but similarity scores too low. Lowering threshold...")
                    # Try again with lower threshold
                    low_threshold_query = """
                    MATCH (c:Case {case_id: $case_id})-[:HAS_EVIDENCE]->(e:Evidence)-[:HAS_CHUNK]->(ch:Chunk)
                    WHERE ch.embedding IS NOT NULL
                    WITH ch, 
                         reduce(dot = 0.0, i IN range(0, size(ch.embedding)-1) | dot + ch.embedding[i] * $embedding[i]) as dotProduct,
                         reduce(norm1 = 0.0, i IN range(0, size(ch.embedding)-1) | norm1 + ch.embedding[i] * ch.embedding[i]) as norm1,
                         reduce(norm2 = 0.0, i IN range(0, size($embedding)-1) | norm2 + $embedding[i] * $embedding[i]) as norm2
                    WITH ch, dotProduct / (sqrt(norm1) * sqrt(norm2)) AS score
                    WHERE score > 0.1
                    RETURN ch, score
                    ORDER BY score DESC
                    LIMIT $top_k
                    """
                    low_results = self.session.run(low_threshold_query, 
                                                    case_id=case_id, 
                                                    embedding=question_embedding, 
                                                    top_k=settings.TOP_K_RETRIEVAL)
                    for record in low_results:
                        node = record["ch"]
                        vector_chunks.append({
                            "chunk_id": node["chunk_id"],
                            "text": node["text"],
                            "score": record["score"],
                            "source": "vector"
                        })
                    print(f"DEBUG: Found {len(vector_chunks)} chunks with lower threshold")
            
        # 3. Graph Expansion
        # Find entities mentioned in top chunks and expand to other chunks sharing those entities
        expanded_chunks = []
        if vector_chunks:
            top_chunk_ids = [c["chunk_id"] for c in vector_chunks]
            
            graph_query = """
            MATCH (u:User {id: $user_id})-[:CREATED]->(c:Case {case_id: $case_id})
            MATCH (start:Chunk)-[:MENTIONS]->(e:Entity)<-[:MENTIONS]-(neighbor:Chunk)
            WHERE start.chunk_id IN $chunk_ids
            AND neighbor.case_id = $case_id
            AND NOT neighbor.chunk_id IN $chunk_ids
            RETURN neighbor, count(e) as shared_entities, collect(e.name) as entities
            ORDER BY shared_entities DESC
            LIMIT 5
            """
            
            g_results = self.session.run(graph_query, chunk_ids=top_chunk_ids, case_id=case_id, user_id=user_id)
            for record in g_results:
                 node = record["neighbor"]
                 expanded_chunks.append({
                     "chunk_id": node["chunk_id"],
                     "text": node["text"],
                     "score": 0.0, # Indirect
                     "source": "graph",
                     "shared_entities": record["entities"]
                 })
                 
        return vector_chunks + expanded_chunks
