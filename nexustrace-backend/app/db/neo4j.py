from neo4j import GraphDatabase
from fastapi import HTTPException
from app.core.config import settings

class Neo4jHandler:
    def __init__(self):
        self.driver = None

    def connect(self):
        if self.driver is not None:
            return

        driver = GraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
        )

        try:
            # Fail fast on startup/dependency resolution if DB/DNS is unavailable.
            driver.verify_connectivity()
        except Exception:
            driver.close()
            raise

        self.driver = driver

    def close(self):
        if self.driver:
            self.driver.close()

    def get_session(self):
        if not self.driver:
            self.connect()
        return self.driver.session()

neo4j_handler = Neo4jHandler()

def get_db_session():
    try:
        session = neo4j_handler.get_session()
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail="Database is unavailable. Please try again shortly."
        ) from e

    try:
        yield session
    finally:
        session.close()
