import type { Conversation, Message, User } from './types';

// Stable UUIDs for mock data. The patterns ('a0a0…' for actors, 'c0c0…' for
// conversations, 'e0e0…' for events/messages) are arbitrary but make ids
// easy to identify when debugging. The real backend will return real v4 UUIDs.
export const USER_IDS = {
  alice: 'a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0001',
  bob: 'a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0002',
  charlie: 'a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0003',
  support: 'a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0004',
} as const;

export const CONVERSATION_IDS = {
  aliceAndBob: 'c0c0c0c0-c0c0-4c0c-8c0c-cccccccc0001',
  aliceAndSupport: 'c0c0c0c0-c0c0-4c0c-8c0c-cccccccc0002',
  bobAndSupport: 'c0c0c0c0-c0c0-4c0c-8c0c-cccccccc0003',
  aliceAndCharlie: 'c0c0c0c0-c0c0-4c0c-8c0c-cccccccc0004',
  bobAndCharlie: 'c0c0c0c0-c0c0-4c0c-8c0c-cccccccc0005',
} as const;

export const MESSAGE_IDS = {
  m1: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee0001',
  m2: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee0002',
  m3: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee0003',
  m4: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee0004',
  m5: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee0005',
  m6: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee0006',
  m7: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee0007',
  m8: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee0008',
} as const;

export const KNOWN_USERS: User[] = [
  { id: USER_IDS.alice, username: 'alice', name: 'Alice' },
  { id: USER_IDS.bob, username: 'bob', name: 'Bob' },
  { id: USER_IDS.charlie, username: 'charlie', name: 'Charlie' },
];

// Exported as mutable arrays because the mock `sendMessage` pushes new
// messages and bumps `updatedAt` on the corresponding conversation.
export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: CONVERSATION_IDS.aliceAndBob,
    title: 'Alice & Bob',
    updatedAt: new Date('2024-05-03T09:00:00Z'),
    participantIds: [USER_IDS.alice, USER_IDS.bob],
  },
  {
    id: CONVERSATION_IDS.aliceAndSupport,
    title: 'Alice & Support',
    updatedAt: new Date('2024-05-02T15:30:00Z'),
    participantIds: [USER_IDS.alice, USER_IDS.support],
  },
  {
    id: CONVERSATION_IDS.bobAndSupport,
    title: 'Bob & Support',
    updatedAt: new Date('2024-05-01T10:00:00Z'),
    participantIds: [USER_IDS.bob, USER_IDS.support],
  },
  {
    id: CONVERSATION_IDS.aliceAndCharlie,
    title: 'Alice & Charlie',
    updatedAt: new Date('2024-05-04T11:00:00Z'),
    participantIds: [USER_IDS.alice, USER_IDS.charlie],
  },
  {
    id: CONVERSATION_IDS.bobAndCharlie,
    title: 'Bob & Charlie',
    updatedAt: new Date('2024-05-04T12:00:00Z'),
    participantIds: [USER_IDS.bob, USER_IDS.charlie],
  },
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: MESSAGE_IDS.m1,
    conversationId: CONVERSATION_IDS.aliceAndBob,
    content: 'Hey Bob, are we still on for tomorrow?',
    senderId: USER_IDS.alice,
    createdAt: new Date('2024-05-03T09:00:00Z'),
    isPending: false,
  },
  {
    id: MESSAGE_IDS.m2,
    conversationId: CONVERSATION_IDS.aliceAndBob,
    content: 'Yes! See you at 10.',
    senderId: USER_IDS.bob,
    createdAt: new Date('2024-05-03T09:01:00Z'),
    isPending: false,
  },
  {
    id: MESSAGE_IDS.m3,
    conversationId: CONVERSATION_IDS.aliceAndSupport,
    content: 'Hi Alice, how can we help?',
    senderId: USER_IDS.support,
    createdAt: new Date('2024-05-02T15:30:00Z'),
    isPending: false,
  },
  {
    id: MESSAGE_IDS.m4,
    conversationId: CONVERSATION_IDS.bobAndSupport,
    content: 'Hi Bob, how can we help?',
    senderId: USER_IDS.support,
    createdAt: new Date('2024-05-01T10:00:00Z'),
    isPending: false,
  },
  {
    id: MESSAGE_IDS.m5,
    conversationId: CONVERSATION_IDS.aliceAndCharlie,
    content: 'Charlie, did you push the changes?',
    senderId: USER_IDS.alice,
    createdAt: new Date('2024-05-04T11:00:00Z'),
    isPending: false,
  },
  {
    id: MESSAGE_IDS.m6,
    conversationId: CONVERSATION_IDS.aliceAndCharlie,
    content: 'Just did — ready for review.',
    senderId: USER_IDS.charlie,
    createdAt: new Date('2024-05-04T11:01:00Z'),
    isPending: false,
  },
  {
    id: MESSAGE_IDS.m7,
    conversationId: CONVERSATION_IDS.bobAndCharlie,
    content: 'Lunch tomorrow?',
    senderId: USER_IDS.charlie,
    createdAt: new Date('2024-05-04T12:00:00Z'),
    isPending: false,
  },
  {
    id: MESSAGE_IDS.m8,
    conversationId: CONVERSATION_IDS.bobAndCharlie,
    content: 'Sounds good.',
    senderId: USER_IDS.bob,
    createdAt: new Date('2024-05-04T12:01:00Z'),
    isPending: false,
  },
];
