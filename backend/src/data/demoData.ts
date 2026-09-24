import { Meeting, ActionItem, Decision, UnresolvedIssue } from '../types/index.js';

export const DEMO_MEETINGS: Meeting[] = [
  {
    id: 'meet-demo-001',
    demo_key: 'meetflow-demo-meeting-1',
    title: 'Project Planning Meeting',
    date: '2026-09-14',
    participants: ['Rahul Sharma', 'Priya Patel', 'Alex Rivera (Lead)', 'Marcus Vance'],
    summary: 'Initial project kickoff session. The team agreed to use PostgreSQL for the application database. Rahul committed to complete database integration by Friday, Priya committed to prepare the UI design by Monday, and Marcus took on API testing which remains unresolved.',
    transcript: `Alex Rivera (Lead) [10:00 AM]: Welcome everyone to the Project Planning Meeting. Let's align on core milestones for our platform. First, what database architecture are we moving forward with?

Rahul Sharma [10:02 AM]: After testing various options, PostgreSQL gives us the relational integrity and indexing performance we require. The team decided to use PostgreSQL for the application database.

Alex Rivera (Lead) [10:04 AM]: Excellent. Let's make that our formal architectural decision: Use PostgreSQL for the application database. Rahul, when can you deliver the core database integration?

Rahul Sharma [10:05 AM]: Rahul will complete the database integration by Friday. That will include the schema migration scripts, connection pooling, and initial models.

Priya Patel [10:07 AM]: On the frontend side, I have the Figma wireframes ready. Priya will prepare the UI design by Monday. I'll make sure the responsive layout, design tokens, and dashboard components are ready.

Marcus Vance [10:09 AM]: Regarding the end-to-end API testing framework, the approach is still debated between contract testing and synthetic mocks. The API testing remains unresolved.

Alex Rivera (Lead) [10:11 AM]: Let's flag that as an open blocker. Also, Marcus, can you review the load testing benchmarks by Wednesday?

Marcus Vance [10:12 AM]: Marcus will review the load testing benchmarks by Wednesday.

Alex Rivera (Lead) [10:14 AM]: Great. Meeting adjourned, let's reconvene on Friday for the progress review.`,
    createdAt: '2026-09-14T10:30:00.000Z',
    actionItemsCount: 3,
    decisionsCount: 1,
    unresolvedCount: 1
  },
  {
    id: 'meet-demo-002',
    demo_key: 'meetflow-demo-meeting-2',
    title: 'Project Progress Review',
    date: '2026-09-18',
    participants: ['Rahul Sharma', 'Priya Patel', 'Alex Rivera (Lead)', 'Marcus Vance'],
    summary: 'Mid-sprint checkpoint. Priya successfully completed the UI design deliverable. Rahul reported that he has not completed the database integration yet and carried it over. The team agreed that API testing starts after database integration.',
    transcript: `Alex Rivera (Lead) [02:00 PM]: Welcome to our Project Progress Review. Let's check status on our Monday commitments. Priya, how is the UI design progressing?

Priya Patel [02:01 PM]: Priya completed the UI design. The design system tokens, responsive navigation, and dashboard components are fully reviewed and pushed to the repository.

Alex Rivera (Lead) [02:03 PM]: Great job Priya! Rahul, what's the status on the database integration?

Rahul Sharma [02:04 PM]: Rahul has not completed the database integration yet. I ran into complex foreign key constraints with the multi-tenant schema, so I am carrying this over to the final review meeting.

Alex Rivera (Lead) [02:06 PM]: Understood, let's carry that over and make sure it is delivered by next sprint check. What about API testing?

Marcus Vance [02:07 PM]: We discussed the sequencing with the QA team. The team agreed that API testing should start after database integration.

Alex Rivera (Lead) [02:09 PM]: Agreed, that's a clear operational decision: API testing starts after database integration. Marcus, what about the load test benchmarks from Wednesday?

Marcus Vance [02:10 PM]: I was tied up debugging the staging cluster and could not finish the benchmarks.

Alex Rivera (Lead) [02:12 PM]: Understood, that deadline has passed. Let's prioritize getting database unblocked first.`,
    createdAt: '2026-09-18T14:30:00.000Z',
    actionItemsCount: 1,
    decisionsCount: 1,
    unresolvedCount: 0
  },
  {
    id: 'meet-demo-003',
    demo_key: 'meetflow-demo-meeting-3',
    title: 'Final Project Review',
    date: '2026-09-23',
    participants: ['Rahul Sharma', 'Priya Patel', 'Alex Rivera (Lead)', 'Marcus Vance'],
    summary: 'Final project review and verification. Rahul verified that he completed the database integration. Priya confirmed her UI design is complete. Marcus reported that API testing is still pending and carried it over.',
    transcript: `Alex Rivera (Lead) [11:00 AM]: Welcome to the Final Project Review. Let's go over our carried over items. Rahul, database integration?

Rahul Sharma [11:02 AM]: Rahul completed the database integration. All schema migrations are committed, connection pooling is verified, and unit tests are passing.

Alex Rivera (Lead) [11:04 AM]: Outstanding! Priya, UI design status?

Priya Patel [11:05 AM]: Priya's UI design is complete. All components have been integrated with the frontend dashboard and QA signoff is done.

Alex Rivera (Lead) [11:07 AM]: Excellent. Marcus, what is the status of API testing?

Marcus Vance [11:08 AM]: API testing is still pending. Because database integration was just finalized, the mock suite is waiting for seed data. Marcus will carry over API test execution to next week.

Rahul Sharma [11:10 AM]: Rahul will configure the staging deployment pipeline for continuous integration by next Tuesday.

Alex Rivera (Lead) [11:12 AM]: Understood. Let's carry that over as active work. Fantastic progress team!`,
    createdAt: '2026-09-23T11:30:00.000Z',
    actionItemsCount: 1,
    decisionsCount: 0,
    unresolvedCount: 1
  }
];

export const DEMO_ACTION_ITEMS: ActionItem[] = [
  {
    id: 'act-demo-001',
    demo_key: 'demo-m1-action-1',
    meetingId: 'meet-demo-001',
    meetingTitle: 'Project Planning Meeting',
    meetingDate: '2026-09-14',
    task: 'Complete database integration',
    owner: 'Rahul',
    deadline: 'Friday (2026-09-18)',
    status: 'COMPLETED',
    confidence: 0.98,
    evidenceText: 'Rahul completed the database integration.',
    linkedItemId: null,
    isAmbiguous: false,
    history: [
      {
        meetingId: 'meet-demo-001',
        meetingTitle: 'Project Planning Meeting',
        date: '2026-09-14',
        status: 'NEW',
        evidenceText: 'Rahul will complete the database integration by Friday.',
        note: 'Initial commitment created in Project Planning Meeting'
      },
      {
        meetingId: 'meet-demo-002',
        meetingTitle: 'Project Progress Review',
        date: '2026-09-18',
        status: 'CARRIED_OVER',
        evidenceText: 'Rahul has not completed the database integration yet.',
        note: 'Carried over due to foreign key multi-tenant constraints'
      },
      {
        meetingId: 'meet-demo-003',
        meetingTitle: 'Final Project Review',
        date: '2026-09-23',
        status: 'COMPLETED',
        evidenceText: 'Rahul completed the database integration.',
        note: 'Completed and verified in Final Project Review'
      }
    ],
    createdAt: '2026-09-14T10:05:00.000Z',
    updatedAt: '2026-09-23T11:02:00.000Z'
  },
  {
    id: 'act-demo-002',
    demo_key: 'demo-m1-action-2',
    meetingId: 'meet-demo-001',
    meetingTitle: 'Project Planning Meeting',
    meetingDate: '2026-09-14',
    task: 'Prepare UI design',
    owner: 'Priya',
    deadline: 'Monday (2026-09-21)',
    status: 'COMPLETED',
    confidence: 0.97,
    evidenceText: 'Priya completed the UI design.',
    linkedItemId: null,
    isAmbiguous: false,
    history: [
      {
        meetingId: 'meet-demo-001',
        meetingTitle: 'Project Planning Meeting',
        date: '2026-09-14',
        status: 'NEW',
        evidenceText: 'Priya will prepare the UI design by Monday.',
        note: 'Initial commitment in Project Planning Meeting'
      },
      {
        meetingId: 'meet-demo-002',
        meetingTitle: 'Project Progress Review',
        date: '2026-09-18',
        status: 'COMPLETED',
        evidenceText: 'Priya completed the UI design.',
        note: 'Completed ahead of Monday deadline'
      },
      {
        meetingId: 'meet-demo-003',
        meetingTitle: 'Final Project Review',
        date: '2026-09-23',
        status: 'COMPLETED',
        evidenceText: "Priya's UI design is complete.",
        note: 'Verified integrated into frontend dashboard'
      }
    ],
    createdAt: '2026-09-14T10:07:00.000Z',
    updatedAt: '2026-09-18T14:01:00.000Z'
  },
  {
    id: 'act-demo-003',
    demo_key: 'demo-m2-action-1',
    meetingId: 'meet-demo-002',
    meetingTitle: 'Project Progress Review',
    meetingDate: '2026-09-18',
    task: 'Execute automated API testing suite',
    owner: 'Marcus',
    deadline: '2026-09-30',
    status: 'CARRIED_OVER',
    confidence: 0.94,
    evidenceText: 'API testing is still pending. Marcus will carry over API test execution to next week.',
    linkedItemId: null,
    isAmbiguous: false,
    history: [
      {
        meetingId: 'meet-demo-002',
        meetingTitle: 'Project Progress Review',
        date: '2026-09-18',
        status: 'NEW',
        evidenceText: 'The team agreed that API testing should start after database integration.',
        note: 'Created following database sequencing decision'
      },
      {
        meetingId: 'meet-demo-003',
        meetingTitle: 'Final Project Review',
        date: '2026-09-23',
        status: 'CARRIED_OVER',
        evidenceText: 'API testing is still pending. Marcus will carry over API test execution to next week.',
        note: 'Carried over awaiting mock seed data'
      }
    ],
    createdAt: '2026-09-18T14:07:00.000Z',
    updatedAt: '2026-09-23T11:08:00.000Z'
  },
  {
    id: 'act-demo-004',
    demo_key: 'demo-m1-action-3',
    meetingId: 'meet-demo-001',
    meetingTitle: 'Project Planning Meeting',
    meetingDate: '2026-09-14',
    task: 'Review load testing benchmarks',
    owner: 'Marcus',
    deadline: 'Wednesday (2026-09-16)',
    status: 'OVERDUE',
    confidence: 0.91,
    evidenceText: 'Marcus will review the load testing benchmarks by Wednesday.',
    linkedItemId: null,
    isAmbiguous: false,
    history: [
      {
        meetingId: 'meet-demo-001',
        meetingTitle: 'Project Planning Meeting',
        date: '2026-09-14',
        status: 'NEW',
        evidenceText: 'Marcus will review the load testing benchmarks by Wednesday.',
        note: 'Original delivery committed for Wednesday 2026-09-16'
      },
      {
        meetingId: 'meet-demo-002',
        meetingTitle: 'Project Progress Review',
        date: '2026-09-18',
        status: 'OVERDUE',
        evidenceText: 'I was tied up debugging the staging cluster and could not finish the benchmarks.',
        note: 'Deadline passed on 2026-09-16 without delivery'
      }
    ],
    createdAt: '2026-09-14T10:12:00.000Z',
    updatedAt: '2026-09-18T14:10:00.000Z'
  },
  {
    id: 'act-demo-005',
    demo_key: 'demo-m3-action-1',
    meetingId: 'meet-demo-003',
    meetingTitle: 'Final Project Review',
    meetingDate: '2026-09-23',
    task: 'Configure staging deployment pipeline for continuous integration',
    owner: 'Rahul',
    deadline: '2026-10-06',
    status: 'NEW',
    confidence: 0.95,
    evidenceText: 'Rahul will configure the staging deployment pipeline for continuous integration by next Tuesday.',
    linkedItemId: null,
    isAmbiguous: false,
    history: [
      {
        meetingId: 'meet-demo-003',
        meetingTitle: 'Final Project Review',
        date: '2026-09-23',
        status: 'NEW',
        evidenceText: 'Rahul will configure the staging deployment pipeline for continuous integration by next Tuesday.',
        note: 'Created during Final Project Review'
      }
    ],
    createdAt: '2026-09-23T11:10:00.000Z',
    updatedAt: '2026-09-23T11:10:00.000Z'
  }
];

export const DEMO_DECISIONS: Decision[] = [
  {
    id: 'dec-demo-001',
    demo_key: 'demo-m1-decision-1',
    meetingId: 'meet-demo-001',
    meetingTitle: 'Project Planning Meeting',
    meetingDate: '2026-09-14',
    decision: 'Use PostgreSQL for the application database.',
    evidenceText: 'The team decided to use PostgreSQL for the application database.',
    createdAt: '2026-09-14T10:04:00.000Z'
  },
  {
    id: 'dec-demo-002',
    demo_key: 'demo-m2-decision-1',
    meetingId: 'meet-demo-002',
    meetingTitle: 'Project Progress Review',
    meetingDate: '2026-09-18',
    decision: 'API testing starts after database integration.',
    evidenceText: 'The team agreed that API testing should start after database integration.',
    createdAt: '2026-09-18T14:09:00.000Z'
  }
];

export const DEMO_UNRESOLVED: UnresolvedIssue[] = [
  {
    id: 'unres-demo-001',
    demo_key: 'demo-m1-unres-1',
    meetingId: 'meet-demo-001',
    meetingTitle: 'Project Planning Meeting',
    meetingDate: '2026-09-14',
    issue: 'API testing remains unresolved.',
    owner: 'Marcus',
    status: 'UNRESOLVED',
    evidenceText: 'The API testing remains unresolved.',
    appearances: [
      {
        meetingId: 'meet-demo-001',
        meetingTitle: 'Project Planning Meeting',
        date: '2026-09-14',
        evidenceText: 'The API testing remains unresolved.'
      },
      {
        meetingId: 'meet-demo-003',
        meetingTitle: 'Final Project Review',
        date: '2026-09-23',
        evidenceText: 'API testing is still pending.'
      }
    ],
    createdAt: '2026-09-14T10:09:00.000Z'
  }
];
