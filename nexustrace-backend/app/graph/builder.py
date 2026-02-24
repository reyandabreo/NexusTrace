from neo4j import Session
from typing import List, Dict, Any

class GraphBuilder:
    def __init__(self, session: Session):
        self.session = session
    
    def _create_entity_relationships(self, entities: List[Dict[str, str]], chunk_id: str):
        """Create relationships between entities that co-occur in the same chunk"""
        relationships_created = 0
        for i in range(len(entities)):
            for j in range(i + 1, len(entities)):
                entity1 = entities[i]
                entity2 = entities[j]
                
                try:
                    query = """
                    MATCH (e1:Entity {name: $name1})
                    MATCH (e2:Entity {name: $name2})
                    MERGE (e1)-[r:CO_OCCURS]->(e2)
                    ON CREATE SET r.count = 1, r.chunk_ids = [$chunk_id]
                    ON MATCH SET r.count = r.count + 1, r.chunk_ids = r.chunk_ids + $chunk_id
                    RETURN type(r) as rel_type
                    """
                    result = self.session.run(query, 
                                   name1=entity1["name"],
                                   name2=entity2["name"],
                                   chunk_id=chunk_id)
                    record = result.single()
                    if record:
                        relationships_created += 1
                except Exception as e:
                    print(f"  ✗ Error creating relationship between '{entity1['name']}' and '{entity2['name']}': {e}")
                    continue
        
        if relationships_created > 0:
            print(f"Created {relationships_created} entity relationships")

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
            embedding: $embedding
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
                             embedding=embedding)
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
