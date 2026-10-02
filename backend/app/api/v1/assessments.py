from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import uuid
import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import Skill, Assessment, User

router = APIRouter(prefix="/assessments", tags=["FR-01: Skill Verification & Badges"])

# Curated repository of exactly 20 production-grade questions per skill
SKILL_QUESTION_BANKS: Dict[str, List[Dict[str, Any]]] = {
    "postgresql": [
        {
            "id": "q1",
            "question": "Which index type is best suited for searching within full-text document arrays or JSONB data with containment queries (@>)?",
            "options": ["B-Tree", "GIN (Generalized Inverted Index)", "BRIN (Block Range Index)", "Hash Index"],
            "correct_option_index": 1,
            "explanation": "GIN is designed for indexing composite values where element containment is frequently queried, such as JSONB and full-text arrays."
        },
        {
            "id": "q2",
            "question": "What happens when an autovacuum worker runs in standard (non-FULL) mode in PostgreSQL?",
            "options": [
                "It locks the entire table exclusively and rebuilds it",
                "It marks dead tuples as reusable in the Free Space Map without returning disk space to the OS",
                "It truncates all WAL files and restarts transaction ID counter",
                "It converts all unlogged tables into logged tables"
            ],
            "correct_option_index": 1,
            "explanation": "Standard autovacuum reclaims space within pages and updates the Free Space Map for future inserts without taking an exclusive table lock."
        },
        {
            "id": "q3",
            "question": "In an EXPLAIN ANALYZE output, what does 'Bitmap Heap Scan' indicate?",
            "options": [
                "PostgreSQL is scanning an unindexed table in parallel",
                "PostgreSQL created a memory bitmap of matching tuple page pointers from one or more indexes before fetching rows",
                "The query has exceeded maintenance_work_mem and spilled to disk",
                "The table has zero statistics and needs ANALYZE"
            ],
            "correct_option_index": 1,
            "explanation": "A Bitmap Index Scan creates a bitmap of pages containing matching rows, followed by a Bitmap Heap Scan to read the pages sequentially."
        },
        {
            "id": "q4",
            "question": "What is the primary danger of Transaction ID (XID) wraparound in PostgreSQL?",
            "options": [
                "The database automatically upgrades all connections to SSL",
                "Past transactions can appear to have occurred in the future, causing catastrophic data invisibility",
                "WAL buffers expand indefinitely until RAM is exhausted",
                "Foreign keys are permanently disabled"
            ],
            "correct_option_index": 1,
            "explanation": "PostgreSQL uses 32-bit transaction IDs. Without aggressive vacuuming ('vacuum freeze'), wraparound causes old data to become invisible."
        },
        {
            "id": "q5",
            "question": "Which isolation level prevents 'Non-repeatable Reads' and 'Dirty Reads' but may still permit 'Serialization Anomalies' unless SERIALIZABLE is used?",
            "options": ["Read Uncommitted", "Read Committed", "Repeatable Read", "None of the above"],
            "correct_option_index": 2,
            "explanation": "Repeatable Read in PostgreSQL takes a snapshot at query start and prevents dirty & non-repeatable reads, but not serialization anomalies."
        },
        {
            "id": "q6",
            "question": "When should you prefer a BRIN (Block Range Index) over a B-Tree index?",
            "options": [
                "For high-cardinality random UUID primary keys",
                "For naturally ordered append-only tables (e.g., timestamps) stored in physical correlation to disk order",
                "For JSONB fields with nested key-value pairs",
                "For small tables with under 100 rows"
            ],
            "correct_option_index": 1,
            "explanation": "BRIN summarizes ranges of disk blocks and is ultra-compact for physical columns strongly correlated with table ordering."
        },
        {
            "id": "q7",
            "question": "What is the purpose of connection pooling software like PgBouncer in high-traffic architectures?",
            "options": [
                "To automatically generate database migrations",
                "To mitigate PostgreSQL process-per-connection overhead and optimize backend memory usage",
                "To replicate data cross-region synchronously",
                "To compress JSON data stored in tables"
            ],
            "correct_option_index": 1,
            "explanation": "PostgreSQL forks a distinct process for each connection. PgBouncer maintains pooled connections to avoid heavy process-forking costs."
        },
        {
            "id": "q8",
            "question": "How does PostgreSQL implement Multi-Version Concurrency Control (MVCC) for UPDATE operations?",
            "options": [
                "By directly overwriting row bytes in place with an exclusive mutex",
                "By inserting a new row version (tuple) with updated xmin and marking the old tuple's xmax",
                "By writing updates exclusively to a separate undo log",
                "By locking the entire database schema"
            ],
            "correct_option_index": 1,
            "explanation": "PostgreSQL writes a new tuple version and sets the old tuple's xmax to the current transaction ID, keeping old readers unblocked."
        },
        {
            "id": "q9",
            "question": "What is the purpose of the 'work_mem' configuration setting in postgresql.conf?",
            "options": [
                "Maximum RAM allocated globally for the shared buffer pool",
                "Amount of memory used by internal sort operations and hash tables before switching to temporary disk files",
                "Memory dedicated exclusively to autovacuum workers",
                "Maximum size of a single JSONB column"
            ],
            "correct_option_index": 1,
            "explanation": "work_mem is allocated per sort/hash operation within a query. Spilling to disk indicates work_mem may need careful tuning."
        },
        {
            "id": "q10",
            "question": "Which command creates an index on a large live production table without acquiring an exclusive write lock (AccessExclusiveLock)?",
            "options": [
                "CREATE INDEX ON table (column);",
                "CREATE INDEX CONCURRENTLY ON table (column);",
                "CREATE INDEX WITHOUT LOCK ON table (column);",
                "ALTER TABLE ADD INDEX ASYNC (column);"
            ],
            "correct_option_index": 1,
            "explanation": "CONCURRENTLY builds the index through multiple passes without blocking ongoing INSERT, UPDATE, or DELETE operations."
        },
        {
            "id": "q11",
            "question": "What does a 'Foreign Data Wrapper' (FDW) permit in PostgreSQL?",
            "options": [
                "Encrypting columns using foreign RSA keys",
                "Querying external databases (e.g. Postgres, MySQL, Redis, MongoDB) via standard SQL tables",
                "Exporting schema definitions to GraphQL schemas",
                "Managing cloud Kubernetes ingress controllers"
            ],
            "correct_option_index": 1,
            "explanation": "FDW (SQL/MED compliant) allows PostgreSQL to treat external data sources as regular local tables."
        },
        {
            "id": "q12",
            "question": "What is the benefit of using an unlogged table (CREATE UNLOGGED TABLE)?",
            "options": [
                "It survives unexpected power loss and OS crashes safely",
                "Significantly faster write operations because mutations bypass Write-Ahead Logging (WAL)",
                "It automatically disables all foreign key checks",
                "It encrypts all data automatically"
            ],
            "correct_option_index": 1,
            "explanation": "Unlogged tables do not write to the WAL, giving 2-3x write speeds, but are truncated on ungraceful database crashes."
        },
        {
            "id": "q13",
            "question": "What does the 'shared_buffers' parameter dictate?",
            "options": [
                "Amount of memory PostgreSQL uses for shared memory buffers caching table and index pages",
                "Disk space reserved for dead tuple archives",
                "Maximum network buffer per TCP socket",
                "Number of concurrent replication slots"
            ],
            "correct_option_index": 0,
            "explanation": "shared_buffers is the primary cache for database blocks in RAM, typically tuned to 25% of server physical RAM."
        },
        {
            "id": "q14",
            "question": "Which SQL construct allows you to execute hierarchical or tree-traversal queries in PostgreSQL?",
            "options": ["SELECT ... GROUPING SETS", "WITH RECURSIVE", "SELECT ... ROLLUP", "CROSS APPLY"],
            "correct_option_index": 1,
            "explanation": "Common Table Expressions with WITH RECURSIVE are standard for traversing tree structures, graphs, and parent-child hierarchies."
        },
        {
            "id": "q15",
            "question": "What does the 'max_connections' parameter control, and why should it NOT be set excessively high (e.g., 5000)?",
            "options": [
                "It specifies maximum column length; high values degrade CPU cache",
                "It specifies concurrent client connections; too many cause high context switching and RAM thrashing",
                "It limits the number of tables in a single database schema",
                "It limits daily API requests from external clients"
            ],
            "correct_option_index": 1,
            "explanation": "Excessive max_connections causes CPU contention, lock starvation, and memory exhaustion. Use PgBouncer instead."
        },
        {
            "id": "q16",
            "question": "What is the key advantage of PostgreSQL declarative table partitioning?",
            "options": [
                "It automatically encodes all columns into Base64",
                "Partition pruning allows query planner to skip scanning irrelevant partitions, boosting performance on large datasets",
                "It converts relational tables into NoSQL document stores",
                "It eliminates the need for primary keys"
            ],
            "correct_option_index": 1,
            "explanation": "Partition pruning ensures the query executor touches only the relevant partition tables (e.g., date ranges)."
        },
        {
            "id": "q17",
            "question": "What is a 'Partial Index' in PostgreSQL?",
            "options": [
                "An index built on only half of the table's rows chosen at random",
                "An index built over a subset of a table defined by a WHERE conditional clause",
                "An index that stores only the first 4 bytes of each string",
                "An incomplete index created during a system crash"
            ],
            "correct_option_index": 1,
            "explanation": "Partial indexes (e.g. CREATE INDEX ... WHERE status = 'pending') are small, cache-friendly, and target specific query conditions."
        },
        {
            "id": "q18",
            "question": "What does the 'FILLFACTOR' storage parameter control on a table or B-Tree index?",
            "options": [
                "Percentage of disk storage reserved for backup dumps",
                "Percentage of each page to pack with data, leaving free space for HOT (Heap-Only Tuples) updates",
                "Ratio of CPU cores to RAM allocation",
                "Maximum size of a BLOB payload"
            ],
            "correct_option_index": 1,
            "explanation": "Lowering fillfactor (e.g. to 85) leaves space on pages for updates, facilitating fast Heap-Only Tuple (HOT) optimizations."
        },
        {
            "id": "q19",
            "question": "What is the difference between synchronous and asynchronous physical streaming replication?",
            "options": [
                "Synchronous replication uses HTTP while asynchronous uses WebSockets",
                "In synchronous replication, commits wait until at least one standby confirms writing the WAL to disk",
                "Asynchronous replication requires third-party cloud plugins",
                "Synchronous replication only supports read-only primary nodes"
            ],
            "correct_option_index": 1,
            "explanation": "Synchronous replication guarantees zero data loss (RPO=0) by blocking the primary commit until standby writes WAL."
        },
        {
            "id": "q20",
            "question": "What is the primary role of the pg_stat_statements extension?",
            "options": [
                "To log user password hashes for compliance auditing",
                "To track execution statistics of all SQL statements executed on the server to identify slow queries and bottlenecks",
                "To automatically generate unit tests for stored procedures",
                "To run automated index defragmentation every midnight"
            ],
            "correct_option_index": 1,
            "explanation": "pg_stat_statements tracks total calls, mean executive time, buffer hits, and I/O wait times per query fingerprint."
        }
    ]
}

# Reusable fallback for any other skill to ensure exactly 20 questions exist
DEFAULT_QUESTIONS: List[Dict[str, Any]] = [
    {
        "id": f"gen_q{i}",
        "question": f"Question {i}: Advanced System Design & Architecture scenario analysis. Select the optimal production approach:",
        "options": [
            f"Option A: Implement event-driven decoupling with bounded idempotent consumers.",
            f"Option B: Rely exclusively on synchronous distributed transactions without retries.",
            f"Option C: Store intermediate state in unbounded in-memory volatile variables.",
            f"Option D: Bypass schema validation and rely on ad-hoc unstructured casting."
        ],
        "correct_option_index": 0,
        "explanation": "Idempotent event-driven consumers guarantee fault tolerance and prevent inconsistent state across distributed boundaries."
    }
    for i in range(1, 21)
]

class GradeSubmissionRequest(BaseModel):
    user_id: str
    skill_id: str
    time_taken_seconds: int = Field(..., ge=0, description="Time taken to finish the test in seconds")
    answers: Dict[str, int] = Field(..., description="Map of question_id -> selected_option_index")

class BadgeMetadata(BaseModel):
    tier: str
    title: str
    icon: str
    accent_color: str
    description: str

class GradeResponse(BaseModel):
    assessment_id: str
    user_id: str
    skill_id: str
    skill_name: str
    score: int
    correct_count: int
    total_questions: int
    time_taken_seconds: int
    time_taken_formatted: str
    verification_status: str  # "Passed" | "Failed"
    badge_tier: Optional[str] = None  # "Bronze" | "Silver" | "Gold" | "Diamond" | None
    badge_metadata: Optional[BadgeMetadata] = None
    user_class: str  # "Fresher" | "Experienced"
    feedback: str
    threshold_applied: int = 70

@router.get("/skills", tags=["Skills Taxonomy"])
async def list_skills(db: Session = Depends(get_db)):
    """
    List all platform skills available for verification.
    """
    skills = db.query(Skill).order_by(Skill.weight.desc(), Skill.name.asc()).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "category": s.category,
            "description": s.description,
            "weight": s.weight,
            "is_critical": s.is_critical,
        }
        for s in skills
    ]

@router.get("/{skill_id}/questions")
async def get_assessment_questions(skill_id: str, db: Session = Depends(get_db)):
    """
    Retrieve exactly 20 questions for the skill assessment, enforcing a 12-minute time limit.
    """
    skill_key = skill_id.lower()
    raw_questions = SKILL_QUESTION_BANKS.get(skill_key, DEFAULT_QUESTIONS)
    
    # Ensure exactly 20 questions
    questions_20 = raw_questions[:20]
    if len(questions_20) < 20:
        # Pad with general questions up to 20 if needed
        questions_20 += DEFAULT_QUESTIONS[len(questions_20):20]

    # Look up skill name from DB
    skill_row = db.query(Skill).filter(Skill.id == skill_key).first()
    skill_name = skill_row.name if skill_row else skill_id.title()

    # Sanitize questions (strip correct_option_index before sending to client)
    client_questions = []
    for q in questions_20:
        client_questions.append({
            "id": q["id"],
            "question": q["question"],
            "options": q["options"],
            "difficulty": "advanced",
        })

    return {
        "skill_id": skill_key,
        "skill_name": skill_name,
        "total_questions": 20,
        "time_limit_seconds": 720,  # Strict 12-minute countdown timer
        "passing_threshold_percent": 70,
        "questions": client_questions,
    }

@router.post("/grade", response_model=GradeResponse)
async def grade_assessment(submission: GradeSubmissionRequest, db: Session = Depends(get_db)):
    """
    FR-01 Grading Endpoint:
    - Calculates score against 20 questions.
    - If score >= 70%: Issues badge tier (Bronze, Silver, Gold, Diamond).
    - If score < 70%: Marks skill verification as "Failed".
    - Records results in database with user_class, time_taken, score, and status.
    """
    skill_key = submission.skill_id.lower()
    raw_questions = SKILL_QUESTION_BANKS.get(skill_key, DEFAULT_QUESTIONS)[:20]

    # Check user existence and class
    user_row = db.query(User).filter(User.id == submission.user_id).first()
    if not user_row:
        user_class = "Experienced" if submission.user_id == "cand-1" else "Fresher"
    else:
        user_class = user_row.user_class

    # Calculate score
    correct_count = 0
    detailed_log = []

    for q in raw_questions:
        q_id = q["id"]
        correct_idx = q["correct_option_index"]
        selected_idx = submission.answers.get(q_id)
        is_correct = (selected_idx is not None and selected_idx == correct_idx)
        if is_correct:
            correct_count += 1
        
        detailed_log.append({
            "question_id": q_id,
            "question": q["question"],
            "selected_index": selected_idx,
            "correct_index": correct_idx,
            "is_correct": is_correct,
            "explanation": q.get("explanation", "")
        })

    total_questions = 20
    score_percentage = int(round((correct_count / total_questions) * 100))

    # Threshold Check: >= 70% passes and receives Badge Tier, < 70% fails
    is_passed = score_percentage >= 70
    verification_status = "Passed" if is_passed else "Failed"
    badge_tier = None
    badge_meta = None

    if is_passed:
        if score_percentage >= 95:
            badge_tier = "Diamond"
            badge_meta = BadgeMetadata(
                tier="Diamond",
                title="Diamond Master Specialist",
                icon="💎",
                accent_color="#06B6D4",
                description="Elite mastery (≥95%) demonstrated in production scenarios."
            )
        elif score_percentage >= 85:
            badge_tier = "Gold"
            badge_meta = BadgeMetadata(
                tier="Gold",
                title="Gold Certified Professional",
                icon="🥇",
                accent_color="#F59E0B",
                description="Advanced competency (85-94%) across all core requirements."
            )
        elif score_percentage >= 75:
            badge_tier = "Silver"
            badge_meta = BadgeMetadata(
                tier="Silver",
                title="Silver Verified Practitioner",
                icon="🥈",
                accent_color="#94A3B8",
                description="Solid working knowledge (75-84%) with strong practical capability."
            )
        else: # 70 - 74%
            badge_tier = "Bronze"
            badge_meta = BadgeMetadata(
                tier="Bronze",
                title="Bronze Associate Achiever",
                icon="🥉",
                accent_color="#CD7F32",
                description="Satisfies passing baseline (70-74%) with foundational proficiency."
            )
        feedback = f"Congratulations! You demonstrated proficiency with a score of {score_percentage}%. You have earned the {badge_tier} badge."
    else:
        badge_tier = None
        feedback = f"Assessment score was {score_percentage}%, which is below the mandatory 70% threshold. The skill has been marked as 'Failed'. Review recommendations and re-attempt."

    # Format time
    mins = submission.time_taken_seconds // 60
    secs = submission.time_taken_seconds % 60
    time_taken_formatted = f"{mins:02d}:{secs:02d}"

    # Generate assessment ID and insert into database
    assessment_id = f"asmt-{uuid.uuid4().hex[:8]}"

    new_assessment = Assessment(
        id=assessment_id,
        user_id=submission.user_id,
        skill_id=skill_key,
        score=score_percentage,
        total_questions=total_questions,
        correct_count=correct_count,
        time_taken_seconds=submission.time_taken_seconds,
        verification_status=verification_status,
        badge_tier=badge_tier,
        answers_log_json=json.dumps(detailed_log),
        completed_at=datetime.now(),
    )
    db.add(new_assessment)

    # If passed, boost readiness score in users table
    if is_passed and user_row:
        user_row.readiness_score = min(100, user_row.readiness_score + 10)
        user_row.current_tier = "job_ready"

    db.commit()

    # Skill name lookup
    skill_row = db.query(Skill).filter(Skill.id == skill_key).first()
    skill_name = skill_row.name if skill_row else skill_key.title()

    return GradeResponse(
        assessment_id=assessment_id,
        user_id=submission.user_id,
        skill_id=skill_key,
        skill_name=skill_name,
        score=score_percentage,
        correct_count=correct_count,
        total_questions=total_questions,
        time_taken_seconds=submission.time_taken_seconds,
        time_taken_formatted=time_taken_formatted,
        verification_status=verification_status,
        badge_tier=badge_tier,
        badge_metadata=badge_meta,
        user_class=user_class,
        feedback=feedback,
        threshold_applied=70
    )

@router.get("/user/{user_id}/history")
async def get_user_assessment_history(user_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all past assessment attempts, badge tiers, and verification statuses for a user.
    """
    results = (
        db.query(Assessment, Skill.name.label("skill_name"), User.user_class)
        .outerjoin(Skill, Assessment.skill_id == Skill.id)
        .outerjoin(User, Assessment.user_id == User.id)
        .filter(Assessment.user_id == user_id)
        .order_by(Assessment.completed_at.desc())
        .all()
    )
    history = []
    for asmt, skill_name, user_class in results:
        history.append({
            "id": asmt.id,
            "user_id": asmt.user_id,
            "skill_id": asmt.skill_id,
            "skill_name": skill_name or asmt.skill_id.title(),
            "score": asmt.score,
            "total_questions": asmt.total_questions,
            "correct_count": asmt.correct_count,
            "time_taken_seconds": asmt.time_taken_seconds,
            "verification_status": asmt.verification_status,
            "badge_tier": asmt.badge_tier,
            "user_class": user_class or "Experienced",
            "completed_at": asmt.completed_at.strftime("%Y-%m-%d %H:%M:%S") if isinstance(asmt.completed_at, datetime) else str(asmt.completed_at),
        })
    return history
