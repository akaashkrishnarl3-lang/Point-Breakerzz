import { Meeting, ActionItem, Decision, UnresolvedIssue } from '../types';

export const DEMO_MEETINGS: Meeting[] = [
  {
    id: 'meet-001',
    title: 'Sprint 14 Planning & Architecture Kickoff',
    date: '2026-10-12',
    participants: ['Rahul Sharma', 'Priya Patel', 'Marcus Vance', 'Alex Chen (Lead)', 'Sarah Jenkins'],
    summary: 'Sprint planning session focusing on core platform milestones. The team finalized the database engine choice, assigned frontend and backend leads, but left API integration architecture undecided pending protocol benchmarks.',
    transcript: `Alex Chen (Lead) [10:00 AM]: Welcome everyone to the Sprint 14 architecture kickoff. Let's lock in our key deliverables for this cycle. First on the agenda is the storage architecture. Rahul, what's your assessment?

Rahul Sharma [10:02 AM]: After testing PostgreSQL and MongoDB under high concurrency, PostgreSQL handles our relational consistency requirements with zero write degradation. We should formally adopt PostgreSQL for our core database architecture.

Alex Chen (Lead) [10:04 AM]: Agreed. Let's make that a firm decision: We adopt PostgreSQL as our primary database engine. Now regarding execution, Rahul, what can you commit to for the schema implementation?

Rahul Sharma [10:05 AM]: Rahul will prepare the database module by Friday. That will include the migration scripts, user auth tables, and tenant isolation policies.

Priya Patel [10:07 AM]: On the frontend side, I've reviewed the design tokens from Figma. Priya will finish the UI by Wednesday. I'll make sure the responsive dashboard shell, navigation rail, and dark theme variables are fully wired up.

Alex Chen (Lead) [10:09 AM]: Excellent. What about the API communication layer between the UI microfrontends and backend services? Do we do REST with OpenAPI or GraphQL federation?

Marcus Vance [10:11 AM]: The API integration approach is still undecided. There's a debate over latency overhead versus developer agility. I recommend we run a quick load test before committing.

Sarah Jenkins [10:13 AM]: Also, someone should review the third-party billing webhooks before launch. We received complaints from beta testers about duplicate event retries.

Alex Chen (Lead) [10:15 AM]: Good catch Sarah, but let's figure out who will take ownership of that once we finalize the sprint backlog. Let's reconvene on Thursday for a progress checkpoint.`,
    createdAt: '2026-10-12T10:30:00.000Z'
  },
  {
    id: 'meet-002',
    title: 'Mid-Sprint Sync & Blocker Triage',
    date: '2026-10-15',
    participants: ['Rahul Sharma', 'Priya Patel', 'Marcus Vance', 'Alex Chen (Lead)'],
    summary: 'Mid-sprint checkpoint. Rahul verified completion of the database module with full migration tests passing. Priya requested an extension for the UI due to revised design specifications. The API integration approach remains unresolved.',
    transcript: `Alex Chen (Lead) [02:00 PM]: Thanks for joining the mid-sprint triage. Let's do a fast round on commitments from Monday. Rahul, let's start with you.

Rahul Sharma [02:01 PM]: Rahul completed the database module yesterday ahead of schedule. All Prisma migration scripts and tenant isolation tests have passed CI. The pull request is merged into main.

Alex Chen (Lead) [02:03 PM]: Fantastic work Rahul, that unblocks the downstream services. Priya, how are we looking on the dashboard UI?

Priya Patel [02:04 PM]: Priya needs two more days for the UI. The product team updated the audit log wireframes yesterday afternoon, so I had to restructure the table virtual scrolling components. I will deliver the updated UI by Friday afternoon.

Alex Chen (Lead) [02:06 PM]: Understood, two extra days makes sense given the scope change. Let's make sure that's delivered by Friday. Now, what about the API integration layer? Marcus?

Marcus Vance [02:08 PM]: We still haven't decided the API integration approach. The GraphQL federation benchmark showed 12ms latency, while REST was 7ms, but schema governance in GraphQL is much cleaner. We need another 48 hours to test caching.

Alex Chen (Lead) [02:10 PM]: Understood. Let's keep that flagged as an unresolved issue. Marcus, will you take an action to formalize the benchmark report?

Marcus Vance [02:11 PM]: Yes, Marcus will benchmark the GraphQL federation latency by Friday and share the metrics with the architecture council.

Alex Chen (Lead) [02:13 PM]: Great. We also decided to use OAuth 2.0 with JWT tokens for our internal service authentication. Let's document that. Let's meet Monday for final sprint review.`,
    createdAt: '2026-10-15T14:30:00.000Z'
  },
  {
    id: 'meet-003',
    title: 'Sprint 14 Review & Release Sign-Off',
    date: '2026-10-19',
    participants: ['Rahul Sharma', 'Priya Patel', 'Marcus Vance', 'Alex Chen (Lead)', 'Sarah Jenkins'],
    summary: 'Sprint review and release sign-off. Priya successfully completed the UI deliverable. Marcus completed the API benchmark and the team formally resolved the API integration debate by choosing REST with OpenAPI. Marcus was delayed on the authentication audit due to an infrastructure outage.',
    transcript: `Alex Chen (Lead) [11:00 AM]: Welcome to the Sprint 14 review and sign-off meeting. Let's check status on our remaining items. Priya, UI deliverable?

Priya Patel [11:02 AM]: Priya completed the UI implementation on Friday evening. All audit log components, responsive layouts, and cross-browser testing on Chrome and Safari passed QA with zero defects.

Alex Chen (Lead) [11:04 AM]: Outstanding, great recovery on the timeline. Marcus, did you finish the API benchmark?

Marcus Vance [11:05 AM]: Yes, the benchmark is done. Based on the data, REST with OpenAPI 3.1 gave us the required 99th percentile sub-10ms response times. We decided to adopt REST with OpenAPI 3.1 for all internal microservice APIs.

Alex Chen (Lead) [11:07 AM]: Excellent, that finally resolves the API integration approach debate! What about the OAuth authentication review?

Marcus Vance [11:08 AM]: Marcus couldn't complete the OAuth authentication review by Friday due to the AWS us-east-1 downtime incident over the weekend. I am carrying this over and will finish the auth review by Wednesday.

Alex Chen (Lead) [11:10 AM]: Understood, the outage was an emergency. Let's make sure that gets finished Wednesday. Sarah, regarding the billing webhooks?

Sarah Jenkins [11:12 AM]: Sarah will audit the Stripe webhook retry policies by Thursday to eliminate the duplicate billing events reported in staging.

Alex Chen (Lead) [11:14 AM]: Perfect. We are officially on track for the v1.2 candidate deployment next Monday.`,
    createdAt: '2026-10-19T11:30:00.000Z'
  },
  {
    id: 'meet-004',
    title: 'Post-Release Retrospective & Sprint 15 Planning',
    date: '2026-10-22',
    participants: ['Rahul Sharma', 'Priya Patel', 'Marcus Vance', 'Alex Chen (Lead)', 'Sarah Jenkins'],
    summary: 'Retrospective and Sprint 15 planning. Marcus confirmed completion of the carried-over OAuth authentication review. Sarah completed the Stripe billing webhook audit. The team agreed on a new continuous deployment policy.',
    transcript: `Alex Chen (Lead) [03:00 PM]: Welcome to our post-release retro and Sprint 15 kickoff. Let's confirm closure of our carry-over commitments. Marcus?

Marcus Vance [03:02 PM]: Marcus completed the OAuth authentication review yesterday. The security review verified JWT validation and rate limiting. The auth service is ready for production.

Alex Chen (Lead) [03:04 PM]: Superb. And Sarah, how about the billing webhooks?

Sarah Jenkins [03:05 PM]: Sarah completed the Stripe webhook audit today. We added idempotency keys and exponential backoff, preventing all duplicate transaction retries in staging tests.

Alex Chen (Lead) [03:07 PM]: Fantastic, both critical carried-over items are now closed. As a team, we decided to mandate automated end-to-end smoke tests on every pull request prior to merging.

Rahul Sharma [03:09 PM]: Rahul will set up the GitHub Actions workflow for end-to-end smoke testing by next Tuesday.

Priya Patel [03:11 PM]: Priya will design the analytics telemetry dashboard by next Friday.

Alex Chen (Lead) [03:13 PM]: Great alignment team. Meeting adjourned!`,
    createdAt: '2026-10-22T15:30:00.000Z'
  }
];

export const DEMO_ACTION_ITEMS: ActionItem[] = [
  {
    id: 'act-001',
    meetingId: 'meet-001',
    meetingTitle: 'Sprint 14 Planning & Architecture Kickoff',
    meetingDate: '2026-10-12',
    task: 'Prepare database module including migrations, user auth tables, and tenant isolation',
    owner: 'Rahul Sharma',
    deadline: 'Friday (2026-10-16)',
    status: 'COMPLETED',
    confidence: 0.98,
    evidenceText: 'Rahul will prepare the database module by Friday. That will include the migration scripts, user auth tables, and tenant isolation policies.',
    linkedItemId: null,
    isAmbiguous: false,
    history: [
      {
        meetingId: 'meet-001',
        meetingTitle: 'Sprint 14 Planning & Architecture Kickoff',
        date: '2026-10-12',
        status: 'NEW',
        evidenceText: 'Rahul will prepare the database module by Friday. That will include the migration scripts, user auth tables, and tenant isolation policies.',
        note: 'Initial commitment created in Sprint 14 planning'
      },
      {
        meetingId: 'meet-002',
        meetingTitle: 'Mid-Sprint Sync & Blocker Triage',
        date: '2026-10-15',
        status: 'COMPLETED',
        evidenceText: 'Rahul completed the database module yesterday ahead of schedule. All Prisma migration scripts and tenant isolation tests have passed CI.',
        note: 'Completed ahead of deadline and merged into main'
      }
    ],
    createdAt: '2026-10-12T10:05:00.000Z',
    updatedAt: '2026-10-15T14:01:00.000Z'
  },
  {
    id: 'act-002',
    meetingId: 'meet-001',
    meetingTitle: 'Sprint 14 Planning & Architecture Kickoff',
    meetingDate: '2026-10-12',
    task: 'Finish frontend UI shell with navigation rail and dark theme variables',
    owner: 'Priya Patel',
    deadline: 'Wednesday (2026-10-14)',
    status: 'COMPLETED',
    confidence: 0.96,
    evidenceText: 'Priya will finish the UI by Wednesday. I\'ll make sure the responsive dashboard shell, navigation rail, and dark theme variables are fully wired up.',
    linkedItemId: null,
    isAmbiguous: false,
    history: [
      {
        meetingId: 'meet-001',
        meetingTitle: 'Sprint 14 Planning & Architecture Kickoff',
        date: '2026-10-12',
        status: 'NEW',
        evidenceText: 'Priya will finish the UI by Wednesday.',
        note: 'Original delivery scheduled for Wednesday'
      },
      {
        meetingId: 'meet-002',
        meetingTitle: 'Mid-Sprint Sync & Blocker Triage',
        date: '2026-10-15',
        status: 'CARRIED_OVER',
        evidenceText: 'Priya needs two more days for the UI. The product team updated the audit log wireframes yesterday afternoon...',
        note: 'Carried over due to design scope revision (+2 days)'
      },
      {
        meetingId: 'meet-003',
        meetingTitle: 'Sprint 14 Review & Release Sign-Off',
        date: '2026-10-19',
        status: 'COMPLETED',
        evidenceText: 'Priya completed the UI implementation on Friday evening. All audit log components, responsive layouts, and cross-browser testing on Chrome and Safari passed QA.',
        note: 'Verified completed and passed QA'
      }
    ],
    createdAt: '2026-10-12T10:07:00.000Z',
    updatedAt: '2026-10-19T11:02:00.000Z'
  },
  {
    id: 'act-003',
    meetingId: 'meet-001',
    meetingTitle: 'Sprint 14 Planning & Architecture Kickoff',
    meetingDate: '2026-10-12',
    task: 'Review third-party billing webhooks and resolve duplicate event retries',
    owner: null,
    deadline: null,
    status: 'AMBIGUOUS',
    confidence: 0.72,
    evidenceText: 'Also, someone should review the third-party billing webhooks before launch. We received complaints from beta testers about duplicate event retries.',
    linkedItemId: null,
    isAmbiguous: true,
    ambiguityReason: 'Speaker suggested "someone should review" without specifying an owner or a concrete calendar deadline.',
    history: [
      {
        meetingId: 'meet-001',
        meetingTitle: 'Sprint 14 Planning & Architecture Kickoff',
        date: '2026-10-12',
        status: 'AMBIGUOUS',
        evidenceText: 'Also, someone should review the third-party billing webhooks before launch.',
        note: 'Flagged: unassigned task suggestion with no owner or deadline'
      }
    ],
    createdAt: '2026-10-12T10:13:00.000Z',
    updatedAt: '2026-10-12T10:13:00.000Z'
  },
  {
    id: 'act-004',
    meetingId: 'meet-002',
    meetingTitle: 'Mid-Sprint Sync & Blocker Triage',
    meetingDate: '2026-10-15',
    task: 'Benchmark GraphQL federation latency and share metrics with architecture council',
    owner: 'Marcus Vance',
    deadline: 'Friday (2026-10-17)',
    status: 'COMPLETED',
    confidence: 0.95,
    evidenceText: 'Marcus will benchmark the GraphQL federation latency by Friday and share the metrics with the architecture council.',
    linkedItemId: null,
    isAmbiguous: false,
    history: [
      {
        meetingId: 'meet-002',
        meetingTitle: 'Mid-Sprint Sync & Blocker Triage',
        date: '2026-10-15',
        status: 'NEW',
        evidenceText: 'Marcus will benchmark the GraphQL federation latency by Friday and share the metrics with the architecture council.',
        note: 'Assigned during mid-sprint sync'
      },
      {
        meetingId: 'meet-003',
        meetingTitle: 'Sprint 14 Review & Release Sign-Off',
        date: '2026-10-19',
        status: 'COMPLETED',
        evidenceText: 'Yes, the benchmark is done. Based on the data, REST with OpenAPI 3.1 gave us the required 99th percentile sub-10ms response times.',
        note: 'Completed benchmark delivered to council'
      }
    ],
    createdAt: '2026-10-15T14:11:00.000Z',
    updatedAt: '2026-10-19T11:05:00.000Z'
  },
  {
    id: 'act-005',
    meetingId: 'meet-003',
    meetingTitle: 'Sprint 14 Review & Release Sign-Off',
    meetingDate: '2026-10-19',
    task: 'Complete OAuth authentication security review and rate limiting audit',
    owner: 'Marcus Vance',
    deadline: 'Wednesday (2026-10-21)',
    status: 'COMPLETED',
    confidence: 0.94,
    evidenceText: 'Marcus couldn\'t complete the OAuth authentication review by Friday due to the AWS us-east-1 downtime incident over the weekend. I am carrying this over and will finish the auth review by Wednesday.',
    linkedItemId: null,
    isAmbiguous: false,
    history: [
      {
        meetingId: 'meet-003',
        meetingTitle: 'Sprint 14 Review & Release Sign-Off',
        date: '2026-10-19',
        status: 'CARRIED_OVER',
        evidenceText: 'Marcus couldn\'t complete the OAuth authentication review by Friday due to the AWS us-east-1 downtime... will finish by Wednesday.',
        note: 'Carried over due to AWS outage delay'
      },
      {
        meetingId: 'meet-004',
        meetingTitle: 'Post-Release Retrospective & Sprint 15 Planning',
        date: '2026-10-22',
        status: 'COMPLETED',
        evidenceText: 'Marcus completed the OAuth authentication review yesterday. The security review verified JWT validation and rate limiting.',
        note: 'Successfully completed and validated for production'
      }
    ],
    createdAt: '2026-10-19T11:08:00.000Z',
    updatedAt: '2026-10-22T15:02:00.000Z'
  },
  {
    id: 'act-006',
    meetingId: 'meet-003',
    meetingTitle: 'Sprint 14 Review & Release Sign-Off',
    meetingDate: '2026-10-19',
    task: 'Audit Stripe webhook retry policies to eliminate duplicate billing events',
    owner: 'Sarah Jenkins',
    deadline: 'Thursday (2026-10-22)',
    status: 'COMPLETED',
    confidence: 0.96,
    evidenceText: 'Sarah will audit the Stripe webhook retry policies by Thursday to eliminate the duplicate billing events reported in staging.',
    linkedItemId: 'act-003',
    isAmbiguous: false,
    history: [
      {
        meetingId: 'meet-003',
        meetingTitle: 'Sprint 14 Review & Release Sign-Off',
        date: '2026-10-19',
        status: 'NEW',
        evidenceText: 'Sarah will audit the Stripe webhook retry policies by Thursday to eliminate the duplicate billing events reported in staging.',
        note: 'Assigned to Sarah, resolving earlier ambiguous suggestion'
      },
      {
        meetingId: 'meet-004',
        meetingTitle: 'Post-Release Retrospective & Sprint 15 Planning',
        date: '2026-10-22',
        status: 'COMPLETED',
        evidenceText: 'Sarah completed the Stripe webhook audit today. We added idempotency keys and exponential backoff, preventing all duplicate transaction retries.',
        note: 'Fixed with idempotency keys and validated'
      }
    ],
    createdAt: '2026-10-19T11:12:00.000Z',
    updatedAt: '2026-10-22T15:05:00.000Z'
  },
  {
    id: 'act-007',
    meetingId: 'meet-004',
    meetingTitle: 'Post-Release Retrospective & Sprint 15 Planning',
    meetingDate: '2026-10-22',
    task: 'Set up GitHub Actions workflow for automated end-to-end smoke testing',
    owner: 'Rahul Sharma',
    deadline: 'Tuesday (2026-10-27)',
    status: 'NEW',
    confidence: 0.97,
    evidenceText: 'Rahul will set up the GitHub Actions workflow for end-to-end smoke testing by next Tuesday.',
    linkedItemId: null,
    isAmbiguous: false,
    history: [
      {
        meetingId: 'meet-004',
        meetingTitle: 'Post-Release Retrospective & Sprint 15 Planning',
        date: '2026-10-22',
        status: 'NEW',
        evidenceText: 'Rahul will set up the GitHub Actions workflow for end-to-end smoke testing by next Tuesday.',
        note: 'New commitment for Sprint 15'
      }
    ],
    createdAt: '2026-10-22T15:09:00.000Z',
    updatedAt: '2026-10-22T15:09:00.000Z'
  },
  {
    id: 'act-008',
    meetingId: 'meet-004',
    meetingTitle: 'Post-Release Retrospective & Sprint 15 Planning',
    meetingDate: '2026-10-22',
    task: 'Design analytics telemetry dashboard',
    owner: 'Priya Patel',
    deadline: 'Friday (2026-10-30)',
    status: 'NEW',
    confidence: 0.95,
    evidenceText: 'Priya will design the analytics telemetry dashboard by next Friday.',
    linkedItemId: null,
    isAmbiguous: false,
    history: [
      {
        meetingId: 'meet-004',
        meetingTitle: 'Post-Release Retrospective & Sprint 15 Planning',
        date: '2026-10-22',
        status: 'NEW',
        evidenceText: 'Priya will design the analytics telemetry dashboard by next Friday.',
        note: 'New commitment for Sprint 15'
      }
    ],
    createdAt: '2026-10-22T15:11:00.000Z',
    updatedAt: '2026-10-22T15:11:00.000Z'
  },
  {
    id: 'act-009',
    meetingId: 'meet-001',
    meetingTitle: 'Sprint 14 Planning & Architecture Kickoff',
    meetingDate: '2026-10-12',
    task: 'Configure production DNS failover routing policy',
    owner: 'DevOps Team',
    deadline: '2026-10-14',
    status: 'OVERDUE',
    confidence: 0.91,
    evidenceText: 'DevOps team must finalize the DNS failover routing policy before October 14.',
    linkedItemId: null,
    isAmbiguous: false,
    history: [
      {
        meetingId: 'meet-001',
        meetingTitle: 'Sprint 14 Planning & Architecture Kickoff',
        date: '2026-10-12',
        status: 'NEW',
        evidenceText: 'DevOps team must finalize the DNS failover routing policy before October 14.',
        note: 'Original target Oct 14'
      },
      {
        meetingId: 'meet-002',
        meetingTitle: 'Mid-Sprint Sync & Blocker Triage',
        date: '2026-10-15',
        status: 'OVERDUE',
        evidenceText: 'No completion confirmation provided in subsequent meetings; deadline passed.',
        note: 'Automatically flagged as OVERDUE after deadline passed without evidence'
      }
    ],
    createdAt: '2026-10-12T10:14:00.000Z',
    updatedAt: '2026-10-15T00:00:00.000Z'
  }
];

export const DEMO_DECISIONS: Decision[] = [
  {
    id: 'dec-001',
    meetingId: 'meet-001',
    meetingTitle: 'Sprint 14 Planning & Architecture Kickoff',
    meetingDate: '2026-10-12',
    decision: 'Adopt PostgreSQL as primary database engine for relational consistency and zero write degradation',
    evidenceText: 'Agreed. Let\'s make that a firm decision: We adopt PostgreSQL as our primary database engine.',
    createdAt: '2026-10-12T10:04:00.000Z'
  },
  {
    id: 'dec-002',
    meetingId: 'meet-002',
    meetingTitle: 'Mid-Sprint Sync & Blocker Triage',
    meetingDate: '2026-10-15',
    decision: 'Use OAuth 2.0 with JWT tokens for internal service authentication',
    evidenceText: 'We also decided to use OAuth 2.0 with JWT tokens for our internal service authentication. Let\'s document that.',
    createdAt: '2026-10-15T14:13:00.000Z'
  },
  {
    id: 'dec-003',
    meetingId: 'meet-003',
    meetingTitle: 'Sprint 14 Review & Release Sign-Off',
    meetingDate: '2026-10-19',
    decision: 'Adopt REST with OpenAPI 3.1 for all internal microservice APIs (sub-10ms P99 latency)',
    evidenceText: 'We decided to adopt REST with OpenAPI 3.1 for all internal microservice APIs.',
    createdAt: '2026-10-19T11:05:00.000Z'
  },
  {
    id: 'dec-004',
    meetingId: 'meet-004',
    meetingTitle: 'Post-Release Retrospective & Sprint 15 Planning',
    meetingDate: '2026-10-22',
    decision: 'Mandate automated end-to-end smoke testing on all pull requests prior to merging',
    evidenceText: 'As a team, we decided to mandate automated end-to-end smoke tests on every pull request prior to merging.',
    createdAt: '2026-10-22T15:07:00.000Z'
  }
];

export const DEMO_UNRESOLVED: UnresolvedIssue[] = [
  {
    id: 'unres-001',
    meetingId: 'meet-001',
    meetingTitle: 'Sprint 14 Planning & Architecture Kickoff',
    meetingDate: '2026-10-12',
    issue: 'API integration approach (REST with OpenAPI vs GraphQL Federation)',
    owner: 'Marcus Vance',
    status: 'RESOLVED',
    evidenceText: 'The API integration approach is still undecided. There\'s a debate over latency overhead versus developer agility.',
    linkedIssueId: null,
    resolvedByDecisionId: 'dec-003',
    appearances: [
      {
        meetingId: 'meet-001',
        meetingTitle: 'Sprint 14 Planning & Architecture Kickoff',
        date: '2026-10-12',
        evidenceText: 'The API integration approach is still undecided. There\'s a debate over latency overhead versus developer agility.'
      },
      {
        meetingId: 'meet-002',
        meetingTitle: 'Mid-Sprint Sync & Blocker Triage',
        date: '2026-10-15',
        evidenceText: 'We still haven\'t decided the API integration approach. The GraphQL federation benchmark showed 12ms latency, while REST was 7ms...'
      },
      {
        meetingId: 'meet-003',
        meetingTitle: 'Sprint 14 Review & Release Sign-Off',
        date: '2026-10-19',
        evidenceText: 'Resolved: We decided to adopt REST with OpenAPI 3.1 for all internal microservice APIs based on benchmark metrics.'
      }
    ],
    createdAt: '2026-10-12T10:11:00.000Z'
  },
  {
    id: 'unres-002',
    meetingId: 'meet-002',
    meetingTitle: 'Mid-Sprint Sync & Blocker Triage',
    meetingDate: '2026-10-15',
    issue: 'Disaster recovery multi-region replication strategy under failover constraints',
    owner: null,
    status: 'UNRESOLVED',
    evidenceText: 'Disaster recovery multi-region replication strategy remains pending approval from enterprise architecture board.',
    linkedIssueId: null,
    appearances: [
      {
        meetingId: 'meet-002',
        meetingTitle: 'Mid-Sprint Sync & Blocker Triage',
        date: '2026-10-15',
        evidenceText: 'Disaster recovery multi-region replication strategy remains pending approval from enterprise architecture board.'
      },
      {
        meetingId: 'meet-004',
        meetingTitle: 'Post-Release Retrospective & Sprint 15 Planning',
        date: '2026-10-22',
        evidenceText: 'Still awaiting enterprise security sign-off for multi-region active-active read replicas.'
      }
    ],
    createdAt: '2026-10-15T14:20:00.000Z'
  }
];

export const SAMPLE_INPUT_TRANSCRIPTS = [
  {
    label: 'Sprint Check-in (Carry-over & Completed)',
    title: 'Sprint 16 Standup Check-in',
    date: '2026-10-28',
    participants: 'Rahul Sharma, Priya Patel, Marcus Vance, Alex Chen',
    transcript: `Alex Chen [09:30 AM]: Quick sync team. Rahul, how did the GitHub Actions smoke test workflow go?

Rahul Sharma [09:31 AM]: Rahul completed the GitHub Actions smoke test workflow yesterday. It runs Cypress tests on staging deploys automatically.

Alex Chen [09:32 AM]: Great. Priya, update on the analytics telemetry dashboard?

Priya Patel [09:33 AM]: Priya needs three more days for the telemetry dashboard. The time-series aggregation queries were timing out on large tenant sets. I will deliver it by next Wednesday.

Marcus Vance [09:35 AM]: Marcus will benchmark Redis cluster cache warming by Monday. We want to cut P99 query latency down to 2ms.

Alex Chen [09:37 AM]: That's great. What about the enterprise SSO SAML integration? Is that decided?

Marcus Vance [09:38 AM]: The enterprise SSO SAML provider is still undecided. We are evaluating Okta versus Auth0 enterprise tiers.`
  },
  {
    label: 'Architecture Review (New & Decisions)',
    title: 'Platform V2 Core Design Session',
    date: '2026-11-02',
    participants: 'Elena Rostova, David Kim, Maya Lin, Alex Chen',
    transcript: `Alex Chen [10:00 AM]: Welcome to the Platform V2 design session. Let's make concrete decisions today. David, what is our verdict on message brokers?

David Kim [10:02 AM]: After testing RabbitMQ and Apache Kafka, Kafka provides the replayability and partition scaling we need for event sourcing. We decided to use Apache Kafka as our central event stream.

Alex Chen [10:04 AM]: Excellent. Let's record that decision. David, will you own the cluster provisioning?

David Kim [10:05 AM]: David will configure the Kafka broker cluster on Kubernetes by Thursday.

Elena Rostova [10:07 AM]: Elena will build the event schema validation library using Protocol Buffers by next Tuesday.

Maya Lin [10:09 AM]: Should we encrypt event payloads at the producer level or broker disk level?

David Kim [10:10 AM]: Event payload encryption methodology is still undecided until security completes compliance review.

Maya Lin [10:12 AM]: Someone should probably look at open telemetry distributed tracing headers.`
  }
];
