from neo4j import GraphDatabase
from app.core.config import settings

class Neo4jHandler:
    def __init__(self):
        self.driver = None

    def connect(self):
        self.driver = GraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
        )

    def close(self):
        if self.driver:
            self.driver.close()

    def get_session(self):
        if not self.driver:
            self.connect()
        return self.driver.session()

neo4j_handler = Neo4jHandler()

def get_db_session():
    session = neo4j_handler.get_session()
    try:
        yield session
    finally:
        session.close()
