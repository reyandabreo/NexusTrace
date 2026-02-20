from neo4j import Session
from typing import List, Dict, Any

class GraphBuilder:
    def __init__(self, session: Session):
        self.session = session

    def create_evidence_node(self, user_id: str, case_id: str, evidence_id: str, filename: str, file_type: str):
        query = """
        MATCH (c:Case {case_id: $case_id})
        CREATE (e:Evidence {
            evidence_id: $evidence_id,
            filename: $filename,
            file_type: $file_type,
            uploaded_at: timestamp()
        })
        CREATE (c)-[:HAS_EVIDENCE]->(e)
        """
        self.session.run(query, case_id=case_id, evidence_id=evidence_id, filename=filename, file_type=file_type)

    def store_chunk(self, user_id: str, case_id: str, chunk: Dict[str, Any], embedding: List[float], risk_score: float, entities: List[Dict[str, str]]):
        query = """
        MATCH (c:Case {case_id: $case_id})-[:HAS_EVIDENCE]->(e:Evidence {evidence_id: $evidence_id})
        CREATE (ch:Chunk {
            chunk_id: $chunk_id,
            case_id: $case_id,
            text: $text,
            timestamp: $timestamp,
            risk_score: $risk_score,
            embedding: $embedding
        })
        CREATE (e)-[:HAS_CHUNK]->(ch)
        """
        self.session.run(query, 
                         case_id=case_id,
                         evidence_id=chunk["evidence_id"],
                         chunk_id=chunk["chunk_id"],
                         text=chunk["text"],
                         timestamp=chunk.get("timestamp"),
                         risk_score=risk_score,
                         embedding=embedding)
        
        # Create Entity nodes and relationships
        for entity in entities:
             query_entity = """
             MATCH (c:Case {case_id: $case_id})
             MATCH (ch:Chunk {chunk_id: $chunk_id})
             WHERE ch.case_id = $case_id
             MERGE (ent:Entity {name: $name, type: $type})
             MERGE (ch)-[:MENTIONS]->(ent)
             MERGE (c)-[:HAS_ENTITY]->(ent)
             """
             self.session.run(query_entity, 
                              chunk_id=chunk["chunk_id"], 
                              case_id=case_id,
                              name=entity["name"], 
                              type=entity["type"])
