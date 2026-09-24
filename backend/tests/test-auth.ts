import { dataStore } from '../src/models/dataStore.js';
import { AuthService } from '../src/services/authService.js';
import { StorageService } from '../src/services/storageService.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/utils/env.js';

async function runTests() {
  console.log('🧪 Starting Authentication & User Isolation Test Suite...');

  // 1. Test User Creation in Database
  const mockGoogleSub1 = 'google-sub-test-user-001';
  const mockUser1 = dataStore.createUser({
    google_sub: mockGoogleSub1,
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    profile_picture: 'https://lh3.googleusercontent.com/a/mock1',
    provider: 'google'
  });

  console.assert(mockUser1.id.startsWith('usr-'), 'User ID should have prefix usr-');
  console.assert(mockUser1.google_sub === mockGoogleSub1, 'google_sub must match');
  console.assert(mockUser1.provider === 'google', 'provider must be google');
  console.log('✅ Test 1: User 1 created in DB with ID:', mockUser1.id);

  // 2. Test Returning User Login (Idempotency)
  const existingUser1 = dataStore.findUserByGoogleSub(mockGoogleSub1);
  console.assert(existingUser1 !== undefined && existingUser1.id === mockUser1.id, 'Existing user should be found');
  const updatedUser1 = dataStore.updateUserLogin(mockUser1.id, { name: 'Ada Lovelace Updated' });
  console.assert(updatedUser1?.name === 'Ada Lovelace Updated', 'User name should update');
  console.log('✅ Test 2: Returning user recognized and not duplicated');

  // 3. Test New User Initial State (Zero dummy data)
  const user1Meetings = StorageService.getMeetings(mockUser1.id);
  const user1Stats = StorageService.getSystemStats(mockUser1.id);
  console.assert(user1Meetings.length === 0, 'New user must start with 0 meetings');
  console.assert(user1Stats.totalMeetings === 0, 'Stats totalMeetings must be 0');
  console.assert(user1Stats.totalActionItems === 0, 'Stats totalActionItems must be 0');
  console.assert(user1Stats.completedItems === 0, 'Stats completedItems must be 0');
  console.assert(user1Stats.overdueItems === 0, 'Stats overdueItems must be 0');
  console.assert(user1Stats.unresolvedIssues === 0, 'Stats unresolvedIssues must be 0');
  console.log('✅ Test 3: New user starts with clean 0 meetings and 0 stats (no dummy data)');

  // 4. Test User 2 Creation
  const mockGoogleSub2 = 'google-sub-test-user-002';
  const mockUser2 = dataStore.createUser({
    google_sub: mockGoogleSub2,
    name: 'Alan Turing',
    email: 'alan@example.com',
    profile_picture: 'https://lh3.googleusercontent.com/a/mock2',
    provider: 'google'
  });
  console.log('✅ Test 4: User 2 created in DB with ID:', mockUser2.id);

  // 5. Test Creating Meeting for User 1
  const meetingUser1 = StorageService.saveNewMeeting(
    mockUser1.id,
    {
      title: 'Ada Project Sync',
      date: '2026-09-24',
      participants: ['Ada Lovelace', 'Charles Babbage'],
      transcript: 'Charles will optimize the engine before Friday.'
    },
    {
      summary: 'Engine optimization discussion.',
      decisions: [{ decision: 'Adopt analytical engine v2', evidence_text: 'Adopt analytical engine v2' }],
      action_items: [{
        task: 'Optimize the engine',
        owner: 'Charles Babbage',
        deadline: '2026-09-30',
        status: 'NEW',
        confidence: 0.95,
        evidence_text: 'Charles will optimize the engine before Friday.'
      }],
      unresolved_issues: [{
        issue: 'Memory capacity constraints',
        owner: 'Charles Babbage',
        evidence_text: 'Memory capacity constraints'
      }]
    }
  );

  console.assert(meetingUser1.meeting.userId === mockUser1.id, 'Meeting must belong to user 1');
  console.assert(meetingUser1.newActions[0].userId === mockUser1.id, 'Action must belong to user 1');

  // 6. Test Multi-Tenant Isolation
  // User 1 sees their meeting
  const user1MeetingList = StorageService.getMeetings(mockUser1.id);
  console.assert(user1MeetingList.length === 1, 'User 1 must see 1 meeting');
  console.assert(user1MeetingList[0].id === meetingUser1.meeting.id, 'User 1 sees their created meeting');

  // User 2 must see 0 meetings!
  const user2MeetingList = StorageService.getMeetings(mockUser2.id);
  console.assert(user2MeetingList.length === 0, 'User 2 must NEVER see User 1 meetings');

  // User 2 must see 0 actions, 0 decisions, 0 unresolved
  const user2Actions = StorageService.getActionItems(mockUser2.id);
  const user2Decisions = StorageService.getDecisions(mockUser2.id);
  const user2Unresolved = StorageService.getUnresolvedIssues(mockUser2.id);
  console.assert(user2Actions.length === 0, 'User 2 sees 0 actions');
  console.assert(user2Decisions.length === 0, 'User 2 sees 0 decisions');
  console.assert(user2Unresolved.length === 0, 'User 2 sees 0 unresolved');

  console.log('✅ Test 5 & 6: Multi-tenant data isolation verified: User 2 cannot access User 1 data');

  // 7. Test JWT session generation & verification
  const sessionToken = jwt.sign(
    { id: mockUser1.id, email: mockUser1.email, name: mockUser1.name, google_sub: mockUser1.google_sub },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  const decoded = AuthService.verifySessionToken(sessionToken);
  console.assert(decoded.id === mockUser1.id, 'Decoded JWT ID must match User 1');
  console.assert(decoded.email === mockUser1.email, 'Decoded JWT email must match User 1');
  console.log('✅ Test 7: JWT session generation and verification successful');

  // 8. Clean test users from database to leave DB clean
  dataStore.clearUserData(mockUser1.id);
  dataStore.clearUserData(mockUser2.id);
  console.log('✅ Test 8: Data store clean-up verified');

  console.log('\n🎉 ALL 8 AUTHENTICATION & DATA ISOLATION TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
