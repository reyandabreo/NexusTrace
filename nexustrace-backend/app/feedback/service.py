from neo4j import Session
from app.schemas.feedback import FeedbackCreate

class FeedbackService:
    def __init__(self, session: Session, user_id: str):
        self.session = session
        self.user_id = user_id

    def submit_feedback(self, feedback: FeedbackCreate):
        query = """
        MATCH (u:User {username: $username})
        MATCH (ch:Chunk {chunk_id: $chunk_id})
        MATCH (q:Query {query_id: $query_id})
        MERGE (f:Feedback {
            feedback_id: apoc.create.uuid(), 
            type: $type, 
            comment: $comment,
            timestamp: timestamp()
        })
        MERGE (u)-[:PROVIDED]->(f)
        MERGE (f)-[:ABOUT]->(ch)
        MERGE (f)-[:LINKED_TO]->(q)
        
        // Simple re-weighting logic:
        // Adjust a 'weight' property on the chunk? 
        // Or we can just store the feedback and use it in retrieval scoring.
        // For this implementation, let's update a 'relevance_boost' on the Chunk.
        
        CASE 
            WHEN $type = 'positive' THEN SET ch.relevance_boost = coalesce(ch.relevance_boost, 1.0) + 0.1
            WHEN $type = 'negative' THEN SET ch.relevance_boost = coalesce(ch.relevance_boost, 1.0) - 0.1
        END
        """
        # Note: Cypher CASE combined with SET is tricky in some versions syntax-wise.
        # Let's split it or use APOC if available, but staying standard cypher:
        
        # Better approach:
        cypher_create = """
        MATCH (u:User {id: $user_id})
        MATCH (ch:Chunk {chunk_id: $chunk_id})
        CREATE (f:Feedback {
            type: $type, 
            comment: $comment,
            timestamp: timestamp()
        })
        CREATE (u)-[:PROVIDED]->(f)
        CREATE (f)-[:ABOUT]->(ch)
        """
        self.session.run(cypher_create, 
                         user_id=self.user_id, 
                         chunk_id=feedback.chunk_id, 
                         type=feedback.feedback_type,
                         comment=feedback.comment)
        
        # Update weights handling
        if feedback.feedback_type == "positive":
            self.session.run("MATCH (ch:Chunk {chunk_id: $id}) SET ch.relevance_boost = coalesce(ch.relevance_boost, 1.0) + 0.1", id=feedback.chunk_id)
        elif feedback.feedback_type == "negative":
            self.session.run("MATCH (ch:Chunk {chunk_id: $id}) SET ch.relevance_boost = coalesce(ch.relevance_boost, 1.0) - 0.1", id=feedback.chunk_id)
            
        return {"status": "success"}
