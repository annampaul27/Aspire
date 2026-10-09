"""
CareerCompass Courses & Timed Mock Tests API
Authored by Jayasree A B (branch: courses)
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.db.database import get_db_connection

logger = logging.getLogger("careercompass_courses")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/courses", tags=["CareerCompass Courses & Mock Tests (Jayasree A B)"])

__author__ = "Jayasree A B <jayasreeab2004@gmail.com>"
__branch__ = "courses"

def get_courses_root_dir() -> Path:
    """
    Locates the courses directory reliably across development, testing, and production.
    """
    current_file = Path(__file__).resolve()
    # Check parent levels: root of workspace is typically parents[4] or parents[3]
    for parent in current_file.parents:
        candidate = parent / "courses"
        if candidate.is_dir():
            return candidate
    
    # Fallback to local cwd
    cwd_candidate = Path.cwd() / "courses"
    if cwd_candidate.is_dir():
        return cwd_candidate
    
    raise FileNotFoundError("CareerCompass courses directory could not be located.")


def find_course_dir(identifier: str) -> Path:
    """
    Finds a course folder either by its slug (e.g. 'python') or by course_id (e.g. 'python_fundamentals').
    """
    root = get_courses_root_dir()
    identifier_clean = identifier.strip().lower()
    
    # Direct folder match
    direct_match = root / identifier_clean
    if direct_match.is_dir() and (direct_match / "course.json").exists():
        return direct_match

    # Scan for course_id match
    for sub in root.iterdir():
        if sub.is_dir():
            course_file = sub / "course.json"
            if course_file.exists():
                try:
                    with open(course_file, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        if data.get("course_id", "").lower() == identifier_clean:
                            return sub
                except Exception:
                    continue

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Course with identifier '{identifier}' was not found in CareerCompass library."
    )


class MockTestSubmission(BaseModel):
    user_id: Optional[str] = Field("cand-1", description="ID of student submitting the mock test")
    answers: Dict[str, Any] = Field(
        ...,
        description="Mapping of question_id (as string) to selected option index or string answer",
        examples=[{"1": 1, "2": 0, "3": 2}]
    )


@router.get("", summary="List All CareerCompass Courses (Jayasree A B)")
async def list_all_courses():
    """
    Retrieves the complete catalog of 13 CareerCompass modular courses authored by Jayasree A B.
    """
    root = get_courses_root_dir()
    catalog = []
    
    for sub in sorted(root.iterdir()):
        if sub.is_dir():
            course_file = sub / "course.json"
            if course_file.exists():
                try:
                    with open(course_file, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        data["slug"] = sub.name
                        catalog.append(data)
                except Exception as e:
                    logger.warning(f"Error parsing {course_file}: {e}")

    return {
        "status": "success",
        "author": "Jayasree A B <jayasreeab2004@gmail.com>",
        "total_courses": len(catalog),
        "courses": catalog
    }


@router.get("/{identifier}", summary="Get Course Overview (Jayasree A B)")
async def get_course_overview(identifier: str):
    """
    Retrieves full metadata, learning objectives, and mock test specifications for a given course.
    """
    course_dir = find_course_dir(identifier)
    course_file = course_dir / "course.json"
    
    with open(course_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    data["slug"] = course_dir.name
    return data


@router.get("/{identifier}/lessons", summary="Get Course Lessons & Code Examples (Jayasree A B)")
async def get_course_lessons(identifier: str):
    """
    Retrieves granular step-by-step lessons, conceptual cards, syntax walkthroughs, and code snippets.
    """
    course_dir = find_course_dir(identifier)
    lessons_file = course_dir / "lessons.json"
    
    if not lessons_file.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lessons not found for course '{identifier}'"
        )

    with open(lessons_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    data["slug"] = course_dir.name
    return data


@router.get("/{identifier}/mock-test", summary="Get Timed 20-Question Mock Test (Jayasree A B)")
async def get_course_mock_test(
    identifier: str,
    include_answers: bool = Query(False, description="Whether to include answer keys (for instructors/reviewers)")
):
    """
    Retrieves the 20-question, 12-minute practice mock test with option choices.
    Hides correct answers by default to maintain test integrity for candidates.
    """
    course_dir = find_course_dir(identifier)
    test_file = course_dir / "mock_test.json"
    
    if not test_file.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mock test not found for course '{identifier}'"
        )

    with open(test_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    sanitized_questions = []
    for q in data.get("questions", []):
        q_copy = dict(q)
        if not include_answers:
            q_copy.pop("correct_answer", None)
            q_copy.pop("explanation", None)
        sanitized_questions.append(q_copy)

    return {
        "course_id": data.get("course_id"),
        "slug": course_dir.name,
        "title": data.get("title"),
        "duration_minutes": data.get("duration_minutes", 12),
        "question_count": len(sanitized_questions),
        "total_marks": data.get("total_marks", len(sanitized_questions)),
        "passing_score": data.get("passing_score", 60),
        "questions": sanitized_questions
    }


@router.post("/{identifier}/mock-test/submit", summary="Submit Mock Test & Auto-Grade (Jayasree A B)")
async def submit_course_mock_test(identifier: str, submission: MockTestSubmission):
    """
    Evaluates candidate answers against the 20-question mock test, computing total score,
    percentage, passing verdict, and question-by-question rationales.
    """
    course_dir = find_course_dir(identifier)
    test_file = course_dir / "mock_test.json"
    course_file = course_dir / "course.json"

    with open(test_file, "r", encoding="utf-8") as f:
        test_data = json.load(f)

    course_subject = course_dir.name.capitalize()
    if course_file.exists():
        with open(course_file, "r", encoding="utf-8") as f:
            c_meta = json.load(f)
            course_subject = c_meta.get("subject", course_subject)

    questions = test_data.get("questions", [])
    total_questions = len(questions)
    passing_score = test_data.get("passing_score", 60)

    score = 0
    question_results = []

    for q in questions:
        qid_str = str(q.get("question_id"))
        correct_ans = q.get("correct_answer")
        user_ans = submission.answers.get(qid_str)

        # Match either exact option index, or option text
        is_correct = False
        if user_ans is not None:
            if user_ans == correct_ans:
                is_correct = True
            elif isinstance(user_ans, int) and isinstance(correct_ans, int) and user_ans == correct_ans:
                is_correct = True
            elif str(user_ans).strip().lower() == str(correct_ans).strip().lower():
                is_correct = True
            elif isinstance(correct_ans, int) and 0 <= correct_ans < len(q.get("options", [])):
                if str(user_ans).strip().lower() == str(q["options"][correct_ans]).strip().lower():
                    is_correct = True

        if is_correct:
            score += 1

        question_results.append({
            "question_id": q.get("question_id"),
            "question": q.get("question"),
            "user_answer": user_ans,
            "correct_answer": correct_ans,
            "is_correct": is_correct,
            "explanation": q.get("explanation", "")
        })

    percentage = round((score / max(1, total_questions)) * 100, 1)
    is_passed = percentage >= passing_score

    # If passed, append to user's verified skills list in database
    if is_passed and submission.user_id:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT verified_skills_json FROM users WHERE id = ?", (submission.user_id,))
            row = cursor.fetchone()
            if row:
                skills_list = []
                if row["verified_skills_json"]:
                    try:
                        skills_list = json.loads(row["verified_skills_json"])
                    except Exception:
                        pass
                if course_subject not in skills_list:
                    skills_list.append(course_subject)
                    cursor.execute(
                        "UPDATE users SET verified_skills_json = ? WHERE id = ?",
                        (json.dumps(skills_list), submission.user_id)
                    )
                    conn.commit()
            conn.close()
        except Exception as e:
            logger.warning(f"Could not record passed course skill in database: {e}")

    return {
        "status": "completed",
        "course_id": test_data.get("course_id"),
        "course_title": test_data.get("title"),
        "subject": course_subject,
        "user_id": submission.user_id,
        "score": score,
        "total_questions": total_questions,
        "score_percentage": percentage,
        "passing_score": passing_score,
        "is_passed": is_passed,
        "evaluated_by": "CareerCompass Automated Grader (Jayasree A B)",
        "results": question_results
    }
