# Aspire AI — Software Requirements Specification (v2)
### Role-Separated Requirements: Employer, Student & Admin | FastAPI + React Full Stack
**Multi-tenant / Organization model, credential trust chain, sponsored content**

---

## 👥 Contributors & Feature Attribution
* **Jayasree A B** (`@jayasreeab2004`, `jayasreeab2004@gmail.com`) — **Feature Architect (CareerCompass Modules & Course Curriculum)**: Engineered the 8 core feature modules in `backend/features/` covering personalized 90-day roadmaps (`career_roadmap.py`), dynamic personalized learning roadmaps (`personalized_roadmap.py`), GitHub project complexity extraction (`github_analysis.py`), AI interview coach and scoring (`interview_coach.py`), job market demand analysis (`job_market_analysis.py`), portfolio generator (`portfolio_builder.py`), deep resume diagnostics (`resume_analysis.py`), and multi-area skill gap evaluation (`skill_gap_analysis.py`), as well as the 13 modular CareerCompass course curricula, structured lessons, and 20-question timed mock exams (`courses/`, `/api/v1/courses`).
* **Annam Paul** (`@annampaul27`, `annampaul000@gmail.com`) — **Core Feature Architect (ATS Engine)**: Engineered the FastAPI ATS microservices (`/api/v1/ats/*`), Groq LLM parsing (`ResumeSchema`, `JDSchema`), ChromaDB persistent applicant vector store, and deterministic deficit-resistance scoring logic (**E1, E2, E3, E4, E10**).
* **Core Engineering Team** (`@rdnk2004`) — **Platform Architects**: Multi-tenant infrastructure, Next.js 15 client, SHA-256 cryptographic trust chain, and real-time gap closing sprints.

---

## SECTION 1: EMPLOYER / ORGANIZATION REQUIREMENTS (THE BUYER WORKFLOW)

| Sl.No | Requirement Specification | Functional/ Non-Functional | Essential/ Desirable | Comments / Impact |
|---|---|---|---|---|
| E1 | The system shall allow Employers to input active job openings either by selecting pre-configured tech templates or by pasting a raw Job Description (JD). | Functional | Essential | Core demand-side ingestion mechanism. Integrated with FastAPI ATS (`/api/v1/ats/parse-jd` by Annam Paul). |
| E2 | The system shall automatically parse the JD into structured skill nodes and categorize each into Critical (Must-Have, weight=3.0) and Optional (Nice-to-Have, weight=1.0). | Functional | Essential | Establishes deterministic hiring benchmarks via Groq/Instructor LLM parsing. |
| E3 | The system shall serve an Employer Talent Radar ranking applicant candidates by overall job-readiness percentage (0–100%) using the Weighted Deficit Resistance Model. | Functional | Essential | Solves resume spam by ranking real readiness with deterministic set gap analysis. |
| E4 | The system shall automatically segment candidate applicants into three distinct tiers: Job-Ready (≥85%), Bridgeable (60–84%), and Mismatch (<60%). | Functional | Essential | Surfaces high-potential candidates immediately via ATS scoring logic. |
| E5 | The system shall provide a dedicated 'Bridgeable Candidates' diagnostic filter to isolate applicants who are missing only 1 to 2 discrete competencies. | Functional | Essential | Key recruiter wedge: fills urgent open reqs fast. |
| E6 | The system shall provide a 1-Click Gap Sprint Dispatch button next to Bridgeable candidates to trigger an automated targeted challenge invitation. | Functional | Essential | Closes the hiring loop between employer and learner. |
| E7 | The system shall provide a Proof-of-Work Credential Audit Modal allowing recruiters to inspect a candidate's cryptographic SHA-256 hash, score, and submitted answers. | Functional | Essential | Eliminates resume exaggeration and fraud. |
| E8 | The system shall allow Employers to shortlist verified candidates directly from the audit modal, advancing them to 'Shortlisted for Interview'. | Functional | Essential | Direct conversion action in recruiter pipeline. |
| E9 | The system shall automatically update a candidate's ranking and badge tags on the employer dashboard as soon as they pass an assigned gap sprint. | Functional | Essential | Real-time pipeline liquidity updates. |
| E10 | The system shall provide a candidate profile drawer displaying parsed work experience, past projects, and verified GitHub repository links. | Functional | Essential | Full context without leaving dashboard. Ingested via ATS parser (`/api/v1/ats/parse-resume`). |
| E11 | The system shall support a multi-tenant Organization model, where every employer, university, or staffing agency signs up as an Organization with its own isolated candidate/job data. | Functional | Essential | Foundation for the B2B subscription model; unlocks per-org billing. |
| E12 | The system shall provide a Platform Superuser (you) role that can create, suspend, or audit any Organization account. | Functional | Essential | Required for you to operate this as a sellable platform, not a single-tenant tool. |
| E13 | The system shall provide an Org Admin role per Organization, able to invite/remove members, assign seat-level permissions, and set org-wide screening rules (e.g. default pass threshold, required skill weights). | Functional | Essential | This is the "give it to an org, they manage themselves" feature. |
| E14 | The system shall scope all candidate, job, and credential data strictly to the requesting Organization's ID at the database query level. | Functional / Non-Functional | Essential | Data isolation — a compliance non-negotiable for any org buyer, especially universities. |
| E15 | The system shall allow Org Admins to add multiple Org Members (recruiters/hiring managers) under one subscription, each scoped to the org's own pipeline. | Functional | Essential | Seat-based pricing lever; corporate HR never decides with one login. |
| E16 | The system shall provide a lightweight candidate pipeline status (Applied → Screened → Shortlisted → Interview → Offer) editable by any Org Member, with visible history of status changes. | Functional | Essential | Makes the tool a workflow, not just a ranked list. |
| E17 | The system shall provide an anonymized screening mode that hides candidate name, photo, and college during initial ranking, revealed only after shortlisting. | Functional | Essential | Cheap to build, strong bias-reduction differentiator vs. any competitor ATS. |
| E18 | The system shall provide a shareable, read-only candidate shortlist link that can be sent to people outside the platform (e.g. a staffing agency's client). | Functional | Desirable | Staffing-agency buying motion: invoice-worthy deliverable they hand off. |
| E19 | The system shall provide an Org-level usage dashboard showing candidates screened, hours saved (est.), Bridgeable candidates closed, and gap-sprints completed. | Functional | Essential | Subscription renewal justification — buyers renew off a number, not a vibe. |
| E20 | The system shall allow Org Members to mark a hired candidate's post-hire outcome (e.g. performance rating after 90 days) to close the feedback loop on match quality. | Functional | Desirable | Signals the model improves from real outcomes, not just resume text. |
| E21 | For University-type Organizations, the system shall aggregate individual student skill-gap data into a cohort-wide dashboard (e.g. "% of final-years red on SQL"). | Functional | Essential | Turns the product into curriculum feedback — universities' actual buying reason. |
| E22 | For University-type Organizations, the system shall export cohort placement-readiness data in a NAAC/NIRF-compliant format. | Functional | Desirable | Universities pay for accreditation paperwork alone. |
| E23 | The system shall support bulk JD posting and bulk resume ingestion (50+ files) for staffing-agency and corporate-recruiter Organizations. | Functional | Essential | Volume is the staffing-agency buying trigger. |
| E24 | The system shall log Corporate L&D-type Organization requirements as a distinct, unbuilt persona for V2, reusing the existing skill-gap engine against internal role requirements instead of external JDs. | Non-Functional | Desirable | Explicitly scoped out of V1 to protect build time. |

---

## SECTION 2: STUDENT / LEARNER REQUIREMENTS (THE TALENT SUPPLY WORKFLOW)

| Sl.No | Requirement Specification | Functional/ Non-Functional | Essential/ Desirable | Comments / Impact |
|---|---|---|---|---|
| S1 | The system shall provide Students a drag-and-drop resume upload zone accepting PDF resumes with automated spatial layout text parsing. | Functional | Essential | Zero-friction onboarding for learners. |
| S2 | The system shall automatically extract candidate skills, tools, frameworks, and previous project bullets into a structured candidate profile. | Functional | Essential | Foundational entity extraction via Gemini AI. |
| S3 | The system shall allow Students to select a target employer job opening to evaluate their profile against live industry requirements. | Functional | Essential | Benchmarks learner against real demand. |
| S4 | The system shall compute and visually display a Skill Gap Delta Radar (Green = Proficient, Red = Missing Delta) against the selected target role. | Functional | Essential | Visualizes what skills actually convert to hiring. |
| S5 | The system shall allow Students to click any missing/red skill to dynamically generate a targeted 10-minute micro-learning sprint. | Functional | Essential | Replaces bloated 40-hour video courses. |
| S6 | The system shall structure micro-modules into three distinct parts: a 2-minute actionable concept summary, an industrial debugging scenario, and an adaptive quiz. | Functional | Essential | Practical, production-grade knowledge transfer. |
| S7 | The system shall execute timed candidate assessments enforcing a 90-second countdown timer per question to prevent trivial ChatGPT copying. | Functional | Essential | Maintains credential integrity and rigor. |
| S8 | The system shall incorporate anti-cheat tab-blur detection, warning the user if the browser window loses focus during an active test session. | Functional | Essential | Lightweight browser-level anti-cheat safeguard. |
| S9 | The system shall automatically grade assessment submissions and provide instant score breakdowns with explanations for all options. | Functional | Essential | Instant feedback loop for candidate mastery. |
| S10 | The system shall mint a cryptographically signed SHA-256 micro-credential upon scoring ≥80% on the assessment challenge. | Functional | Essential | Generates immutable proof-of-competency. |
| S11 | The system shall generate a live, publicly accessible verification URL (/verify/[hash]) allowing third parties to audit the credential without logging in. | Functional | Essential | Universal trust layer for LinkedIn and resumes. |
| S12 | The system shall automatically boost the student's match score against the employer's job upon earning a credential, elevating them on the recruiter's radar. | Functional | Essential | Direct economic incentive for the student. |
| S13 | The system shall provide a structured Student Profile form covering education, work experience, projects, certifications, portfolio/GitHub links, and target roles, required before any assessment can be attempted. | Functional | Essential | Single source of truth the matching engine scores against. |
| S14 | Resume upload (S1) shall auto-fill every field of the S13 form via the existing parser, with all fields fully editable by the student before saving. | Functional | Essential | Parser speed without parser-error risk. |
| S15 | Every skill on a student's profile shall remain tagged "Unverified" (self-declared) until the student passes its corresponding assessment (S7–S10); only assessment-verified skills count toward the Job-Ready/Bridgeable/Mismatch score. | Functional | Essential | Prevents score inflation from resume-padding — core trust differentiator. |
| S16 | The system shall restrict the "Apply" action on a job to students in the Job-Ready tier (≥85% fit, per E4) for that specific job; Bridgeable-tier students (60–84%) can view the job but are routed into gap-closure instead of applying directly. | Functional | Essential | Soft-gate instead of hard 100%-only gate — keeps students engaged rather than bouncing them. |
| S17 | When a student falls short of the apply threshold, the system shall generate its own Application Readiness Report explaining exactly which skills/criteria caused the shortfall — authored by the platform's scoring engine, never by the employer. | Functional | Essential | Removes employer liability/awkwardness around rejection feedback. |
| S18 | The Readiness Report shall rank missing skills by weight/impact and convert directly into a sequenced, multi-skill Roadmap (not a single isolated micro-sprint), with an estimated total time to reach Job-Ready for that job. | Functional | Essential | Reuses S5/S6's micro-sprint engine, just sequenced. |
| S19 | The system shall let students track roadmap progress (skills closed vs. remaining) and re-check their fit score against a saved job at any time without re-uploading their resume. | Functional | Essential | Turns a one-time score into a returning-user loop — retention driver. |
| S20 | The system shall notify a student when a newly-earned credential pushes them from Bridgeable into Job-Ready for a job they previously couldn't apply to. | Functional | Desirable | Direct "aha" moment tying learning effort to a concrete new opportunity. |
| S21 | Students shall control what's visible to an employer pre-application (e.g. hide failed/in-progress assessment attempts), while verified credentials are always shown and cannot be hidden. | Functional | Desirable | Student privacy without compromising credential-integrity guarantee. |
| S22 | The system shall allow an Org (employer, university, or L&D team) to author and submit a Sponsored Micro-Sprint for a specific skill node, using the same 3-part structure (concept summary, scenario, adaptive quiz) as S6. | Functional | Desirable | Opens a content-supply revenue channel — orgs sponsor learning instead of building their own. |
| S23 | Sponsored content shall display a visible "Sponsored by [Org]" tag and remain accessible to students from any organization, not exclusive to the sponsoring employer's applicant pool. | Functional | Essential (if S22 built) | Prevents conflict-of-interest between sponsoring and screening. |
| S24 | Sponsored Micro-Sprints shall route through the same auto-grading and SHA-256 credentialing pipeline (S9–S10) as platform-authored content — no separate trust tier. | Functional / Non-Functional | Essential (if S22 built) | Keeps the credential's trust guarantee uniform across all content sources. |
| S25 | Org Admins shall see aggregate completion analytics for their own sponsored content (e.g. "240 students completed our React sprint this month"). | Functional | Desirable | Gives sponsoring orgs their own ROI number. |

---

## SECTION 3: ADMIN & INSTITUTIONAL OVERSIGHT (PLATFORM & TPO WORKFLOW)

| Sl.No | Requirement Specification | Functional/ Non-Functional | Essential/ Desirable | Comments / Impact |
|---|---|---|---|---|
| A1 | The system shall provide an Admin Dashboard displaying platform-wide health telemetry: total active learners, open JDs, credentials minted, and gap closure rate. | Functional | Essential | High-level macro health monitoring. |
| A2 | The system shall provide a Global Skill Taxonomy Manager to normalize synonyms into canonical skill nodes (e.g., mapping 'ReactJS' and 'React' to one ID). | Functional | Essential | Prevents duplicate or erroneous skill deltas. |
| A3 | The system shall maintain a global, immutable Credential Ledger allowing admins to audit cryptographic hash uniqueness and verification logs. | Functional | Essential | Guarantees public trust and credential validity. |
| A4 | The system shall allow Admins to moderate, approve, or flag employer job descriptions to prevent duplicate, fraudulent, or unrealistic postings. | Functional | Essential | Platform quality control and spam prevention. |
| A5 | The system shall allow Admins to calibrate algorithmic scoring sensitivity (penalty exponent alpha=1.6) and assessment pass thresholds. | Functional | Desirable | System tuning and quality calibration. |
| A6 | The system shall provide College Placement Officers (TPOs) batch-wide placement readiness analytics with 1-click export for NAAC/NIRF accreditation. | Functional | Desirable | See E21/E22 — implemented as Org Admin capability for University-type Organizations, not a separate platform-admin feature. |
| A7 | The Superuser shall be able to approve, suspend, or delete an Organization account (per E12), with suspended orgs immediately losing access while their data remains intact for reinstatement. | Functional | Essential | Core lifecycle control for the multi-tenant model. |
| A8 | The Superuser shall see each Organization's subscription tier, seat count, and billing status (e.g. Active/Trial/Overdue) on a single admin view. | Functional | Essential | Operational visibility for running this as a subscription business. |
| A9 | The Superuser shall maintain a moderation queue for Sponsored Micro-Sprints (S22) requiring explicit approval before a submission goes live and becomes visible to students. | Functional | Essential | Direct control point for the conflict-of-interest risk in S22/S23. |
| A10 | The system shall flag for Superuser review any Sponsored Content where the sponsoring Organization is also actively screening candidates against that same skill node, surfacing the conflict rather than silently allowing it. | Functional | Desirable | Protects credential neutrality as the marketplace scales. |
| A11 | The Superuser shall be able to view a platform-wide anomaly log (e.g. one org issuing an unusually high volume of credentials in a short window) as a first-pass fraud/abuse signal. | Functional | Desirable | Early-stage trust and abuse monitoring. |
| A12 | The Superuser shall be able to generate an anonymized, cross-Organization skill-demand report (aggregating JD skill weights platform-wide) as a standalone insights product. | Functional | Desirable | Long-term data-moat monetization angle beyond subscriptions. |

---

## SECTION 4: NON-FUNCTIONAL & ARCHITECTURAL REQUIREMENTS (ENGINEERING RIGOR)

| Sl.No | Requirement Specification | Functional/ Non-Functional | Essential/ Desirable | Comments / Impact |
|---|---|---|---|---|
| NF1 | The system shall compute skill gap analyses and generate dynamic micro-curricula in under 3.0 seconds under standard network conditions. | Non Functional | Essential | Ensures high-responsiveness demo flow. |
| NF2 | The system shall incorporate an Offline Fallback Cache mode (USE_OFFLINE_CACHE=true) returning pre-cached outputs in under 100 milliseconds. | Non Functional | Essential | Fail-safe protection against venue Wi-Fi drops. |
| NF3 | The system shall enforce deterministic SHA-256 cryptographic hashing over canonicalized JSON payloads to ensure tamper-evident credentials. | Non Functional | Essential | Zero-trust verification standard. |
| NF4 | The user interface layouts shall be optimized for laptop/desktop screen widths (1024px and above) with responsive glassmorphism visual styling. | Non Functional | Essential | Presentation ergonomics during judging. |
| NF5 | The codebase shall conform to FastAPI RESTful architecture on the backend with Pydantic contracts, and Vite/React with TypeScript on the frontend. | Non Functional | Essential | Maintainability and modular hackathon build. |
| NF6 | The system shall enforce Organization-scoped data isolation (per E14) at every API endpoint, rejecting any request where a resource's org_id does not match the requesting user's org_id. | Non Functional | Essential | Multi-tenant security baseline — prevents cross-org data leaks. |

---
*Aspire AI — Role-Separated Software Requirements Specification (SRS) v2 — Hackathon Engineering Edition*
