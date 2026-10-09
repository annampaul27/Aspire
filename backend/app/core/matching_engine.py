from typing import List, Dict, Any, Set
import re

# Comprehensive canonical taxonomy mapping
CANONICAL_SYNONYMS: Dict[str, str] = {
    "python": "python",
    "python3": "python",
    "python 3": "python",
    "py": "python",
    "sql": "sql",
    "postgresql": "postgresql",
    "postgres": "postgresql",
    "mysql": "mysql",
    "sqlite": "sqlite",
    "relational database": "sql",
    "aws": "aws",
    "amazon web services": "aws",
    "amazon webservices": "aws",
    "docker": "docker",
    "docker containerization": "docker",
    "containerization": "docker",
    "containers": "docker",
    "react": "react",
    "reactjs": "react",
    "react.js": "react",
    "react 19": "react",
    "nextjs": "nextjs",
    "next.js": "nextjs",
    "fastapi": "fastapi",
    "kubernetes": "kubernetes",
    "k8s": "kubernetes",
    "redis": "redis",
    "git": "git",
    "linux": "linux",
    "typescript": "typescript",
    "ts": "typescript",
    "javascript": "javascript",
    "js": "javascript",
}

def normalize_skill(skill: str) -> str:
    """
    Normalizes a skill name by trimming, lowercasing, and looking up its canonical form.
    """
    if not skill:
        return ""
    cleaned = skill.strip().lower()
    # Remove redundant trailing version or punctuation
    cleaned = re.sub(r'[\(\)\[\]\{\}]', '', cleaned)
    return CANONICAL_SYNONYMS.get(cleaned, cleaned)

def calculate_match_percentage(
    user_skills: List[str],
    required_skills: List[str],
    threshold: float = 80.0
) -> Dict[str, Any]:
    """
    FR-05 Matching Engine:
    Compares a candidate's verified skills against an incoming job's required skills.
    
    Formula:
      Match Percentage P = (|user_verified_skills ∩ job_required_skills| / |job_required_skills|) * 100
      Eligible Match = True if P >= threshold (default 80.0%)
    """
    if not required_skills:
        return {
            "match_percentage": 100.0,
            "is_eligible_match": True,
            "threshold": threshold,
            "matched_skills": [],
            "missing_skills": [],
            "total_required": 0,
            "matched_count": 0
        }

    # Normalize skill sets
    norm_user_map: Dict[str, str] = {normalize_skill(s): s for s in user_skills if s and s.strip()}
    norm_req_map: Dict[str, str] = {normalize_skill(s): s for s in required_skills if s and s.strip()}

    user_norm_set: Set[str] = set(norm_user_map.keys())
    req_norm_set: Set[str] = set(norm_req_map.keys())

    matched_norm = user_norm_set.intersection(req_norm_set)
    missing_norm = req_norm_set - user_norm_set

    total_required = len(req_norm_set)
    matched_count = len(matched_norm)

    if total_required == 0:
        match_percentage = 100.0
    else:
        match_percentage = (matched_count / total_required) * 100.0

    is_eligible = match_percentage >= threshold

    matched_skills_original = [norm_req_map[s] for s in matched_norm]
    missing_skills_original = [norm_req_map[s] for s in missing_norm]

    return {
        "match_percentage": round(match_percentage, 1),
        "is_eligible_match": is_eligible,
        "threshold": threshold,
        "matched_skills": matched_skills_original,
        "missing_skills": missing_skills_original,
        "total_required": total_required,
        "matched_count": matched_count
    }
