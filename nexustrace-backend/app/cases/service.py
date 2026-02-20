import uuid
from neo4j import Session
from fastapi import HTTPException
from app.schemas.case import CaseCreate, CaseResponse, CaseUpdate

class CaseService:
    def __init__(self, session: Session, user_id: str):
        self.session = session
        self.user_id = user_id

    def create_case(self, case: CaseCreate):
        case_id = str(uuid.uuid4())
        query = """

        MERGE (u:User {id: $user_id})
        CREATE (c:Case {
            case_id: $case_id,
            name: $name,
            description: $description,
            status: "open",
            created_at: timestamp()
        })
        MERGE (u)-[:CREATED]->(c)
        RETURN c.case_id as case_id, c.name as name, c.description as description, 
               c.created_at as created_at, c.status as status
        """
        result = self.session.run(query, 
                                  user_id=self.user_id,
                                  case_id=case_id,
                                  name=case.name,
                                  description=case.description).single()
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create case")
        
        return CaseResponse(**result)

    def get_cases(self):
        query = """
        MATCH (u:User {id: $user_id})-[:CREATED]->(c:Case)
        OPTIONAL MATCH (c)-[:HAS_EVIDENCE]->(e:Evidence)
        WITH c, COUNT(DISTINCT e) as evidence_count
        RETURN c.case_id as case_id, c.name as name, c.description as description, 
               c.created_at as created_at, c.status as status, evidence_count
        ORDER BY c.created_at DESC
        """
        results = self.session.run(query, user_id=self.user_id)
        return [CaseResponse(**record) for record in results]

    def get_case(self, case_id: str):
        query = """

        MATCH (u:User {id: $user_id})-[:CREATED]->(c:Case {case_id: $case_id})
        OPTIONAL MATCH (c)-[:HAS_EVIDENCE]->(e:Evidence)
        WITH c, COUNT(DISTINCT e) as evidence_count
        RETURN c.case_id as case_id, c.name as name, c.description as description, 
               c.created_at as created_at, c.status as status, evidence_count
        """
        result = self.session.run(query, user_id=self.user_id, case_id=case_id).single()
        
        if not result:
            raise HTTPException(status_code=404, detail="Case not found or access denied")
        
        return CaseResponse(**result)

    def update_case(self, case_id: str, case_update: CaseUpdate):
        # Check existence and permission
        self.get_case(case_id)
        
        # Build SET clause dynamically based on provided fields
        set_clauses = []
        params = {"user_id": self.user_id, "case_id": case_id}
        
        if case_update.status is not None:
            set_clauses.append("c.status = $status")
            params["status"] = case_update.status
        if case_update.name is not None:
            set_clauses.append("c.name = $name")
            params["name"] = case_update.name
        if case_update.description is not None:
            set_clauses.append("c.description = $description")
            params["description"] = case_update.description
            
        if not set_clauses:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        query = f"""
        MATCH (u:User {{id: $user_id}})-[:CREATED]->(c:Case {{case_id: $case_id}})
        SET {", ".join(set_clauses)}
        OPTIONAL MATCH (c)-[:HAS_EVIDENCE]->(e:Evidence)
        WITH c, COUNT(DISTINCT e) as evidence_count
        RETURN c.case_id as case_id, c.name as name, c.description as description,
               c.created_at as created_at, c.status as status, evidence_count
        """
        
        result = self.session.run(query, **params).single()
        
        if not result:
            raise HTTPException(status_code=404, detail="Case not found or update failed")
        
        return CaseResponse(**result)

    def delete_case(self, case_id: str):
        # Cascading delete might be dangerous, but usually requested for cleanup.
        # We will delete the case node and the relationship.
        # Ideally we should also delete Evidence attached to it, but that's a larger cascade.
        # For this scope, let's delete Case and Evidence relationships.
        
        # Check existence and permission
        self.get_case(case_id) 

        query = """

        MATCH (u:User {id: $user_id})-[:CREATED]->(c:Case {case_id: $case_id})
        DETACH DELETE c
        """
        self.session.run(query, user_id=self.user_id, case_id=case_id)
        return {"status": "success", "message": "Case deleted"}
