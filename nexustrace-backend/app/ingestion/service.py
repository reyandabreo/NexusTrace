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
        
        allowed_types = ["json", "csv", "txt", "pdf", "png", "jpg", "jpeg", "gif", "bmp", "tiff", "webp", "docx"]
        if file_ext not in allowed_types:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: .{file_ext}. Allowed: {', '.join(allowed_types)}")
            
        parsed = await parse_file(file, file_ext)
        
        # parse_file now returns a dict with text + metadata
        text = parsed["text"] if isinstance(parsed, dict) else parsed
        file_metadata = parsed if isinstance(parsed, dict) else {"text": parsed, "file_type": file_ext, "filename": filename}
        
        evidence_id = str(uuid.uuid4())
        
        print(f"Processing evidence: {filename} (ID: {evidence_id}) for case: {case_id}")
        
        # 2. Create Evidence Node
        try:
            self.graph_builder.create_evidence_node(self.user_id, case_id, evidence_id, filename, file_ext)
            print(f"Created evidence node: {evidence_id}")
        except Exception as e:
            print(f"ERROR creating evidence node: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create evidence: {str(e)}")
        
        # 3. Chunking (pass metadata for enrichment)
        chunks = chunk_text(text, evidence_id, metadata=file_metadata)
        print(f"Created {len(chunks)} chunks from evidence")
        
        # 4. Processing Chunks
        for idx, chunk in enumerate(chunks):
            chunk_id = str(uuid.uuid4())
            chunk["chunk_id"] = chunk_id
            
            # AI Triage
            chunk_text_str = chunk["text"]
            print(f"Processing chunk {idx + 1}/{len(chunks)} (ID: {chunk_id})")
            
            try:
                entities = extract_entities(chunk_text_str)
                print(f"  - Extracted {len(entities)} entities")
            except Exception as e:
                print(f"ERROR extracting entities from chunk {chunk_id}: {e}")
                entities = []
            
            try:
                risk_score = calculate_risk_score(chunk_text_str, chunk)
                print(f"  - Calculated risk score: {risk_score}")
            except Exception as e:
                print(f"ERROR calculating risk score for chunk {chunk_id}: {e}")
                risk_score = 0.0
            
            try:
                embedding = get_embedding(chunk_text_str)
                print(f"  - Generated embedding")
            except Exception as e:
                print(f"ERROR generating embedding for chunk {chunk_id}: {e}")
                embedding = []
            
            # 5. Store in Graph
            try:
                self.graph_builder.store_chunk(self.user_id, case_id, chunk, embedding, risk_score, entities)
                print(f"  - Stored chunk with {len(entities)} entities")
            except Exception as e:
                print(f"ERROR storing chunk {chunk_id}: {e}")
                # Continue processing other chunks
                continue
            
        print(f"Completed processing evidence {evidence_id}: {len(chunks)} chunks processed")
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

    def delete_evidence(self, evidence_id: str, case_id: str):
        """Delete evidence and all associated chunks, entity references, and query links"""
        # 1. Delete RETRIEVED relationships from queries to chunks of this evidence
        self.session.run("""
            MATCH (:Evidence {evidence_id: $evidence_id})-[:HAS_CHUNK]->(ch:Chunk)
            OPTIONAL MATCH (q:Query)-[r:RETRIEVED]->(ch)
            DELETE r
        """, evidence_id=evidence_id)
        
        # 2. Delete MENTIONS relationships and orphaned entities
        self.session.run("""
            MATCH (:Evidence {evidence_id: $evidence_id})-[:HAS_CHUNK]->(ch:Chunk)
            OPTIONAL MATCH (ch)-[m:MENTIONS]->(ent:Entity)
            DELETE m
            WITH ent
            WHERE ent IS NOT NULL
            OPTIONAL MATCH (ent)<-[:MENTIONS]-(other:Chunk)
            WITH ent, count(other) as remaining
            WHERE remaining = 0
            DETACH DELETE ent
        """, evidence_id=evidence_id)
        
        # 3. Delete chunks
        self.session.run("""
            MATCH (:Evidence {evidence_id: $evidence_id})-[:HAS_CHUNK]->(ch:Chunk)
            DETACH DELETE ch
        """, evidence_id=evidence_id)
        
        # 4. Delete evidence node
        result = self.session.run("""
            MATCH (e:Evidence {evidence_id: $evidence_id})
            DETACH DELETE e
            RETURN count(e) as deleted
        """, evidence_id=evidence_id)
        
        record = result.single()
        deleted = record["deleted"] if record else 0
        print(f"Deleted evidence {evidence_id}: {deleted} node(s) removed with all chunks and entity refs")
        return {"status": "deleted", "evidence_id": evidence_id}
