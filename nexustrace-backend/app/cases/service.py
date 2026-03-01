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
        tags_str = ",".join(case.tags) if case.tags else ""
        query = """

        MERGE (u:User {id: $user_id})
        CREATE (c:Case {
            case_id: $case_id,
            name: $name,
            description: $description,
            status: "open",
            priority: $priority,
            tags: $tags,
            created_at: timestamp()
        })
        MERGE (u)-[:CREATED]->(c)
        RETURN c.case_id as case_id, c.name as name, c.description as description, 
               c.created_at as created_at, c.status as status,
               c.priority as priority, c.tags as tags
        """
        result = self.session.run(query, 
                                  user_id=self.user_id,
                                  case_id=case_id,
                                  name=case.name,
                                  description=case.description,
                                  priority=case.priority or "medium",
                                  tags=tags_str).single()
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create case")
        
        data = dict(result)
        # Convert tags string back to list
        if isinstance(data.get("tags"), str):
            data["tags"] = [t.strip() for t in data["tags"].split(",") if t.strip()] if data["tags"] else []
        return CaseResponse(**data)

    def get_cases(self):
        query = """
        MATCH (u:User {id: $user_id})-[:CREATED]->(c:Case)
        OPTIONAL MATCH (c)-[:HAS_EVIDENCE]->(e:Evidence)
        WITH c, COUNT(DISTINCT e) as evidence_count
        RETURN c.case_id as case_id, c.name as name, c.description as description, 
               c.created_at as created_at, c.status as status,
               c.priority as priority, c.tags as tags, evidence_count
        ORDER BY c.created_at DESC
        """
        results = self.session.run(query, user_id=self.user_id)
        cases = []
        for record in results:
            data = dict(record)
            # Handle missing priority for old cases
            if data.get("priority") is None:
                data["priority"] = "medium"
            # Convert tags string back to list
            if isinstance(data.get("tags"), str):
                data["tags"] = [t.strip() for t in data["tags"].split(",") if t.strip()] if data["tags"] else []
            elif data.get("tags") is None:
                data["tags"] = []
            cases.append(CaseResponse(**data))
        return cases

    def get_case(self, case_id: str):
        query = """

        MATCH (u:User {id: $user_id})-[:CREATED]->(c:Case {case_id: $case_id})
        OPTIONAL MATCH (c)-[:HAS_EVIDENCE]->(e:Evidence)
        WITH c, COUNT(DISTINCT e) as evidence_count
        RETURN c.case_id as case_id, c.name as name, c.description as description, 
               c.created_at as created_at, c.status as status,
               c.priority as priority, c.tags as tags, evidence_count
        """
        result = self.session.run(query, user_id=self.user_id, case_id=case_id).single()
        
        if not result:
            raise HTTPException(status_code=404, detail="Case not found or access denied")
        
        data = dict(result)
        if data.get("priority") is None:
            data["priority"] = "medium"
        if isinstance(data.get("tags"), str):
            data["tags"] = [t.strip() for t in data["tags"].split(",") if t.strip()] if data["tags"] else []
        elif data.get("tags") is None:
            data["tags"] = []
        return CaseResponse(**data)

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
        if case_update.priority is not None:
            set_clauses.append("c.priority = $priority")
            params["priority"] = case_update.priority
        if case_update.tags is not None:
            set_clauses.append("c.tags = $tags")
            params["tags"] = ",".join(case_update.tags)
            
        if not set_clauses:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        query = f"""
        MATCH (u:User {{id: $user_id}})-[:CREATED]->(c:Case {{case_id: $case_id}})
        SET {", ".join(set_clauses)}
        WITH c
        OPTIONAL MATCH (c)-[:HAS_EVIDENCE]->(e:Evidence)
        WITH c, COUNT(DISTINCT e) as evidence_count
        RETURN c.case_id as case_id, c.name as name, c.description as description,
               c.created_at as created_at, c.status as status,
               c.priority as priority, c.tags as tags, evidence_count
        """
        
        result = self.session.run(query, **params).single()
        
        if not result:
            raise HTTPException(status_code=404, detail="Case not found or update failed")
        
        data = dict(result)
        if data.get("priority") is None:
            data["priority"] = "medium"
        if isinstance(data.get("tags"), str):
            data["tags"] = [t.strip() for t in data["tags"].split(",") if t.strip()] if data["tags"] else []
        elif data.get("tags") is None:
            data["tags"] = []
        return CaseResponse(**data)

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
