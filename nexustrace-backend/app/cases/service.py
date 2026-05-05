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
        # Check existence and permission first.
        self.get_case(case_id)

        # 1) Collect chunk IDs for this case before deleting nodes.
        chunk_result = self.session.run(
            """
            MATCH (u:User {id: $user_id})-[:CREATED]->(c:Case {case_id: $case_id})
            OPTIONAL MATCH (c)-[:HAS_EVIDENCE]->(:Evidence)-[:HAS_CHUNK]->(ch:Chunk)
            RETURN collect(DISTINCT ch.chunk_id) as chunk_ids
            """,
            user_id=self.user_id,
            case_id=case_id,
        ).single()
        chunk_ids = [cid for cid in (chunk_result["chunk_ids"] if chunk_result else []) if cid]

        # 2) Delete feedback linked to this case's queries.
        feedback_from_queries = self.session.run(
            """
            MATCH (u:User {id: $user_id})-[:CREATED]->(c:Case {case_id: $case_id})-[:HAS_QUERY]->(q:Query)
            OPTIONAL MATCH (f:Feedback)-[:LINKED_TO]->(q)
            WITH collect(DISTINCT f) as feedback_nodes
            FOREACH (fb IN feedback_nodes | DETACH DELETE fb)
            RETURN size(feedback_nodes) as deleted_count
            """,
            user_id=self.user_id,
            case_id=case_id,
        ).single()
        feedback_from_queries_count = int((feedback_from_queries or {}).get("deleted_count", 0))

        # 3) Delete feedback linked directly to this case's chunks.
        feedback_from_chunks = self.session.run(
            """
            MATCH (u:User {id: $user_id})-[:CREATED]->(c:Case {case_id: $case_id})-[:HAS_EVIDENCE]->(:Evidence)-[:HAS_CHUNK]->(ch:Chunk)
            OPTIONAL MATCH (f:Feedback)-[:ABOUT]->(ch)
            WITH collect(DISTINCT f) as feedback_nodes
            FOREACH (fb IN feedback_nodes | DETACH DELETE fb)
            RETURN size(feedback_nodes) as deleted_count
            """,
            user_id=self.user_id,
            case_id=case_id,
        ).single()
        feedback_from_chunks_count = int((feedback_from_chunks or {}).get("deleted_count", 0))

        # 4) Delete query/prompt history nodes for the case.
        query_delete_result = self.session.run(
            """
            MATCH (u:User {id: $user_id})-[:CREATED]->(c:Case {case_id: $case_id})
            OPTIONAL MATCH (c)-[:HAS_QUERY]->(q:Query)
            WITH collect(DISTINCT q) as query_nodes
            FOREACH (q IN query_nodes | DETACH DELETE q)
            RETURN size(query_nodes) as deleted_count
            """,
            user_id=self.user_id,
            case_id=case_id,
        ).single()
        deleted_queries = int((query_delete_result or {}).get("deleted_count", 0))

        # 5) Adjust CO_OCCURS metadata to remove references to deleted chunks.
        co_occurs_edges_cleaned = 0
        co_occurs_edges_deleted = 0
        if chunk_ids:
            co_occurs_result = self.session.run(
                """
                MATCH ()-[r:CO_OCCURS]-()
                WHERE any(cid IN coalesce(r.chunk_ids, []) WHERE cid IN $chunk_ids)
                WITH r, [cid IN coalesce(r.chunk_ids, []) WHERE NOT cid IN $chunk_ids] as remaining_chunk_ids
                SET r.chunk_ids = remaining_chunk_ids,
                    r.count = size(remaining_chunk_ids)
                WITH collect(DISTINCT r) as touched_rels
                UNWIND touched_rels as rel
                WITH rel, coalesce(rel.count, 0) as rel_count, touched_rels
                FOREACH (_ IN CASE WHEN rel_count = 0 THEN [1] ELSE [] END | DELETE rel)
                RETURN size(touched_rels) as cleaned_edges,
                       count(CASE WHEN rel_count = 0 THEN 1 END) as deleted_edges
                """,
                chunk_ids=chunk_ids,
            ).single()
            co_occurs_edges_cleaned = int((co_occurs_result or {}).get("cleaned_edges", 0))
            co_occurs_edges_deleted = int((co_occurs_result or {}).get("deleted_edges", 0))

        # 6) Delete the case subtree (chunks, evidence, case).
        subtree_delete_result = self.session.run(
            """
            MATCH (u:User {id: $user_id})-[:CREATED]->(c:Case {case_id: $case_id})
            OPTIONAL MATCH (c)-[:HAS_EVIDENCE]->(e:Evidence)
            OPTIONAL MATCH (e)-[:HAS_CHUNK]->(ch:Chunk)
            WITH c, collect(DISTINCT e) as evidence_nodes, collect(DISTINCT ch) as chunk_nodes
            FOREACH (chunk IN chunk_nodes | DETACH DELETE chunk)
            FOREACH (evidence IN evidence_nodes | DETACH DELETE evidence)
            WITH c, size(evidence_nodes) as evidence_deleted, size(chunk_nodes) as chunks_deleted
            DETACH DELETE c
            RETURN evidence_deleted, chunks_deleted, 1 as case_deleted
            """,
            user_id=self.user_id,
            case_id=case_id,
        ).single()
        evidence_deleted = int((subtree_delete_result or {}).get("evidence_deleted", 0))
        chunks_deleted = int((subtree_delete_result or {}).get("chunks_deleted", 0))
        case_deleted = int((subtree_delete_result or {}).get("case_deleted", 0))

        # 7) Cleanup global orphans that can be left by previous partial deletes.
        orphan_chunk_cleanup = self.session.run(
            """
            MATCH (ch:Chunk)
            WHERE NOT (:Evidence)-[:HAS_CHUNK]->(ch)
            WITH collect(DISTINCT ch) as chunk_nodes
            FOREACH (chunk IN chunk_nodes | DETACH DELETE chunk)
            RETURN size(chunk_nodes) as deleted_count
            """
        ).single()
        orphan_chunks_deleted = int((orphan_chunk_cleanup or {}).get("deleted_count", 0))

        orphan_evidence_cleanup = self.session.run(
            """
            MATCH (e:Evidence)
            WHERE NOT (:Case)-[:HAS_EVIDENCE]->(e)
            WITH collect(DISTINCT e) as evidence_nodes
            FOREACH (evidence IN evidence_nodes | DETACH DELETE evidence)
            RETURN size(evidence_nodes) as deleted_count
            """
        ).single()
        orphan_evidence_deleted = int((orphan_evidence_cleanup or {}).get("deleted_count", 0))

        orphan_entity_cleanup = self.session.run(
            """
            MATCH (ent:Entity)
            WHERE NOT (ent)<-[:MENTIONS]-(:Chunk)
            WITH collect(DISTINCT ent) as entity_nodes
            FOREACH (ent IN entity_nodes | DETACH DELETE ent)
            RETURN size(entity_nodes) as deleted_count
            """
        ).single()
        orphan_entities_deleted = int((orphan_entity_cleanup or {}).get("deleted_count", 0))

        orphan_feedback_cleanup = self.session.run(
            """
            MATCH (f:Feedback)
            WHERE NOT (f)-[:ABOUT]->(:Chunk)
              AND NOT (f)-[:LINKED_TO]->(:Query)
            WITH collect(DISTINCT f) as feedback_nodes
            FOREACH (fb IN feedback_nodes | DETACH DELETE fb)
            RETURN size(feedback_nodes) as deleted_count
            """
        ).single()
        orphan_feedback_deleted = int((orphan_feedback_cleanup or {}).get("deleted_count", 0))

        orphan_query_cleanup = self.session.run(
            """
            MATCH (q:Query)
            WHERE NOT (:Case)-[:HAS_QUERY]->(q)
            WITH collect(DISTINCT q) as query_nodes
            FOREACH (q IN query_nodes | DETACH DELETE q)
            RETURN size(query_nodes) as deleted_count
            """
        ).single()
        orphan_queries_deleted = int((orphan_query_cleanup or {}).get("deleted_count", 0))

        return {
            "status": "success",
            "message": "Case and related graph data deleted",
            "deleted": {
                "case": case_deleted,
                "evidence": evidence_deleted,
                "chunks": chunks_deleted,
                "queries": deleted_queries,
                "feedback": feedback_from_queries_count + feedback_from_chunks_count,
                "co_occurs_edges_cleaned": co_occurs_edges_cleaned,
                "co_occurs_edges_deleted": co_occurs_edges_deleted,
                "orphan_chunks": orphan_chunks_deleted,
                "orphan_evidence": orphan_evidence_deleted,
                "orphan_entities": orphan_entities_deleted,
                "orphan_feedback": orphan_feedback_deleted,
                "orphan_queries": orphan_queries_deleted,
            },
        }
