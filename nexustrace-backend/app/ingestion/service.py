import uuid
from neo4j import Session
from fastapi import UploadFile, HTTPException
from app.graph.builder import GraphBuilder
from app.ingestion.parsers import parse_file
from app.ingestion.chunker import chunk_text
from app.ai.nlp import extract_entities
from app.ai.metadata import calculate_risk_score
from app.ai.embeddings import get_embedding

class IngestionService:
    def __init__(self, session: Session, user_id: str):
        self.session = session
        self.user_id = user_id
        self.graph_builder = GraphBuilder(session)

    async def process_evidence(self, case_id: str, file: UploadFile):
        # 1. Validate and Parse
        filename = file.filename
        file_ext = filename.split(".")[-1].lower()
        
        allowed_types = ["json", "csv", "txt", "pdf"]
        if file_ext not in allowed_types:
            raise HTTPException(status_code=400, detail="Unsupported file type")
            
        text = await parse_file(file, file_ext)
        evidence_id = str(uuid.uuid4())
        
        # 2. Create Evidence Node
        self.graph_builder.create_evidence_node(self.user_id, case_id, evidence_id, filename, file_ext)
        
        # 3. Chunking
        chunks = chunk_text(text, evidence_id)
        
        # 4. Processing Chunks
        for chunk in chunks:
            chunk_id = str(uuid.uuid4())
            chunk["chunk_id"] = chunk_id
            
            # AI Triage
            chunk_text_str = chunk["text"]
            entities = extract_entities(chunk_text_str)
            risk_score = calculate_risk_score(chunk_text_str, chunk)
            embedding = get_embedding(chunk_text_str)
            
            # 5. Store in Graph
            self.graph_builder.store_chunk(self.user_id, case_id, chunk, embedding, risk_score, entities)
            
        return {"status": "processed", "evidence_id": evidence_id, "chunks": len(chunks)}

    def get_evidence(self, evidence_id: str):
        query = """
        MATCH (u:User {id: $user_id})-[:CREATED]->(c:Case)-[:HAS_EVIDENCE]->(e:Evidence {evidence_id: $evidence_id})
        RETURN e.evidence_id as evidence_id, e.filename as filename, e.file_type as file_type, e.created_at as created_at
        """
        result = self.session.run(query, user_id=self.user_id, evidence_id=evidence_id).single()
        
        if not result:
            return None
            
        return result.data()

    def get_evidence_for_case(self, case_id: str):
        """Retrieve all evidence for a specific case"""
        query = """
        MATCH (c:Case {case_id: $case_id})-[:HAS_EVIDENCE]->(e:Evidence)
        OPTIONAL MATCH (e)-[:HAS_CHUNK]->(chunk:Chunk)
        WITH e, count(chunk) as chunk_count
        RETURN e.evidence_id as evidence_id, 
               e.filename as filename,
               e.file_type as file_type,
               e.uploaded_at as uploaded_at,
               chunk_count,
               'indexed' as status
        ORDER BY e.uploaded_at DESC
        """
        result = self.session.run(query, case_id=case_id)
        evidence_list = []
        for record in result:
            evidence_list.append({
                "id": record["evidence_id"],
                "case_id": case_id,
                "filename": record["filename"],
                "file_type": record["file_type"],
                "file_size": 0,  # Not stored, placeholder
                "status": record["status"],
                "uploaded_at": record["uploaded_at"] or ""
            })
        return evidence_list
