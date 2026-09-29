import pytest
from app.db.database import init_db
from app.db.seed import seed_database_defaults

@pytest.fixture(autouse=True, scope="session")
def setup_test_suite_database():
    """Ensure database schema, all tables, and seed data are primed for the entire test session."""
    init_db()
    seed_database_defaults()
