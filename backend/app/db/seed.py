from sqlalchemy.orm import Session
from app.db.session import engine, SessionLocal
from app.models.entities import (
    Base, Organization, User, Subscription
)
from app.core.security import get_password_hash

DEFAULT_HASHED_PASSWORD = get_password_hash("AspireAI@2026")

def seed_database_defaults(db: Session = None):
    """
    Seeds initial enterprise multi-tenant organizations, users, and subscriptions
    into the relational database if not already seeded.
    """
    # Ensure all relational tables exist before querying or seeding
    Base.metadata.create_all(bind=engine)

    # Ensure password_hash, org_id, and pipeline_status exist on users table for existing SQLite databases
    with engine.begin() as conn:
        try:
            from sqlalchemy import inspect, text
            inspector = inspect(conn)
            if "users" in inspector.get_table_names():
                cols = [c["name"] for c in inspector.get_columns("users")]
                if "password_hash" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
                if "org_id" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN org_id VARCHAR(64)"))
                if "pipeline_status" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN pipeline_status VARCHAR(32) DEFAULT 'applied'"))

            if "subscriptions" in inspector.get_table_names():
                sub_cols = [c["name"] for c in inspector.get_columns("subscriptions")]
                sub_additions = [
                    ("user_id", "VARCHAR(64)"),
                    ("provider", "VARCHAR(32) DEFAULT 'razorpay'"),
                    ("provider_subscription_id", "VARCHAR(128)"),
                    ("provider_payment_id", "VARCHAR(128)"),
                    ("current_period_start", "DATETIME"),
                    ("current_period_end", "DATETIME"),
                    ("evaluations_used", "INTEGER DEFAULT 0"),
                    ("evaluations_limit", "INTEGER DEFAULT 25"),
                    ("active_jobs_limit", "INTEGER DEFAULT 3"),
                ]
                for col_name, col_type in sub_additions:
                    if col_name not in sub_cols:
                        conn.execute(text(f"ALTER TABLE subscriptions ADD COLUMN {col_name} {col_type}"))
                conn.execute(text("UPDATE subscriptions SET active_jobs_limit = -1, evaluations_limit = -1 WHERE plan_id = 'enterprise'"))
                conn.execute(text("UPDATE subscriptions SET active_jobs_limit = 10, evaluations_limit = 250 WHERE plan_id = 'growth'"))
        except Exception:
            pass

    close_at_end = False
    if db is None:
        db = SessionLocal()
        close_at_end = True

    try:
        # 1. Seed Organizations
        if db.query(Organization).count() == 0:
            orgs = [
                Organization(
                    id="org-acme",
                    name="Acme HyperScale Systems",
                    type="corporate",
                    logo="⚡",
                    plan="Enterprise",
                    seats_used=14,
                    seats_total=25,
                    status="active",
                ),
                Organization(
                    id="org-apex-univ",
                    name="Apex National Institute of Technology",
                    type="university",
                    logo="🎓",
                    plan="Academic Pass",
                    seats_used=8,
                    seats_total=10,
                    status="active",
                ),
                Organization(
                    id="org-talentbridge",
                    name="TalentBridge Staffing Partners",
                    type="staffing",
                    logo="🌐",
                    plan="Growth",
                    seats_used=6,
                    seats_total=10,
                    status="active",
                ),
            ]
            db.add_all(orgs)
            db.commit()

        # 2. Seed Subscriptions
        if db.query(Subscription).count() == 0:
            subs = [
                Subscription(
                    id="sub-acme-ent",
                    org_id="org-acme",
                    plan_id="enterprise",
                    status="active",
                    seats_purchased=25,
                    billing_cycle="annual",
                    active_jobs_limit=-1,
                    evaluations_limit=-1,
                    evaluations_used=0,
                ),
                Subscription(
                    id="sub-apex-acad",
                    org_id="org-apex-univ",
                    plan_id="academic",
                    status="active",
                    seats_purchased=10,
                    billing_cycle="annual",
                    active_jobs_limit=5,
                    evaluations_limit=100,
                    evaluations_used=0,
                ),
                Subscription(
                    id="sub-talentbridge-growth",
                    org_id="org-talentbridge",
                    plan_id="growth",
                    status="active",
                    seats_purchased=10,
                    billing_cycle="monthly",
                    active_jobs_limit=10,
                    evaluations_limit=250,
                    evaluations_used=0,
                ),
            ]
            db.add_all(subs)
            db.commit()

        # 3. Seed Users with password hashes and roles
        users_to_seed = [
            {
                "id": "usr-recruiter-01",
                "email": "priya.sharma@acme.com",
                "full_name": "Priya Sharma",
                "role": "employer",
                "org_id": "org-acme",
                "user_class": "Lead Recruiter",
                "password_hash": DEFAULT_HASHED_PASSWORD,
                "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
            },
            {
                "id": "usr-recruiter-02",
                "email": "rohit.mehta@acme.com",
                "full_name": "Rohit Mehta",
                "role": "employer",
                "org_id": "org-acme",
                "user_class": "Technical Hiring Manager",
                "password_hash": DEFAULT_HASHED_PASSWORD,
                "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            },
            {
                "id": "usr-recruiter-tb",
                "email": "sarah.connor@talentbridge.com",
                "full_name": "Sarah Connor",
                "role": "employer",
                "org_id": "org-talentbridge",
                "user_class": "Staffing Partner",
                "password_hash": DEFAULT_HASHED_PASSWORD,
                "avatar_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
            },
            {
                "id": "cand-1",
                "email": "aditya.verma@example.com",
                "full_name": "Aditya Verma",
                "role": "student",
                "org_id": None,
                "user_class": "Experienced",
                "college": "Indian Institute of Information Technology (IIIT)",
                "experience_years": 2.5,
                "readiness_score": 78,
                "current_tier": "bridgeable",
                "password_hash": DEFAULT_HASHED_PASSWORD,
                "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                "verified_skills_json": '["Python", "SQL", "AWS", "Docker"]',
            },
            {
                "id": "cand-2",
                "email": "pooja.s@example.com",
                "full_name": "Pooja Sundaram",
                "role": "student",
                "org_id": None,
                "user_class": "Fresher",
                "college": "National Institute of Technology (NIT) Trichy",
                "experience_years": 0.0,
                "readiness_score": 91,
                "current_tier": "job_ready",
                "password_hash": DEFAULT_HASHED_PASSWORD,
                "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
                "verified_skills_json": '["React", "TypeScript", "Next.js"]',
            },
            {
                "id": "usr-superuser-root",
                "email": "root@aspire.ai",
                "full_name": "Platform Superuser",
                "role": "admin",
                "org_id": None,
                "user_class": "Administrator",
                "password_hash": DEFAULT_HASHED_PASSWORD,
                "avatar_url": None,
            },
        ]

        for u_data in users_to_seed:
            existing = db.query(User).filter((User.email == u_data["email"]) | (User.id == u_data["id"])).first()
            if not existing:
                db.add(User(**u_data))
            else:
                existing.email = u_data["email"]
                existing.password_hash = u_data["password_hash"]
                if u_data.get("org_id"):
                    existing.org_id = u_data["org_id"]
        db.commit()

    finally:
        if close_at_end:
            db.close()

if __name__ == "__main__":
    seed_database_defaults()
    print("Database seeding completed.")
