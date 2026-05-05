from neo4j import Session
from typing import List, Dict, Any

class GraphBuilder:
    MAX_CO_OCCUR_ENTITIES_PER_CHUNK = 60

    def __init__(self, session: Session):
        self.session = session
    
    def _create_entity_relationships(self, entities: List[Dict[str, str]], chunk_id: str):
        """Create relationships between entities that co-occur in the same chunk"""
        if not entities:
            return

        # Deduplicate by name while preserving first-seen order.
        unique_names: List[str] = []
        seen_names = set()
        for entity in entities:
            name = (entity.get("name") or "").strip()
            if not name:
                continue
            if name in seen_names:
                continue
            seen_names.add(name)
            unique_names.append(name)

        if len(unique_names) > self.MAX_CO_OCCUR_ENTITIES_PER_CHUNK:
            print(
                f"  [WARN] Limiting co-occurrence entities from {len(unique_names)} "
                f"to {self.MAX_CO_OCCUR_ENTITIES_PER_CHUNK} for chunk {chunk_id}"
            )
            unique_names = unique_names[: self.MAX_CO_OCCUR_ENTITIES_PER_CHUNK]

        if len(unique_names) < 2:
            return

        pair_set = set()
        pairs = []
        for i in range(len(unique_names)):
            for j in range(i + 1, len(unique_names)):
                name1, name2 = sorted((unique_names[i], unique_names[j]))
                key = (name1, name2)
                if key in pair_set:
                    continue
                pair_set.add(key)
                pairs.append({"name1": name1, "name2": name2})

        if not pairs:
            return

        try:
            query = """
            UNWIND $pairs as pair
            MATCH (e1:Entity {name: pair.name1})
            MATCH (e2:Entity {name: pair.name2})
            MERGE (e1)-[r:CO_OCCURS]->(e2)
            ON CREATE SET r.count = 1, r.chunk_ids = [$chunk_id]
            ON MATCH SET
                r.count = coalesce(r.count, 0) + 1,
                r.chunk_ids = CASE
                    WHEN $chunk_id IN coalesce(r.chunk_ids, []) THEN coalesce(r.chunk_ids, [])
                    ELSE coalesce(r.chunk_ids, []) + $chunk_id
                END
            RETURN count(r) as rel_count
            """
            result = self.session.run(query, pairs=pairs, chunk_id=chunk_id).single()
            rel_count = result["rel_count"] if result else 0
            if rel_count:
                print(f"Created/updated {rel_count} entity relationships")
        except Exception as e:
            print(f"  ✗ Error creating co-occurrence relationships for chunk {chunk_id}: {e}")

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
        RETURN e.evidence_id as evidence_id
        """
        result = self.session.run(query, case_id=case_id, evidence_id=evidence_id, filename=filename, file_type=file_type)
        record = result.single()
        if record:
            print(f"Successfully created evidence node: {record['evidence_id']}")
        return record

    def store_chunk(self, user_id: str, case_id: str, chunk: Dict[str, Any], embedding: List[float], risk_score: float, entities: List[Dict[str, str]]):
        query = """
        MATCH (c:Case {case_id: $case_id})-[:HAS_EVIDENCE]->(e:Evidence {evidence_id: $evidence_id})
        CREATE (ch:Chunk {
            chunk_id: $chunk_id,
            case_id: $case_id,
            text: $text,
            timestamp: $timestamp,
            risk_score: $risk_score,
            embedding: $embedding,
            filename: $filename,
            file_type: $file_type,
            page_number: $page_number,
            chunk_index: $chunk_index
        })
        CREATE (e)-[:HAS_CHUNK]->(ch)
        RETURN ch.chunk_id as chunk_id
        """
        try:
            result = self.session.run(query, 
                             case_id=case_id,
                             evidence_id=chunk["evidence_id"],
                             chunk_id=chunk["chunk_id"],
                             text=chunk["text"],
                             timestamp=chunk.get("timestamp"),
                             risk_score=risk_score,
                             embedding=embedding,
                             filename=chunk.get("filename", ""),
                             file_type=chunk.get("file_type", ""),
                             page_number=chunk.get("page_number"),
                             chunk_index=chunk.get("chunk_index", 0))
            record = result.single()
            if record:
                print(f"✓ Stored chunk: {record['chunk_id']}")
            else:
                print(f"⚠ Warning: Chunk created but no record returned")
        except Exception as e:
            print(f"✗ Error storing chunk: {e}")
            raise
        
        # Create Entity nodes and relationships
        entities_created = 0
        for entity in entities:
             try:
                 query_entity = """
                 MATCH (c:Case {case_id: $case_id})
                 MATCH (ch:Chunk {chunk_id: $chunk_id})
                 MERGE (ent:Entity {name: $name})
                 ON CREATE SET ent.type = $type, ent.created_at = timestamp()
                 ON MATCH SET ent.type = $type
                 MERGE (ch)-[:MENTIONS]->(ent)
                 MERGE (c)-[:HAS_ENTITY]->(ent)
                 RETURN ent.name as name, ent.type as type
                 """
                 result = self.session.run(query_entity, 
                                  chunk_id=chunk["chunk_id"], 
                                  case_id=case_id,
                                  name=entity["name"], 
                                  type=entity["type"])
                 record = result.single()
                 if record:
                     entities_created += 1
                     print(f"  ✓ Entity: {record['name']} ({record['type']})")
                 else:
                     print(f"  ⚠ Entity created but no record: {entity['name']}")
             except Exception as e:
                 print(f"  ✗ Error storing entity '{entity['name']}': {e}")
                 # Continue processing other entities even if one fails
                 continue
        
        print(f"Stored {entities_created}/{len(entities)} entities for chunk")
        
        # Create relationships between co-occurring entities
        if len(entities) > 1:
            self._create_entity_relationships(entities, chunk["chunk_id"])
