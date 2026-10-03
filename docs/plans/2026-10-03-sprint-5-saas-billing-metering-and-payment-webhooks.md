# Sprint 5 Implementation Plan: SaaS Billing, Metering & Payment Webhooks

> **For Claude / Agent:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build production-ready SaaS monetization, dual payment gateway integration (Razorpay & Stripe), cryptographic webhook listeners, multi-tenant usage metering, and live frontend checkout.

**Architecture:**
1. **Plan Catalog & Metering Schema (`app.services.billing.catalog` & `app.models.entities`)**:
   - Defines tiered plans: `student_free`, `student_pro` (₹299 / \$4.99), `starter` (₹4,999 / \$59), `growth` (₹14,999 / \$179), and `enterprise` (₹49,999 / \$599).
   - Extends `Subscription` with `evaluations_used`, `evaluations_limit`, `active_jobs_limit`, `provider`, `provider_subscription_id`, `current_period_start`, and `current_period_end`.
2. **Dual Gateway Service (`app.services.billing.gateway`)**:
   - Unified `PaymentGatewayService` abstracts Razorpay (INR domestic) and Stripe (USD global).
   - Generates checkout orders and sessions, handles webhooks with cryptographic HMAC-SHA256 signature verification, and provides deterministic fallback test mode when keys are unconfigured.
3. **Webhook Processing & Subscription Lifecycle (`app.api.v1.billing`)**:
   - Cryptographically authenticated webhook endpoint `/api/v1/billing/webhooks/{provider}`.
   - Handles `checkout.session.completed`, `payment.captured`, `invoice.payment_succeeded`, and `subscription.cancelled`.
4. **Multi-Tenant Usage Metering Guard (`app.services.billing.metering`)**:
   - Dynamic quota enforcer dependency verifying active job limits and candidate evaluation limits; rejects over-quota actions with HTTP 402 Payment Required and upgrade instructions.
5. **Live Frontend Checkout (`frontend/src/app/pricing/page.tsx`)**:
   - Replaces simulated demo modal with real order creation, checkout initiation, payment verification, and reactive plan activation.
6. **360-Degree Integration Test Suite (`backend/test_sprint5_billing_and_metering.py`)**:
   - Comprehensive test suite ensuring 100% test pass rate across all billing, quota, and webhook flows.

**Tech Stack:** Python 3.11, FastAPI, SQLAlchemy 2.0, HMAC / SHA-256, Next.js 15, TypeScript, Razorpay / Stripe REST protocols.

---

## Sprint 5 Commit Roadmap (6 Granular Atomic Commits)

| # | Commit Message | Scope & Purpose | Target Files |
|---|----------------|-----------------|--------------|
| **1** | `feat(billing): extend subscription schema with usage metering, quotas, and plan catalog` | Extend `Subscription` model with billing periods and usage meters; define plan catalog and auto-migrate SQLite schema in seed.py. | `backend/app/models/entities.py`<br>`backend/app/core/config.py`<br>`backend/app/db/seed.py`<br>`backend/app/services/billing/catalog.py` |
| **2** | `feat(billing): implement dual payment gateway adapter for razorpay and stripe` | Unified `PaymentGatewayService` creating checkout orders/sessions with cryptographic signature verification for Razorpay and Stripe. | `backend/app/services/billing/__init__.py`<br>`backend/app/services/billing/gateway.py` |
| **3** | `feat(billing): add cryptographic webhook listeners and subscription lifecycle event handlers` | Endpoints `/api/v1/billing/webhooks/{provider}` verifying HMAC signatures and provisioning subscription updates in DB. | `backend/app/api/v1/billing.py`<br>`backend/app/main.py` |
| **4** | `feat(billing): implement multi-tenant usage metering and quota enforcement dependencies` | Quota check dependencies guarding active job limits and candidate screening evaluations with HTTP 402 enforcement. | `backend/app/services/billing/metering.py`<br>`backend/app/api/deps.py`<br>`backend/app/api/v1/jobs.py` |
| **5** | `feat(frontend): connect pricing page to live checkout and subscription verification` | Replace demo simulation dialog in pricing page with real API checkout order creation, verification, and reactive store sync. | `frontend/src/app/pricing/page.tsx`<br>`frontend/src/lib/api/client.ts` |
| **6** | `test(sprint5): add 360-degree integration test suite for saas billing, webhooks, and metering` | Comprehensive integration tests validating plan catalog, order checkout, HMAC signatures, quota blocks, and regression health. | `backend/test_sprint5_billing_and_metering.py`<br>`README.md` |

---

## Detailed Task Breakdown

### Task 1: Extend Subscription Schema, Define Plan Catalog & Settings

**Files:**
- Modify: `backend/app/core/config.py`
- Modify: `backend/app/models/entities.py`
- Modify: `backend/app/db/seed.py`
- Create: `backend/app/services/billing/catalog.py`

**Step 1: Extend `Settings` in `backend/app/core/config.py`**
Add gateway keys and webhook secrets:
- `STRIPE_API_KEY`: str = ""
- `STRIPE_WEBHOOK_SECRET`: str = "whsec_aspire_test_secret_2026"
- `RAZORPAY_KEY_ID`: str = "rzp_test_aspire_2026"
- `RAZORPAY_KEY_SECRET`: str = "rzp_test_secret_aspire_2026"
- `RAZORPAY_WEBHOOK_SECRET`: str = "rzp_webhook_secret_2026"

**Step 2: Extend `Subscription` Model in `backend/app/models/entities.py`**
Add:
- `user_id`: Optional string ForeignKey to `users.id` (for student subscriptions)
- `provider`: String default "razorpay" ("razorpay" | "stripe")
- `provider_subscription_id`: Optional string
- `provider_payment_id`: Optional string
- `current_period_start`: Optional DateTime
- `current_period_end`: Optional DateTime
- `evaluations_used`: Integer default 0
- `evaluations_limit`: Integer default 25
- `active_jobs_limit`: Integer default 3

**Step 3: Define Plan Catalog in `backend/app/services/billing/catalog.py`**
Define standard SaaS plan specifications:
- `student_free`: ₹0, 5 resume uploads/mo, 10 challenges
- `student_pro`: ₹299/mo (\$4.99/mo), unlimited resume parsing, AI mock interviews, roadmaps
- `starter`: ₹4,999/mo (\$59/mo), 3 active jobs, 25 candidate evaluations/mo
- `growth`: ₹14,999/mo (\$179/mo), 10 active jobs, 150 candidate evaluations/mo
- `enterprise`: ₹49,999/mo (\$599/mo), unlimited jobs, unlimited evaluations, dedicated SLA

**Step 4: Update `seed.py` to auto-migrate missing SQLite columns**
Add safe `ALTER TABLE subscriptions ADD COLUMN ...` statements in `seed_database_defaults()`.

---

### Task 2: Dual Payment Gateway Adapter (Razorpay & Stripe)

**Files:**
- Create: `backend/app/services/billing/__init__.py`
- Create: `backend/app/services/billing/gateway.py`

**Implementation:**
- `PaymentGatewayService`:
  - `create_checkout_order(plan_id, currency, billing_cycle, org_id, user_id, provider)`
  - `verify_webhook_signature(payload_bytes, signature_header, provider)` using `hmac.new(..., hashlib.sha256)`
  - `verify_client_payment(payment_id, order_id, signature, provider)`
  - Automatic test-mode mock order creation if live API keys are empty, returning deterministic IDs (`order_rzp_mock_*`, `cs_stripe_mock_*`).

---

### Task 3: Cryptographic Webhook Handlers & Billing API

**Files:**
- Create: `backend/app/api/v1/billing.py`
- Modify: `backend/app/main.py`

**Endpoints:**
- `GET /api/v1/billing/plans`: Return all available plans with prices and quota limits.
- `GET /api/v1/billing/subscription`: Return active subscription and usage stats for current user/org.
- `POST /api/v1/billing/checkout`: Initialize checkout order for gateway.
- `POST /api/v1/billing/verify-payment`: Verify payment and activate subscription.
- `POST /api/v1/billing/webhooks/{provider}`: Handle raw webhook events from Stripe & Razorpay.
- Mount `billing_router` in `backend/app/main.py`.

---

### Task 4: Multi-Tenant Usage Metering & Quota Enforcement

**Files:**
- Create: `backend/app/services/billing/metering.py`
- Modify: `backend/app/api/deps.py`
- Modify: `backend/app/api/v1/jobs.py`

**Implementation:**
- `QuotaEnforcer`:
  - `check_job_creation_quota(db, org_id)`: Counts active jobs vs `active_jobs_limit`. Raises HTTP 402 if exceeded.
  - `check_candidate_evaluation_quota(db, org_id)`: Checks `evaluations_used` vs `evaluations_limit`. Raises HTTP 402 if exceeded.
  - `record_candidate_evaluation(db, org_id)`: Increments `evaluations_used`.
- Inject `check_job_creation_quota` into `POST /api/v1/jobs/incoming`.

---

### Task 5: Frontend Checkout Flow & Reactive Subscription Activation

**Files:**
- Modify: `frontend/src/app/pricing/page.tsx`
- Modify: `frontend/src/lib/api/client.ts`

**Implementation:**
- Add `createCheckoutOrder`, `verifyPayment`, and `getActiveSubscription` to `client.ts`.
- Replace `💡 Demo Simulation Mode` with real interactive checkout modal.
- Allow user to toggle Currency (INR ₹ / USD \$) and Gateway (Razorpay / Stripe).
- Call `/api/v1/billing/checkout` and `/api/v1/billing/verify-payment`.
- Update active subscription in `useStore()` and show confirmation toast with immediate access.

---

### Task 6: 360-Degree Integration Test Suite & Verification

**Files:**
- Create: `backend/test_sprint5_billing_and_metering.py`
- Modify: `README.md`

**Test Coverage:**
- `test_get_billing_plans_catalog`: Verify plans schema, currencies, and limits.
- `test_create_checkout_order_razorpay_and_stripe`: Test order generation for both gateways.
- `test_webhook_cryptographic_signature_verification`: Test valid vs forged HMAC signatures.
- `test_webhook_subscription_lifecycle_events`: Test `checkout.session.completed` and `subscription.cancelled`.
- `test_client_payment_verification_and_db_provisioning`: Test payment verification activating subscription in DB.
- `test_usage_quota_enforcement_blocks_excess_jobs`: Test HTTP 402 when organization exceeds plan job limit.
- `test_candidate_evaluation_metering`: Test evaluation counters incrementing.
- Run complete test suite across all 17 test modules to guarantee 100% pass rate.
