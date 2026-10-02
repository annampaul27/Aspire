import {
  Organization,
  JobOpening,
  MicroSprintData,
  ProofOfWorkCredential,
  AnomalyLog,
} from "@/types";

export const INITIAL_ORGS: Organization[] = [
  {
    id: "org-acme",
    name: "Acme HyperScale Systems",
    type: "corporate",
    logo: "⚡",
    plan: "Enterprise",
    seatsUsed: 14,
    seatsTotal: 25,
    status: "active",
    createdDate: "2026-01-15",
    metrics: {
      candidatesScreened: 842,
      hoursSaved: 218,
      bridgeableHired: 39,
      gapSprintsCompleted: 114,
    },
  },
  {
    id: "org-apex-univ",
    name: "Apex National Institute of Technology",
    type: "university",
    logo: "🎓",
    plan: "Academic Pass",
    seatsUsed: 8,
    seatsTotal: 10,
    status: "active",
    createdDate: "2025-11-20",
    metrics: {
      candidatesScreened: 1420,
      hoursSaved: 460,
      bridgeableHired: 185,
      gapSprintsCompleted: 432,
    },
  },
  {
    id: "org-talentbridge",
    name: "TalentBridge Staffing Partners",
    type: "staffing",
    logo: "🌐",
    plan: "Growth",
    seatsUsed: 6,
    seatsTotal: 10,
    status: "active",
    createdDate: "2026-02-01",
    metrics: {
      candidatesScreened: 620,
      hoursSaved: 145,
      bridgeableHired: 28,
      gapSprintsCompleted: 78,
    },
  },
];

export const INITIAL_JOBS: JobOpening[] = [
  {
    id: "job-fullstack-01",
    orgId: "org-acme",
    title: "Senior Full-Stack Architect (Next.js 15 + FastAPI)",
    department: "Platform Engineering",
    location: "Bengaluru / Remote",
    type: "Full-Time",
    experienceMinYears: 3,
    salaryRange: "₹28,00,000 - ₹38,00,000",
    passThreshold: 85,
    applicantsCount: 46,
    status: "active",
    createdAt: "2026-09-10",
    criticalSkills: [
      {
        id: "react_server_components",
        name: "React Server Components & Streaming",
        category: "frontend",
        weight: 3.0,
        isCritical: true,
      },
      {
        id: "fastapi_async",
        name: "FastAPI Async Architecture",
        category: "backend",
        weight: 3.0,
        isCritical: true,
      },
      {
        id: "postgres_optimization",
        name: "PostgreSQL Indexing & Query Tuning",
        category: "backend",
        weight: 3.0,
        isCritical: true,
      },
    ],
    optionalSkills: [
      {
        id: "redis_caching",
        name: "Redis Distributed Locks & Caching",
        category: "backend",
        weight: 1.0,
        isCritical: false,
      },
      {
        id: "docker_containerization",
        name: "Docker Multi-stage Builds",
        category: "devops",
        weight: 1.0,
        isCritical: false,
      },
      {
        id: "tailwind_tokens",
        name: "Tailwind CSS Token Architectures",
        category: "frontend",
        weight: 1.0,
        isCritical: false,
      },
    ],
    description:
      "Looking for a high-craft Full-Stack Architect to spearhead core microservices and edge rendering. Must demonstrate battle-tested mastery over asynchronous Python pipelines, Next.js streaming hydration, and relational indexing under high concurrent writes.",
  },
  {
    id: "job-ai-systems-02",
    orgId: "org-acme",
    title: "AI Platform & Inference Systems Engineer",
    department: "Applied AI",
    location: "Hyderabad / Hybrid",
    type: "Full-Time",
    experienceMinYears: 2,
    salaryRange: "₹25,00,000 - ₹35,00,000",
    passThreshold: 85,
    applicantsCount: 32,
    status: "active",
    createdAt: "2026-09-15",
    criticalSkills: [
      {
        id: "llm_evaluation",
        name: "LLM Pipeline Evaluation & Tracing",
        category: "data_ai",
        weight: 3.0,
        isCritical: true,
      },
      {
        id: "vector_db",
        name: "Vector Embeddings & HNSW Indexing",
        category: "data_ai",
        weight: 3.0,
        isCritical: true,
      },
      {
        id: "fastapi_async",
        name: "FastAPI Async Architecture",
        category: "backend",
        weight: 3.0,
        isCritical: true,
      },
    ],
    optionalSkills: [
      {
        id: "redis_caching",
        name: "Redis Distributed Locks & Caching",
        category: "backend",
        weight: 1.0,
        isCritical: false,
      },
      {
        id: "docker_containerization",
        name: "Docker Multi-stage Builds",
        category: "devops",
        weight: 1.0,
        isCritical: false,
      },
    ],
    description:
      "Build low-latency RAG architectures, model gateway load balancers, and real-time inference streaming pipelines with deterministic auditing.",
  },
];

export const INITIAL_CREDENTIALS: ProofOfWorkCredential[] = [
  {
    hash: "a4f89d3810c92bf2234e405e6081297e68cfb939e6a0d0a52479e0237d45f3ba",
    candidateId: "cand-1",
    candidateName: "Aditya Verma",
    candidateEmail: "aditya.verma@example.com",
    skillId: "react_server_components",
    skillName: "React Server Components & Streaming",
    score: 92,
    passedQuestions: 3,
    totalQuestions: 3,
    issuedAt: "2026-09-20T11:42:00Z",
    issuerOrg: "Aspire AI Trust Engine",
    isSponsored: false,
    canonicalPayload: JSON.stringify({
      candidateEmail: "aditya.verma@example.com",
      candidateId: "cand-1",
      issuedAt: "2026-09-20T11:42:00Z",
      passedQuestions: 3,
      score: 92,
      skillId: "react_server_components",
      totalQuestions: 3,
    }),
    answersLog: [
      {
        questionId: "q-rsc-1",
        question: "How do Server Components handle client-side interactive state?",
        selectedOption: "They serialize data over the wire via flight protocol; interactive hooks must reside inside 'use client' boundaries.",
        isCorrect: true,
        timeSpentSeconds: 42,
      },
      {
        questionId: "q-rsc-2",
        question: "What is the primary benefit of Suspense streaming over SSR with hydration?",
        selectedOption: "TTFB improves dramatically as HTML chunks and flight data stream progressively without waiting for slowest DB queries.",
        isCorrect: true,
        timeSpentSeconds: 58,
      },
      {
        questionId: "q-rsc-3",
        question: "In Next.js App Router, where should database queries ideally run?",
        selectedOption: "Inside Server Components or Server Actions directly without exposing internal REST endpoints.",
        isCorrect: true,
        timeSpentSeconds: 31,
      },
    ],
    antiCheatAudit: {
      tabBlurEvents: 0,
      flagged: false,
    },
  },
  {
    hash: "f7b1028394a8c919248bde904921ca49e290f09823485091a182048591823bc1",
    candidateId: "cand-1",
    candidateName: "Aditya Verma",
    candidateEmail: "aditya.verma@example.com",
    skillId: "fastapi_async",
    skillName: "FastAPI Async Architecture",
    score: 88,
    passedQuestions: 3,
    totalQuestions: 3,
    issuedAt: "2026-09-22T14:15:00Z",
    issuerOrg: "Aspire AI Trust Engine",
    isSponsored: false,
    canonicalPayload: JSON.stringify({
      candidateEmail: "aditya.verma@example.com",
      candidateId: "cand-1",
      issuedAt: "2026-09-22T14:15:00Z",
      passedQuestions: 3,
      score: 88,
      skillId: "fastapi_async",
      totalQuestions: 3,
    }),
    answersLog: [
      {
        questionId: "q-fa-1",
        question: "When should an endpoint be defined with 'def' instead of 'async def' in FastAPI?",
        selectedOption: "When executing synchronous CPU-bound or blocking I/O calls that FastAPI offloads to the external threadpool.",
        isCorrect: true,
        timeSpentSeconds: 61,
      },
      {
        questionId: "q-fa-2",
        question: "How does SQLAlchemy async session handle commit failures?",
        selectedOption: "It raises an exception requiring an explicit rollback within an async context manager block.",
        isCorrect: true,
        timeSpentSeconds: 39,
      },
      {
        questionId: "q-fa-3",
        question: "What prevents event loop starvation in high-concurrency uvloop workers?",
        selectedOption: "Avoiding blocking time.sleep() and using non-blocking asyncio primitives throughout the request path.",
        isCorrect: true,
        timeSpentSeconds: 45,
      },
    ],
    antiCheatAudit: {
      tabBlurEvents: 0,
      flagged: false,
    },
  },
  {
    hash: "c294819a84920019ff83921049281a0293847592819384029485710293847581",
    candidateId: "cand-2",
    candidateName: "Pooja Sundaram",
    candidateEmail: "pooja.s@example.com",
    skillId: "postgres_optimization",
    skillName: "PostgreSQL Indexing & Query Tuning",
    score: 95,
    passedQuestions: 3,
    totalQuestions: 3,
    issuedAt: "2026-09-18T09:30:00Z",
    issuerOrg: "Aspire AI Trust Engine",
    isSponsored: true,
    sponsorOrg: "Snowflake Labs",
    canonicalPayload: JSON.stringify({
      candidateEmail: "pooja.s@example.com",
      candidateId: "cand-2",
      issuedAt: "2026-09-18T09:30:00Z",
      passedQuestions: 3,
      score: 95,
      skillId: "postgres_optimization",
      totalQuestions: 3,
    }),
    answersLog: [
      {
        questionId: "q-pg-1",
        question: "Which index type is best suited for UUID keys with random write distribution?",
        selectedOption: "B-Tree with fillfactor tuning or BRIN/Hash depending on query filter semantics.",
        isCorrect: true,
        timeSpentSeconds: 48,
      },
      {
        questionId: "q-pg-2",
        question: "What does 'EXPLAIN (ANALYZE, BUFFERS)' reveal that standard EXPLAIN omits?",
        selectedOption: "Actual execution times and shared hit/read memory cache buffer metrics.",
        isCorrect: true,
        timeSpentSeconds: 52,
      },
      {
        questionId: "q-pg-3",
        question: "How do partial indexes optimize index storage and write performance?",
        selectedOption: "By indexing only rows matching a WHERE predicate, discarding stagnant or deleted records.",
        isCorrect: true,
        timeSpentSeconds: 38,
      },
    ],
    antiCheatAudit: {
      tabBlurEvents: 0,
      flagged: false,
    },
  },
];

export const MICRO_SPRINTS: Record<string, MicroSprintData> = {
  postgres_optimization: {
    skillId: "postgres_optimization",
    skillName: "PostgreSQL Indexing & Query Tuning",
    estimatedMinutes: 10,
    sponsorOrgName: "Snowflake Labs",
    part1Concept: {
      title: "Mental Model: The Relational Execution Tree & B-Tree Cost Estimation",
      summary:
        "PostgreSQL's cost-based query optimizer converts parsed SQL into a relational operator tree (Seq Scan, Index Scan, Bitmap Index Scan, or Index Only Scan). A query becomes slow when the optimizer chooses a Sequential Scan over millions of pages because an index is missing, corrupted, or invalid for the query predicate (e.g. wrapping an indexed column inside a function).",
      mentalModel: [
        "1. Sequential Scan vs. Index Scan: Seq scan reads the entire table sequentially; index scan traverses B-Tree depth O(log N) then fetches heap tuples.",
        "2. Bitmap Index Scan: When multiple rows match, Postgres builds an in-memory bitmask of heap pages to eliminate random disk I/O.",
        "3. Covering Indexes (INCLUDE): Adding non-key columns via INCLUDE allows Index-Only Scans without touching table heap pages at all.",
      ],
      keyTakeaway:
        "Never guess query performance. Run EXPLAIN (ANALYZE, BUFFERS) to inspect actual hit/read cache ratios and avoid expression wrapping on indexed attributes.",
    },
    part2Scenario: {
      title: "Production Incident #381: Tenant Lookup Latency Spike (8,400ms -> 3ms)",
      incidentDescription:
        "At 14:00 UTC, the core API p99 latency spiked from 45ms to 8,400ms. An audit of pg_stat_activity revealed 48 backend workers blocked on a query filtering user organizations by lowercase email: `SELECT * FROM members WHERE lower(email) = $1 AND org_id = $2`. Despite a composite B-Tree index on (org_id, email), the query triggered a complete Sequential Scan across 14,000,000 rows.",
      brokenCodeSnippet: `-- BROKEN QUERY & DDL:
-- Existing index:
CREATE INDEX idx_members_org_email ON members (org_id, email);

-- Query executed in FastAPI endpoint:
SELECT id, org_id, email, role, created_at 
FROM members 
WHERE lower(email) = 'aditya@example.com' AND org_id = 'org-acme';

-- EXPLAIN ANALYZE OUTPUT:
-- Seq Scan on members (cost=0.00..384210.00 rows=1 width=92) (actual time=8231.120..8231.122 rows=1 loops=1)
-- Filter: ((org_id = 'org-acme'::text) AND (lower(email) = 'aditya@example.com'::text))
-- Rows Removed by Filter: 13999999
-- Buffers: shared read=312480`,
      rootCause:
        "PostgreSQL's standard B-Tree index on `(org_id, email)` indexes the raw verbatim bytes of `email`. Wrapping `lower(email)` in the WHERE clause transforms the column into an expression that cannot use the plain B-Tree index, forcing the planner to fall back to a full table sequential scan.",
      remediationCodeSnippet: `-- REMEDIATION (Production Zero-Downtime Patch):
-- 1. Create a partial functional covering index concurrently
CREATE INDEX CONCURRENTLY idx_members_org_lower_email_covering 
ON members (org_id, lower(email)) 
INCLUDE (role, created_at);

-- Re-running EXPLAIN (ANALYZE, BUFFERS):
-- Index Only Scan using idx_members_org_lower_email_covering (cost=0.56..8.58 rows=1 width=92)
-- Execution Time: 0.842 ms
-- Buffers: shared hit=4`,
      keyTakeaways: [
        "Expression indexes are mandatory when queries apply SQL transformations (like lower() or date_trunc()).",
        "Use CONCURRENTLY in production to prevent table-level exclusive locks during index creation.",
        "Add INCLUDE to achieve Index Only Scans for ultra-hot query paths.",
      ],
    },
    part3Questions: [
      {
        id: "q1",
        question:
          "Why did the original query `WHERE lower(email) = $1 AND org_id = $2` fail to utilize the B-Tree index on `(org_id, email)`?",
        codeSnippet: "CREATE INDEX idx ON members (org_id, email);\nSELECT * FROM members WHERE lower(email) = $1 AND org_id = $2;",
        options: [
          "PostgreSQL B-Tree indexes cannot index string/text columns under any circumstance.",
          "Applying the scalar function `lower()` on `email` prevents the query planner from using the index on raw column values unless a functional expression index is defined.",
          "PostgreSQL requires org_id to be cast to an integer before evaluating compound index predicates.",
          "The table had more than 1,000,000 rows, which automatically disables B-Tree scanning in PostgreSQL 16.",
        ],
        correctOptionIndex: 1,
        explanations: [
          "Incorrect: B-Trees are the default and primary index type for string and text types.",
          "Correct: Functions invalidate standard column indexes because the stored index keys are the raw values, not the transformed output.",
          "Incorrect: org_id was already a valid text identifier; type mismatch is not the issue here.",
          "Incorrect: B-Trees scale efficiently up to hundreds of millions of rows; table size does not disable B-Tree planning.",
        ],
        difficulty: "intermediate",
        conceptTag: "Functional & Expression Indexes",
      },
      {
        id: "q2",
        question:
          "What is the key architectural difference between `CREATE INDEX` and `CREATE INDEX CONCURRENTLY` in production PostgreSQL?",
        options: [
          "`CREATE INDEX CONCURRENTLY` compresses the index file by 50% using gzip compression.",
          "`CREATE INDEX` allows concurrent reads and writes, whereas `CONCURRENTLY` locks the table completely.",
          "`CREATE INDEX` acquires an ACCESS EXCLUSIVE lock blocking all SELECT/INSERT/UPDATE/DELETE queries, whereas `CONCURRENTLY` acquires a SHARE UPDATE EXCLUSIVE lock allowing ongoing reads and writes.",
          "`CREATE INDEX CONCURRENTLY` only works on temporary in-memory tables.",
        ],
        correctOptionIndex: 2,
        explanations: [
          "Incorrect: PostgreSQL does not gzip B-Trees with this keyword.",
          "Incorrect: The reverse is true: default CREATE INDEX takes an exclusive lock blocking traffic.",
          "Correct: CONCURRENTLY takes two table scans and avoids blocking production reads and writes, making it safe for live databases.",
          "Incorrect: CONCURRENTLY is specifically designed for live persistent production relations.",
        ],
        difficulty: "advanced",
        conceptTag: "Concurrency & Lock Mitigation",
      },
      {
        id: "q3",
        question:
          "How does adding an `INCLUDE (role, created_at)` clause to an index on `(org_id, lower(email))` achieve a sub-millisecond Index-Only Scan?",
        codeSnippet: "CREATE INDEX idx_covering ON members (org_id, lower(email)) INCLUDE (role, created_at);",
        options: [
          "It copies the entire database cluster into the client's browser local cache.",
          "It includes the non-key attributes in the leaf pages of the index, allowing the query planner to satisfy the SELECT list directly from the index without fetching heap pages.",
          "It converts the table from row-oriented storage into columnar Parquet format.",
          "It disables ACID transactions on the members table.",
        ],
        correctOptionIndex: 1,
        explanations: [
          "Incorrect: PostgreSQL storage engines do not interact with client browsers.",
          "Correct: Covering indexes store supplementary payload columns in index leaf nodes, eliminating heap page lookups when the visibility map is clean.",
          "Incorrect: PostgreSQL remains a relational MVCC row store; it does not convert to Parquet.",
          "Incorrect: Transactional ACID guarantees remain fully intact.",
        ],
        difficulty: "intermediate",
        conceptTag: "Covering Indexes & Index-Only Scans",
      },
    ],
  },
  react_server_components: {
    skillId: "react_server_components",
    skillName: "React Server Components & Streaming Architecture",
    estimatedMinutes: 10,
    part1Concept: {
      title: "Mental Model: Zero-Bundle Data Pipelines & Edge Streaming",
      summary:
        "React Server Components (RSC) run exclusively on the server, producing a JSON-like Flight format of virtual DOM elements rather than JavaScript bundles. This eliminates client bundle bloat, keeps database credentials and heavy parsers off the browser, and enables instant streaming hydration via HTTP chunked transfer.",
      mentalModel: [
        "1. Server vs Client Boundaries: Code above `'use client'` stays on server; only interactive subtree bundles ship to client.",
        "2. Progressive Flight Protocol: Server sends HTML skeletons first, then streams serialized React element chunks over the same connection.",
        "3. Data Colocation: Components fetch their own data directly without intermediate REST boilerplate.",
      ],
      keyTakeaway:
        "Use Server Components as the default skeleton. Only drop into `'use client'` at the leaves of the tree where user event listeners or hooks (useState, useEffect) are required.",
    },
    part2Scenario: {
      title: "Production Incident #104: Waterfall Hydration & Unintentional Bundle Leak",
      incidentDescription:
        "A large analytics dashboard shipped a 4.2MB client bundle because a developer placed `'use client'` at the top of the root layout file. This caused all child Server Components, heavy markdown parsers, and Prisma DB models to be packaged and transmitted to the client, crashing mobile browsers.",
      brokenCodeSnippet: `// BROKEN: Root Layout marked with 'use client'
'use client';

import { Suspense } from 'react';
import { heavyChartLib } from 'heavy-charts'; // 1.8MB
import { parseMarkdown } from '@/lib/parser'; // 600KB

export default function DashboardLayout({ children }) {
  return (
    <div className="layout">
      <header>Analytics</header>
      <main>{children}</main>
    </div>
  );
}`,
      rootCause:
        "The `'use client'` directive creates a boundary: everything imported into that file and its subtree is bundled for the browser. Placing it at the root layout negated all RSC zero-bundle benefits.",
      remediationCodeSnippet: `// REMEDIATION:
// 1. Keep Root Layout as a Server Component (no 'use client')
// 2. Isolate only the interactive Chart toggle into its own tiny client component

// src/components/InteractiveToggle.tsx
'use client';
export function InteractiveToggle() {
  const [active, setActive] = useState(false);
  return <button onClick={() => setActive(!active)}>Toggle</button>;
}

// src/app/dashboard/layout.tsx (Server Component)
import { InteractiveToggle } from '@/components/InteractiveToggle';

export default function DashboardLayout({ children }) {
  return (
    <div className="layout">
      <InteractiveToggle />
      <main>{children}</main>
    </div>
  );
}`,
      keyTakeaways: [
        "Never put `'use client'` at top-level layout files.",
        "Pass Server Components as `children` into Client Components to preserve server execution for the nested tree.",
      ],
    },
    part3Questions: [
      {
        id: "q_rsc_1",
        question:
          "What is the effect of passing a Server Component as `{children}` into a Client Component?",
        options: [
          "It forces the Server Component to become a Client Component and ships its code to the browser.",
          "The Server Component continues to render on the server, and its serialized React Flight output is passed into the client component as pre-rendered slots.",
          "It causes an immediate compile-time syntax error in Next.js 15+.",
          "It disables Suspense streaming across the entire route.",
        ],
        correctOptionIndex: 1,
        explanations: [
          "Incorrect: Nesting via props/children does NOT clientify the server component.",
          "Correct: This is the composition pattern: the server renders the children on the server and passes the Flight elements into the client component.",
          "Incorrect: This is the recommended idiomatic React pattern.",
          "Incorrect: Streaming continues to work normally.",
        ],
        difficulty: "intermediate",
        conceptTag: "RSC Composition Pattern",
      },
      {
        id: "q_rsc_2",
        question:
          "How does Suspense streaming in Next.js App Router improve First Contentful Paint (FCP) and Time to Interactive (TTI)?",
        options: [
          "It disables JavaScript on the client entirely.",
          "It streams fast HTML shells immediately while slow async server components stream their chunked UI and data as soon as promises resolve.",
          "It caches the entire database in service workers.",
          "It recompiles the Next.js runtime into WebAssembly.",
        ],
        correctOptionIndex: 1,
        explanations: [
          "Incorrect: JavaScript is still used for interactive client islands.",
          "Correct: Progressive streaming avoids blocking the whole page on the slowest database query.",
          "Incorrect: Service workers are not required for Suspense streaming.",
          "Incorrect: WebAssembly compilation is unrelated to HTTP chunked streaming.",
        ],
        difficulty: "intermediate",
        conceptTag: "Suspense Streaming Hydration",
      },
    ],
  },
};

export const INITIAL_TAXONOMY = [
  {
    canonicalId: "react_core",
    canonicalName: "React & React Server Components",
    category: "frontend",
    defaultWeight: 3.0,
    synonyms: ["react", "react.js", "reactjs", "rsc", "react-server-components"],
  },
  {
    canonicalId: "fastapi_async",
    canonicalName: "FastAPI Async Architecture",
    category: "backend",
    defaultWeight: 3.0,
    synonyms: ["fastapi", "fast-api", "python-fastapi", "uvicorn", "pydantic-api"],
  },
  {
    canonicalId: "postgres_optimization",
    canonicalName: "PostgreSQL Indexing & Query Tuning",
    category: "backend",
    defaultWeight: 3.0,
    synonyms: ["postgres", "postgresql", "psql", "sql-tuning", "postgres-indexing"],
  },
  {
    canonicalId: "redis_caching",
    canonicalName: "Redis Distributed Locks & Caching",
    category: "backend",
    defaultWeight: 1.0,
    synonyms: ["redis", "redlock", "redis-streams", "in-memory-cache"],
  },
  {
    canonicalId: "docker_containerization",
    canonicalName: "Docker Multi-stage Builds",
    category: "devops",
    defaultWeight: 1.0,
    synonyms: ["docker", "dockerfile", "containerization", "containers"],
  },
];

export const INITIAL_ANOMALIES: AnomalyLog[] = [
  {
    id: "anom-01",
    type: "Tab-blur Threshold Exceeded",
    description: "User switched browser tab 4 times during timed PostgreSQL assessment.",
    candidateName: "Rohan Kulkarni",
    timestamp: "2026-09-22 09:44:12",
    severity: "medium",
    resolved: false,
  },
  {
    id: "anom-02",
    type: "Sponsor Conflict",
    description: "Snowflake Labs sponsored PostgreSQL Micro-Sprint while actively filtering candidate requisitions for the same skill node.",
    orgName: "Snowflake Labs",
    timestamp: "2026-09-23 11:15:00",
    severity: "high",
    resolved: false,
  },
];
