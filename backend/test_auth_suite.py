import sys
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_auth_test_suite():
    tests_run = 0
    tests_passed = 0
    report = []

    def record_test(name, passed, detail):
        nonlocal tests_run, tests_passed
        tests_run += 1
        if passed:
            tests_passed += 1
        status_label = "PASS" if passed else "FAIL"
        report.append(f"[{status_label}] {name}: {detail}")
        print(f"[{status_label}] {name}: {detail}")

    print("\n================ AUTHENTICATION & LOGIN TEST SUITE ================")

    # Test 1: Valid Employer Login
    res = client.post("/api/v1/auth/login", json={
        "email": "priya.sharma@acme.com",
        "password": "AspireAI@2026",
        "role": "employer",
        "org_id": "org-acme"
    })
    data = res.json()
    employer_token = data.get("access_token")
    passed = (res.status_code == 200 and employer_token is not None and data.get("user", {}).get("role") == "employer")
    record_test("Employer Login (Valid)", passed, f"Status: {res.status_code} | User: {data.get('user', {}).get('full_name')} | Org: {data.get('organization', {}).get('name')}")

    # Test 2: Protected /me validation with Employer JWT
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {employer_token}"})
    data = res.json()
    passed = (res.status_code == 200 and data.get("email") == "priya.sharma@acme.com" and data.get("org_name") == "Acme HyperScale Systems")
    record_test("Protected Profile /me (Valid Bearer JWT)", passed, f"Status: {res.status_code} | Profile email: {data.get('email')} | Org: {data.get('org_name')}")

    # Test 3: Valid Student Login
    res = client.post("/api/v1/auth/login", json={
        "email": "aditya.verma@example.com",
        "password": "AspireAI@2026",
        "role": "student"
    })
    data = res.json()
    student_token = data.get("access_token")
    score = data.get("user", {}).get("readiness_score")
    passed = (res.status_code == 200 and student_token is not None and score in [78, 92])
    record_test("Student Login (Valid)", passed, f"Status: {res.status_code} | User: {data.get('user', {}).get('full_name')} | Score: {score}%")

    # Test 4: Valid Admin Login
    res = client.post("/api/v1/auth/login", json={
        "email": "root@aspire.ai",
        "password": "AspireAI@2026",
        "role": "admin"
    })
    data = res.json()
    admin_token = data.get("access_token")
    passed = (res.status_code == 200 and admin_token is not None and data.get("user", {}).get("role") == "admin")
    record_test("Admin Superuser Login (Valid)", passed, f"Status: {res.status_code} | Role: {data.get('user', {}).get('role')}")

    # Test 5: Invalid Password Check (Rejected with 401)
    res = client.post("/api/v1/auth/login", json={
        "email": "priya.sharma@acme.com",
        "password": "WrongPassword999!",
        "role": "employer",
        "org_id": "org-acme"
    })
    data = res.json()
    passed = (res.status_code == 401 and "Invalid email or password" in data.get("detail", ""))
    record_test("Login with Invalid Password (Rejected)", passed, f"Status: {res.status_code} | Detail: {data.get('detail')}")

    # Test 6: Non-existent User Login (Rejected with 401, no silent auto-creation)
    res = client.post("/api/v1/auth/login", json={
        "email": "unregistered.intruder@unknown.com",
        "password": "SomePassword123!",
        "role": "student"
    })
    data = res.json()
    passed = (res.status_code == 401 and "Invalid email or password" in data.get("detail", ""))
    record_test("Unregistered User Login Rejection (No Silent Auto-Creation)", passed, f"Status: {res.status_code} | Detail: {data.get('detail')}")

    # Test 7: Role Mismatch Check (User registered as employer tries to log in as student)
    res = client.post("/api/v1/auth/login", json={
        "email": "priya.sharma@acme.com",
        "password": "AspireAI@2026",
        "role": "student"
    })
    data = res.json()
    passed = (res.status_code == 403 and "Account exists under role" in data.get("detail", ""))
    record_test("Role Mismatch Enforcement (Rejected)", passed, f"Status: {res.status_code} | Detail: {data.get('detail')}")

    # Test 8: Invalid Organization ID Scoping
    res = client.post("/api/v1/auth/login", json={
        "email": "priya.sharma@acme.com",
        "password": "AspireAI@2026",
        "role": "employer",
        "org_id": "org-non-existent-99"
    })
    data = res.json()
    passed = (res.status_code == 404 and "not found" in data.get("detail", ""))
    record_test("Non-Existent Tenant Scoping (Rejected)", passed, f"Status: {res.status_code} | Detail: {data.get('detail')}")

    # Test 9: Unauthenticated Access to Protected Route
    res = client.get("/api/v1/auth/me")
    passed = (res.status_code in [401, 403])
    record_test("Unauthorized Access /me without Token (Blocked)", passed, f"Status: {res.status_code}")

    # Test 10: Tampered / Corrupt Bearer Token
    res = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid.token.signature"})
    passed = (res.status_code == 401)
    record_test("Corrupted Bearer Token Access (Blocked)", passed, f"Status: {res.status_code}")

    # Test 11: Valid Registration via /auth/register
    import uuid
    reg_email = f"new.candidate.{uuid.uuid4().hex[:6]}@talenttest.org"
    res = client.post("/api/v1/auth/register", json={
        "email": reg_email,
        "password": "StrongPassword123!",
        "full_name": "New Candidate",
        "role": "student",
        "college": "Apex Institute"
    })
    data = res.json()
    passed = (res.status_code == 200 and data.get("access_token") is not None and data.get("user", {}).get("email") == reg_email)
    record_test("Valid User Registration via /auth/register", passed, f"Status: {res.status_code} | Created: {data.get('user', {}).get('full_name')} ({data.get('user', {}).get('id')})")

    # Test 12: Duplicate Registration Rejection
    res = client.post("/api/v1/auth/register", json={
        "email": reg_email,
        "password": "StrongPassword123!",
        "full_name": "Duplicate Candidate",
        "role": "student"
    })
    passed = (res.status_code == 400 and "already exists" in res.json().get("detail", ""))
    record_test("Duplicate Registration Rejection (Blocked)", passed, f"Status: {res.status_code}")

    # Test 13: Forgot Password Cryptographic Dispatch
    res = client.post("/api/v1/auth/forgot-password", json={
        "email": "aditya.verma@example.com"
    })
    data = res.json()
    passed = (res.status_code == 200 and data.get("success") is True)
    record_test("Cryptographic Password Reset Dispatch", passed, f"Status: {res.status_code} | Message: {data.get('message')}")

    # Test 14: List Tenant Organizations
    res = client.get("/api/v1/auth/organizations")
    data = res.json()
    passed = (res.status_code == 200 and isinstance(data, list) and len(data) >= 3)
    record_test("Tenant Organization Directory Listing", passed, f"Status: {res.status_code} | Found {len(data)} tenant organizations")

    print("\n======================= TEST SUMMARY =======================")
    print(f"Total Tests Executed: {tests_run}")
    print(f"Passed: {tests_passed}")
    print(f"Failed: {tests_run - tests_passed}")
    success = (tests_passed == tests_run)
    print(f"OVERALL RESULT: {'ALL PASS' if success else 'FAILURES DETECTED'}")
    print("============================================================\n")
    return success

def test_auth_full_suite():
    assert run_auth_test_suite() is True

if __name__ == "__main__":
    success = run_auth_test_suite()
    sys.exit(0 if success else 1)
