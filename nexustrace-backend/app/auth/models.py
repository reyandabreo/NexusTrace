# Since we are using Neo4j directly, we don't have an ORM like SQLAlchemy.
# This file can store internal representations if needed, but for now 
# the logic is mainly handling dictionaries/nodes from Neo4j.
# We can define a helper for User node structure if strictly needed.

class UserNode:
    LABEL = "User"
    def __init__(self, username, email, password_hash):
        self.username = username
        self.email = email
        self.password_hash = password_hash
