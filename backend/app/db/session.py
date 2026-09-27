import os
from typing import Generator
from contextlib import contextmanager
from sqlalchemy import create_engine, event, Engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

# Determine database connection string
DATABASE_URL = settings.DATABASE_URL.strip() if settings.DATABASE_URL else ""

if DATABASE_URL:
    # Normalize legacy postgres:// URI schema to postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )
else:
    # Fallback to local SQLite database for zero-friction local development & automated test suites
    DB_PATH = os.path.join(os.path.dirname(__file__), "skillsetu.db")
    SQLITE_URL = f"sqlite:///{DB_PATH}"
    engine = create_engine(
        SQLITE_URL,
        connect_args={"check_same_thread": False},
    )

    # Enforce SQLite foreign key constraints
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
        except Exception:
            pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a thread-safe database session per request.
    Automatically commits on normal completion or rolls back on exceptions.
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """
    Context manager for background workers, CLI scripts, and non-request tasks.
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
