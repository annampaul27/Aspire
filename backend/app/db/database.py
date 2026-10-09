import sqlite3
import os
import json
from typing import Dict, Any, List

DB_PATH = os.path.join(os.path.dirname(__file__), "aspire.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        user_class TEXT NOT NULL DEFAULT 'Fresher',
        college TEXT,
        experience_years REAL DEFAULT 0.0,
        readiness_score INTEGER DEFAULT 70,
        current_tier TEXT DEFAULT 'bridgeable',
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 2. Skills Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS skills (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        weight REAL DEFAULT 3.0,
        is_critical BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 3. Assessments Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assessments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        skill_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL DEFAULT 20,
        correct_count INTEGER NOT NULL,
        time_taken_seconds INTEGER NOT NULL,
        verification_status TEXT NOT NULL,
        badge_tier TEXT,
        answers_log_json TEXT,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (skill_id) REFERENCES skills (id)
    )
    """)

    # 4. ATS Resumes Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ats_resumes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        file_name TEXT,
        parsed_json TEXT NOT NULL,
        ats_score INTEGER DEFAULT 85,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    # 5. Jobs Table (FR-04 & FR-05)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL,
        title TEXT NOT NULL,
        department TEXT,
        location TEXT,
        type TEXT DEFAULT 'Full-Time',
        experience_min_years REAL DEFAULT 0.0,
        salary_range TEXT,
        description TEXT,
        pass_threshold INTEGER DEFAULT 85,
        opening_date TIMESTAMP NOT NULL,
        application_deadline TIMESTAMP NOT NULL,
        critical_skills_json TEXT,
        optional_skills_json TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 6. Saved Jobs Table (FR-04)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS saved_jobs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        job_id TEXT NOT NULL,
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (job_id) REFERENCES jobs (id),
        UNIQUE(user_id, job_id)
    )
    """)

    # 7. User Notifications Table (FR-04)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        job_id TEXT NOT NULL,
        message TEXT NOT NULL,
        notification_type TEXT NOT NULL DEFAULT 'deadline_warning',
        is_read BOOLEAN NOT NULL DEFAULT 0,
        trigger_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (job_id) REFERENCES jobs (id),
        UNIQUE(user_id, job_id, notification_type, trigger_date)
    )
    """)

    # Seed Initial Data if empty
    cursor.execute("SELECT COUNT(*) FROM skills")
    if cursor.fetchone()[0] == 0:
        initial_skills = [
            ("postgresql", "PostgreSQL Optimization & Architecture", "backend", "Advanced query optimization, execution plans, B-Tree & GIN indexing, vacuuming, and replication.", 3.0, 1),
            ("python", "Python Core, Concurrency & AsyncIO", "backend", "Generators, decorators, asyncio event loop, GIL management, and memory optimization.", 3.0, 1),
            ("react", "React 19 & Next.js Architecture", "frontend", "Server components, hooks, concurrent rendering, hydration, and bundle optimization.", 3.0, 1),
            ("docker", "Docker, Containerization & CI/CD", "devops", "Multi-stage builds, container lifecycle, layer caching, and orchestration.", 1.0, 0),
        ]
        cursor.executemany(
            "INSERT INTO skills (id, name, category, description, weight, is_critical) VALUES (?, ?, ?, ?, ?, ?)",
            initial_skills
        )

    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        initial_users = [
            ("cand-1", "aditya.verma@example.com", "Aditya Verma", "student", "Experienced", "Indian Institute of Information Technology (IIIT)", 2.5, 78, "bridgeable", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"),
            ("cand-2", "pooja.s@example.com", "Pooja Sundaram", "student", "Fresher", "National Institute of Technology (NIT) Trichy", 0.0, 91, "job_ready", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"),
            ("cand-3", "rahul.mehta@example.com", "Rahul Mehta", "student", "Fresher", "BITS Pilani", 0.5, 64, "mismatch", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80")
        ]
        cursor.executemany(
            "INSERT INTO users (id, email, full_name, role, user_class, college, experience_years, readiness_score, current_tier, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            initial_users
        )

    cursor.execute("SELECT COUNT(*) FROM jobs")
    if cursor.fetchone()[0] == 0:
        from datetime import datetime, timedelta
        today = datetime.now()
        initial_jobs = [
            (
                "job-fullstack-01",
                "org-acme",
                "Senior Full-Stack Architect (Next.js 15 + FastAPI)",
                "Platform Engineering",
                "Bengaluru / Remote",
                "Full-Time",
                3.0,
                "₹28,00,000 - ₹38,00,000",
                "Looking for a high-craft Full-Stack Architect to spearhead core microservices and edge rendering.",
                85,
                (today - timedelta(days=10)).strftime("%Y-%m-%d %H:%M:%S"),
                (today + timedelta(days=21)).strftime("%Y-%m-%d %H:%M:%S"), # Exactly 21 days from now!
                json.dumps([{"id": "react", "name": "React 19 & Next.js Architecture", "weight": 3.0}]),
                json.dumps([{"id": "docker", "name": "Docker, Containerization & CI/CD", "weight": 1.0}]),
                "active"
            ),
            (
                "job-ai-systems-02",
                "org-acme",
                "AI Platform & Inference Systems Engineer",
                "Applied AI",
                "Hyderabad / Hybrid",
                "Full-Time",
                2.0,
                "₹25,00,000 - ₹35,00,000",
                "Scale generative AI pipelines and vector databases for enterprise workloads.",
                85,
                (today - timedelta(days=5)).strftime("%Y-%m-%d %H:%M:%S"),
                (today + timedelta(days=45)).strftime("%Y-%m-%d %H:%M:%S"),
                json.dumps([{"id": "python", "name": "Python Core, Concurrency & AsyncIO", "weight": 3.0}]),
                json.dumps([{"id": "docker", "name": "Docker, Containerization & CI/CD", "weight": 1.0}]),
                "active"
            )
        ]
        cursor.executemany(
            """INSERT INTO jobs (
                id, org_id, title, department, location, type, experience_min_years, 
                salary_range, description, pass_threshold, opening_date, application_deadline,
                critical_skills_json, optional_skills_json, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            initial_jobs
        )

    # Migrations: Ensure verified_skills_json on users, company on jobs
    cursor.execute("PRAGMA table_info(users)")
    user_cols = [c[1] for c in cursor.fetchall()]
    if "verified_skills_json" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN verified_skills_json TEXT DEFAULT '[]'")
    if "password_hash" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
    if "org_id" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN org_id TEXT")

    cursor.execute("PRAGMA table_info(jobs)")
    job_cols = [c[1] for c in cursor.fetchall()]
    if "company" not in job_cols:
        cursor.execute("ALTER TABLE jobs ADD COLUMN company TEXT DEFAULT 'Acme HyperScale Systems'")

    # Seed mock candidates with verified skills: Python, SQL, AWS, Docker (FR-05)
    default_verified_skills = json.dumps(["Python", "SQL", "AWS", "Docker"])
    cursor.execute("""
    UPDATE users 
    SET verified_skills_json = ? 
    WHERE id = 'cand-1' AND (verified_skills_json IS NULL OR verified_skills_json = '[]' OR verified_skills_json = '')
    """, (default_verified_skills,))

    # Also ensure cand-mock-01 exists for verification
    cursor.execute("SELECT id FROM users WHERE id = 'cand-mock-01'")
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO users (
            id, email, full_name, role, user_class, college, experience_years,
            readiness_score, current_tier, avatar_url, verified_skills_json
        ) VALUES (
            'cand-mock-01', 'cloud.candidate@example.com', 'Alex Rivera', 'student', 'Experienced',
            'Indian Institute of Technology (IIT) Delhi', 3.0, 92, 'job_ready',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            ?
        )
        """, (default_verified_skills,))

    conn.commit()
    conn.close()

    # Synchronize SQLAlchemy relational tables (dispatched_sprints, verified_credentials, organizations, etc.)
    try:
        from app.db.session import engine
        import app.models.entities
        app.models.entities.Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"[init_db] Warning creating SQLAlchemy tables: {e}")

def get_user_verified_skills(user_id: str) -> List[str]:
    """
    Returns array of verified skills for a user from their profile and passed assessments.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Profile verified_skills_json
    cursor.execute("SELECT verified_skills_json FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    skills_set = set()
    if row and row["verified_skills_json"]:
        try:
            profile_skills = json.loads(row["verified_skills_json"])
            if isinstance(profile_skills, list):
                skills_set.update(profile_skills)
        except Exception:
            pass

    # 2. Passed assessments
    cursor.execute("""
    SELECT DISTINCT s.name 
    FROM assessments a
    JOIN skills s ON a.skill_id = s.id
    WHERE a.user_id = ? AND a.verification_status = 'Passed'
    """, (user_id,))
    for asmt_row in cursor.fetchall():
        skills_set.add(asmt_row["name"])

    conn.close()
    return list(skills_set)

def get_all_candidate_profiles() -> List[Dict[str, Any]]:
    """
    Returns all student candidate profiles along with their verified skills array.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, role, college, current_tier, readiness_score, verified_skills_json FROM users WHERE role = 'student'")
    candidates = []
    for r in cursor.fetchall():
        v_skills = []
        if r["verified_skills_json"]:
            try:
                parsed = json.loads(r["verified_skills_json"])
                if isinstance(parsed, list):
                    v_skills = parsed
            except Exception:
                pass
        
        candidates.append({
            "id": r["id"],
            "email": r["email"],
            "full_name": r["full_name"],
            "role": r["role"],
            "college": r["college"],
            "current_tier": r["current_tier"],
            "readiness_score": r["readiness_score"],
            "verified_skills": v_skills
        })
    conn.close()
    return candidates

# Auto-initialize DB on import
init_db()
