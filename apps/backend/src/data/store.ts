
import type { ConversationDto, MessageDto, UserDto } from '@week2/shared';

const USER_IDS = {
  alice: 'a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0001',
  bob: 'a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0002',
  charlie: 'a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0003',
  support: 'a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0004',
} as const;

const CONVERSATION_IDS = {
  aliceAndBob: 'c0c0c0c0-c0c0-4c0c-8c0c-cccccccc0001',
  aliceAndSupport: 'c0c0c0c0-c0c0-4c0c-8c0c-cccccccc0002',
  bobAndSupport: 'c0c0c0c0-c0c0-4c0c-8c0c-cccccccc0003',
  aliceAndCharlie: 'c0c0c0c0-c0c0-4c0c-8c0c-cccccccc0004',
  bobAndCharlie: 'c0c0c0c0-c0c0-4c0c-8c0c-cccccccc0005',
} as const;

export const KNOWN_USERS: UserDto[] = [
  { id: USER_IDS.alice, name: 'Alice' },
  { id: USER_IDS.bob, name: 'Bob' },
  { id: USER_IDS.charlie, name: 'Charlie' },
  { id: USER_IDS.support, name: 'Support' },
];

export function findUserById(id: string): UserDto | undefined {
  return KNOWN_USERS.find((user) => user.id === id);
}

export function findUserByUsername(username: string): UserDto | undefined {
  const handle = username.trim().toLowerCase();
  if (handle === '') {
    return undefined;
  }
  return KNOWN_USERS.find((user) => user.name.toLowerCase() === handle);
}

const CONVERSATIONS = new Map<string, ConversationDto>([
  [
    CONVERSATION_IDS.aliceAndBob,
    {
      id: CONVERSATION_IDS.aliceAndBob,
      title: 'Alice & Bob',
      updatedAt: '2024-05-03T09:00:00.000Z',
      participantIds: [USER_IDS.alice, USER_IDS.bob],
    },
  ],
  [
    CONVERSATION_IDS.aliceAndSupport,
    {
      id: CONVERSATION_IDS.aliceAndSupport,
      title: 'Alice & Support',
      updatedAt: '2024-05-02T15:30:00.000Z',
      participantIds: [USER_IDS.alice, USER_IDS.support],
    },
  ],
  [
    CONVERSATION_IDS.bobAndSupport,
    {
      id: CONVERSATION_IDS.bobAndSupport,
      title: 'Bob & Support',
      updatedAt: '2024-05-01T10:00:00.000Z',
      participantIds: [USER_IDS.bob, USER_IDS.support],
    },
  ],
  [
    CONVERSATION_IDS.aliceAndCharlie,
    {
      id: CONVERSATION_IDS.aliceAndCharlie,
      title: 'Alice & Charlie',
      updatedAt: '2024-05-04T11:00:00.000Z',
      participantIds: [USER_IDS.alice, USER_IDS.charlie],
    },
  ],
  [
    CONVERSATION_IDS.bobAndCharlie,
    {
      id: CONVERSATION_IDS.bobAndCharlie,
      title: 'Bob & Charlie',
      updatedAt: '2024-05-04T12:00:00.000Z',
      participantIds: [USER_IDS.bob, USER_IDS.charlie],
    },
  ],
]);

const MESSAGES: MessageDto[] = [
  {
    id: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee0001',
    conversationId: CONVERSATION_IDS.aliceAndBob,
    content: 'Hey Bob, are we still on for tomorrow?',
    senderId: USER_IDS.alice,
    createdAt: '2024-05-03T09:00:00.000Z',
  },
  {
    id: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee0002',
    conversationId: CONVERSATION_IDS.aliceAndBob,
    content: 'Yes! See you at 10.',
    senderId: USER_IDS.bob,
    createdAt: '2024-05-03T09:01:00.000Z',
  },
  {
    id: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee0003',
    conversationId: CONVERSATION_IDS.aliceAndSupport,
    content: 'Hi Alice, how can we help?',
    senderId: USER_IDS.support,
    createdAt: '2024-05-02T15:30:00.000Z',
  },
  {
    id: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee0004',
    conversationId: CONVERSATION_IDS.bobAndSupport,
    content: 'Hi Bob, how can we help?',
    senderId: USER_IDS.support,
    createdAt: '2024-05-01T10:00:00.000Z',
  },
  {
    id: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee0005',
    conversationId: CONVERSATION_IDS.aliceAndCharlie,
    content: 'Charlie, did you push the changes?',
    senderId: USER_IDS.alice,
    createdAt: '2024-05-04T11:00:00.000Z',
  },
  {
    id: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee0006',
    conversationId: CONVERSATION_IDS.aliceAndCharlie,
    content: 'Just did — ready for review.',
    senderId: USER_IDS.charlie,
    createdAt: '2024-05-04T11:01:00.000Z',
  },
  {
    id: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee0007',
    conversationId: CONVERSATION_IDS.bobAndCharlie,
    content: 'Lunch tomorrow?',
    senderId: USER_IDS.charlie,
    createdAt: '2024-05-04T12:00:00.000Z',
  },
  {
    id: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee0008',
    conversationId: CONVERSATION_IDS.bobAndCharlie,
    content: 'Sounds good.',
    senderId: USER_IDS.bob,
    createdAt: '2024-05-04T12:01:00.000Z',
  },
];

export function listConversationsForUser(userId: string): ConversationDto[] {
  const result: ConversationDto[] = [];
  for (const conversation of CONVERSATIONS.values()) {
    if (conversation.participantIds.includes(userId)) {
      result.push(conversation);
    }
  }
  result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return result;
}

export function findConversationById(id: string): ConversationDto | undefined {
  return CONVERSATIONS.get(id);
}

export function insertConversation(conversation: ConversationDto): void {
  CONVERSATIONS.set(conversation.id, conversation);
}

export function listMessagesForConversation(
  conversationId: string,
): MessageDto[] {
  return MESSAGES
    .filter((message) => message.conversationId === conversationId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function insertMessage(message: MessageDto): void {
  MESSAGES.push(message);
}

export function touchConversationUpdatedAt(
  conversationId: string,
  updatedAt: string,
): void {
  const conversation = CONVERSATIONS.get(conversationId);
  if (conversation) {
    conversation.updatedAt = updatedAt;
  }
}
