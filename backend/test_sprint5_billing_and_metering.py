import json
import hmac
import hashlib
import time
import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings
from app.db.session import get_db_session
from app.models.entities import Subscription, Organization, Job, User
from app.services.billing.metering import QuotaEnforcementService
from app.core.security import get_password_hash, create_access_token
from fastapi import HTTPException

client = TestClient(app)


@pytest.fixture(autouse=True)
def ensure_acme_enterprise_intact():
    """Guarantees org-acme maintains its active enterprise subscription across test runs."""
    with get_db_session() as db:
        acme_sub = db.query(Subscription).filter(Subscription.org_id == "org-acme").first()
        if acme_sub:
            acme_sub.status = "active"
            acme_sub.plan_id = "enterprise"
            acme_sub.active_jobs_limit = -1
            acme_sub.evaluations_limit = -1
            db.commit()
    yield
    with get_db_session() as db:
        acme_sub = db.query(Subscription).filter(Subscription.org_id == "org-acme").first()
        if acme_sub:
            acme_sub.status = "active"
            acme_sub.plan_id = "enterprise"
            acme_sub.active_jobs_limit = -1
            acme_sub.evaluations_limit = -1
            db.commit()


def get_auth_headers(email="priya.sharma@acme.com", role="employer", org_id="org-acme"):
    """Helper to authenticate and generate Bearer JWT headers."""
    res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "AspireAI@2026",
        "role": role,
        "org_id": org_id
    })
    token = res.json().get("access_token")
    return {"Authorization": f"Bearer {token}"}


def create_isolated_employer(prefix="test"):
    """Spins up an isolated organization, user, and subscription for mutating tests."""
    org_id = f"org-{prefix}-{uuid.uuid4().hex[:6]}"
    email = f"{prefix}_{uuid.uuid4().hex[:6]}@example.com"
    with get_db_session() as db:
        org = Organization(
            id=org_id,
            name=f"Org {prefix}",
            type="corporate",
            logo="🏢",
            plan="Starter",
            seats_used=1,
            seats_total=10,
            status="active"
        )
        db.add(org)

        user = User(
            id=f"usr-{org_id}",
            email=email,
            full_name=f"Admin {prefix}",
            role="employer",
            org_id=org_id,
            user_class="Recruiter",
            password_hash=get_password_hash("AspireAI@2026")
        )
        db.add(user)

        sub = Subscription(
            id=f"sub-{org_id}",
            org_id=org_id,
            plan_id="starter",
            status="active",
            seats_purchased=2,
            billing_cycle="monthly",
            active_jobs_limit=3,
            evaluations_limit=25,
            evaluations_used=0
        )
        db.add(sub)
        db.commit()

    token = create_access_token(subject=f"usr-{org_id}", role="employer", org_id=org_id, email=email)
    return {"Authorization": f"Bearer {token}"}, org_id


def test_plan_catalog_listing_and_filtering():
    """Verify that plan catalog returns all 5 plans and supports audience filtering."""
    # List all plans
    res_all = client.get("/api/v1/billing/plans")
    assert res_all.status_code == 200
    plans = res_all.json()["plans"]
    plan_ids = [p["id"] for p in plans]
    assert "student_free" in plan_ids
    assert "student_pro" in plan_ids
    assert "starter" in plan_ids
    assert "growth" in plan_ids
    assert "enterprise" in plan_ids

    # Filter student audience
    res_students = client.get("/api/v1/billing/plans?audience=student")
    assert res_students.status_code == 200
    student_plans = res_students.json()["plans"]
    assert all(p["audience"] == "student" for p in student_plans)
    assert len(student_plans) == 2

    # Filter employer audience
    res_employers = client.get("/api/v1/billing/plans?audience=employer")
    assert res_employers.status_code == 200
    employer_plans = res_employers.json()["plans"]
    assert all(p["audience"] == "employer" for p in employer_plans)
    assert len(employer_plans) == 3


def test_subscription_telemetry_query():
    """Verify that /billing/subscription returns the active subscription and limits."""
    headers = get_auth_headers()
    res = client.get("/api/v1/billing/subscription", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["has_subscription"] is True
    assert "subscription_id" in data
    assert "plan_id" in data
    assert data["status"] == "active"
    assert "meters" in data
    meters = data["meters"]
    assert "active_jobs_limit" in meters
    assert "evaluations_limit" in meters
    assert "evaluations_used" in meters


def test_checkout_order_creation_razorpay_and_stripe():
    """Verify order and session creation across dual payment gateways."""
    headers = get_auth_headers()

    # Razorpay Checkout
    rzp_payload = {
        "plan_id": "student_pro",
        "billing_cycle": "monthly",
        "provider": "razorpay",
        "currency": "INR",
        "seats": 1
    }
    res_rzp = client.post("/api/v1/billing/checkout", json=rzp_payload, headers=headers)
    assert res_rzp.status_code == 200
    res_data = res_rzp.json()
    assert res_data["success"] is True
    rzp_order = res_data["order"]
    assert rzp_order["provider"] == "razorpay"
    assert rzp_order["order_id"].startswith("order_")
    assert rzp_order["currency"] == "INR"
    assert rzp_order["amount"] == 29900

    # Stripe Checkout
    stripe_payload = {
        "plan_id": "growth",
        "billing_cycle": "annual",
        "provider": "stripe",
        "currency": "USD",
        "seats": 10
    }
    res_stripe = client.post("/api/v1/billing/checkout", json=stripe_payload, headers=headers)
    assert res_stripe.status_code == 200
    stripe_res = res_stripe.json()
    assert stripe_res["success"] is True
    stripe_order = stripe_res["order"]
    assert stripe_order["provider"] == "stripe"
    assert stripe_order["session_id"].startswith("cs_")
    assert "checkout.stripe.com" in stripe_order["checkout_url"]
    assert stripe_order["currency"] == "USD"
    assert stripe_order["amount"] == 171800

    # Non-existent plan error
    res_bad = client.post("/api/v1/billing/checkout", json={
        "plan_id": "non_existent_tier",
        "billing_cycle": "monthly",
        "provider": "razorpay"
    }, headers=headers)
    assert res_bad.status_code == 404


def test_payment_verification_and_db_activation():
    """Verify client payment confirmation and database subscription activation."""
    headers, org_id = create_isolated_employer(prefix="pay-verify")
    order_id = f"order_{uuid.uuid4().hex[:10]}"
    payment_id = f"pay_{uuid.uuid4().hex[:10]}"

    # Compute valid Razorpay HMAC signature: HMAC(secret, order_id|payment_id)
    key_secret = settings.RAZORPAY_KEY_SECRET or "rzp_secret_dummy"
    signature = hmac.new(
        key_secret.encode("utf-8"),
        f"{order_id}|{payment_id}".encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    verify_payload = {
        "provider": "razorpay",
        "plan_id": "growth",
        "billing_cycle": "monthly",
        "order_id": order_id,
        "payment_id": payment_id,
        "signature": signature
    }
    res = client.post("/api/v1/billing/verify-payment", json=verify_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "active"
    sub = data["subscription"]
    assert sub["plan_id"] == "growth"
    assert sub["status"] == "active"
    assert sub["active_jobs_limit"] == 10
    assert sub["evaluations_limit"] == 150


def test_cryptographic_webhook_verification_razorpay():
    """Test HMAC-SHA256 signature verification for Razorpay webhooks."""
    _, wh_org_id = create_isolated_employer(prefix="rzp-wh")

    payload = {
        "event": "order.paid",
        "payload": {
            "order": {
                "entity": {
                    "id": f"order_{uuid.uuid4().hex[:10]}",
                    "amount": 1499900,
                    "currency": "INR"
                }
            },
            "payment": {
                "entity": {
                    "id": f"pay_{uuid.uuid4().hex[:10]}",
                    "notes": {
                        "org_id": wh_org_id,
                        "plan_id": "growth",
                        "billing_cycle": "monthly",
                        "seats": 10
                    }
                }
            }
        }
    }
    body_raw = json.dumps(payload).encode("utf-8")

    # 1. Valid Signature
    secret = (settings.RAZORPAY_WEBHOOK_SECRET or "webhook_secret_dev").encode("utf-8")
    valid_sig = hmac.new(secret, body_raw, hashlib.sha256).hexdigest()

    res_valid = client.post(
        "/api/v1/billing/webhooks/razorpay",
        content=body_raw,
        headers={
            "Content-Type": "application/json",
            "X-Razorpay-Signature": valid_sig
        }
    )
    assert res_valid.status_code == 200
    assert res_valid.json()["received"] is True
    assert res_valid.json()["event"] == "order.paid"

    # 2. Forged / Tampered Signature
    res_invalid = client.post(
        "/api/v1/billing/webhooks/razorpay",
        content=body_raw,
        headers={
            "Content-Type": "application/json",
            "X-Razorpay-Signature": "tampered_forged_hmac_hex"
        }
    )
    assert res_invalid.status_code == 400
    assert "Signature Verification Failed" in res_invalid.json()["detail"]


def test_cryptographic_webhook_verification_stripe():
    """Test HMAC-SHA256 signature verification for Stripe webhooks and lifecycle handling."""
    _, wh_stripe_org_id = create_isolated_employer(prefix="stripe-wh")

    payload = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": f"cs_test_{uuid.uuid4().hex[:10]}",
                "payment_intent": f"pi_test_{uuid.uuid4().hex[:10]}",
                "metadata": {
                    "org_id": wh_stripe_org_id,
                    "plan_id": "enterprise",
                    "billing_cycle": "annual",
                    "seats": "25"
                }
            }
        }
    }
    body_raw = json.dumps(payload).encode("utf-8")

    # 1. Valid Signature with timestamp
    ts = str(int(time.time()))
    signed_payload = f"{ts}.".encode("utf-8") + body_raw
    secret = (settings.STRIPE_WEBHOOK_SECRET or "whsec_dev").encode("utf-8")
    v1_sig = hmac.new(secret, signed_payload, hashlib.sha256).hexdigest()
    header_val = f"t={ts},v1={v1_sig}"

    res_valid = client.post(
        "/api/v1/billing/webhooks/stripe",
        content=body_raw,
        headers={
            "Content-Type": "application/json",
            "Stripe-Signature": header_val
        }
    )
    assert res_valid.status_code == 200
    assert res_valid.json()["received"] is True
    assert res_valid.json()["event"] == "checkout.session.completed"

    # 2. Cancellation Event handling
    cancel_payload = {
        "type": "customer.subscription.deleted",
        "data": {
            "object": {
                "id": f"sub_stripe_{uuid.uuid4().hex[:8]}",
                "metadata": {
                    "org_id": "org-acme"
                }
            }
        }
    }
    cancel_body = json.dumps(cancel_payload).encode("utf-8")
    signed_cancel = f"{ts}.".encode("utf-8") + cancel_body
    cancel_sig = hmac.new(secret, signed_cancel, hashlib.sha256).hexdigest()

    res_cancel = client.post(
        "/api/v1/billing/webhooks/stripe",
        content=cancel_body,
        headers={
            "Content-Type": "application/json",
            "Stripe-Signature": f"t={ts},v1={cancel_sig}"
        }
    )
    assert res_cancel.status_code == 200
    assert res_cancel.json()["received"] is True

    # 3. Forged Stripe Signature
    res_bad = client.post(
        "/api/v1/billing/webhooks/stripe",
        content=body_raw,
        headers={
            "Content-Type": "application/json",
            "Stripe-Signature": f"t={ts},v1=forged_stripe_sig_hex"
        }
    )
    assert res_bad.status_code == 400


def test_quota_enforcement_active_jobs_limit_402():
    """Verify that when an organization reaches active_jobs_limit, HTTP 402 is returned."""
    org_id = f"org-test-quota-{uuid.uuid4().hex[:6]}"

    with get_db_session() as db:
        test_org = Organization(
            id=org_id,
            name="Quota Test Corp",
            type="corporate",
            logo="🏢",
            plan="Starter",
            seats_used=1,
            seats_total=2,
            status="active"
        )
        db.add(test_org)

        test_sub = Subscription(
            id=f"sub-{org_id}",
            org_id=org_id,
            plan_id="starter",
            status="active",
            seats_purchased=2,
            billing_cycle="monthly",
            active_jobs_limit=2,
            evaluations_limit=25,
            evaluations_used=0
        )
        db.add(test_sub)
        db.commit()

    # Ingest Job 1 -> should succeed (1/2)
    res1 = client.post("/api/v1/jobs/incoming", json={
        "id": f"job-quota-1-{uuid.uuid4().hex[:6]}",
        "org_id": org_id,
        "title": "Software Engineer I",
        "company": "Quota Test Corp",
        "required_skills": ["Python"]
    })
    assert res1.status_code == 202

    # Ingest Job 2 -> should succeed (2/2)
    res2 = client.post("/api/v1/jobs/incoming", json={
        "id": f"job-quota-2-{uuid.uuid4().hex[:6]}",
        "org_id": org_id,
        "title": "Software Engineer II",
        "company": "Quota Test Corp",
        "required_skills": ["FastAPI"]
    })
    assert res2.status_code == 202

    # Ingest Job 3 -> should fail with HTTP 402 Payment Required! (3 > 2)
    res3 = client.post("/api/v1/jobs/incoming", json={
        "id": f"job-quota-3-{uuid.uuid4().hex[:6]}",
        "org_id": org_id,
        "title": "Lead Software Engineer",
        "company": "Quota Test Corp",
        "required_skills": ["Architecture"]
    })
    assert res3.status_code == 402
    assert "Active Job Requisitions Quota Reached" in res3.json()["detail"]


def test_quota_enforcement_candidate_evaluations_metering():
    """Verify that candidate evaluation quota records usage and blocks on limit."""
    org_id = f"org-eval-quota-{uuid.uuid4().hex[:6]}"

    with get_db_session() as db:
        # Create organization first to satisfy FK constraint
        test_org = Organization(
            id=org_id,
            name="Eval Quota Org",
            type="corporate",
            logo="📊",
            plan="Starter",
            seats_used=1,
            seats_total=2,
            status="active"
        )
        db.add(test_org)

        test_sub = Subscription(
            id=f"sub-{org_id}",
            org_id=org_id,
            plan_id="starter",
            status="active",
            seats_purchased=2,
            billing_cycle="monthly",
            active_jobs_limit=3,
            evaluations_limit=5,
            evaluations_used=4
        )
        db.add(test_sub)
        db.commit()

        # Recording 1 evaluation -> 4 + 1 = 5 (allowed)
        QuotaEnforcementService.check_and_record_candidate_evaluation(db, org_id, count=1)
        db.refresh(test_sub)
        assert test_sub.evaluations_used == 5

        # Recording another evaluation -> 5 + 1 = 6 > 5 (raises HTTP 402)
        with pytest.raises(HTTPException) as excinfo:
            QuotaEnforcementService.check_and_record_candidate_evaluation(db, org_id, count=1)
        assert excinfo.value.status_code == 402
        assert "Monthly Candidate Evaluation Quota Exceeded" in excinfo.value.detail


def test_subscription_cancellation_endpoint():
    """Verify that POST /billing/cancel marks the active subscription as cancelled on an isolated org."""
    headers, org_id = create_isolated_employer(prefix="cancel")
    res = client.post("/api/v1/billing/cancel", headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "cancelled"
