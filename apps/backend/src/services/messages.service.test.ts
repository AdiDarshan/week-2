import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConversationDto, MessageDto, UserDto } from '@week2/shared';
import {
  findConversationById,
  findUserById,
  insertMessage,
  listMessagesForConversation,
  touchConversationUpdatedAt,
} from '../data/store.js';
import {
  DEFAULT_MESSAGES_LIMIT,
  createMessage,
  getMessagesPage,
} from './messages.service.js';

vi.mock('../data/store.js', () => ({
  findUserById: vi.fn(),
  findConversationById: vi.fn(),
  listMessagesForConversation: vi.fn(),
  insertMessage: vi.fn(),
  touchConversationUpdatedAt: vi.fn(),
}));

const findUserByIdMock = vi.mocked(findUserById);
const findConversationByIdMock = vi.mocked(findConversationById);
const listMessagesForConversationMock = vi.mocked(listMessagesForConversation);
const insertMessageMock = vi.mocked(insertMessage);
const touchConversationUpdatedAtMock = vi.mocked(touchConversationUpdatedAt);

const alice: UserDto = { id: 'user-alice', name: 'Alice' };
const bob: UserDto = { id: 'user-bob', name: 'Bob' };
const eve: UserDto = { id: 'user-eve', name: 'Eve' };

const aliceAndBob: ConversationDto = {
  id: 'conv-ab',
  title: 'Alice & Bob',
  updatedAt: '2024-01-01T00:00:00.000Z',
  participantIds: [alice.id, bob.id],
};

function makeMessage(i: number): MessageDto {
  return {
    id: `msg-${i}`,
    conversationId: aliceAndBob.id,
    content: `message ${i}`,
    senderId: alice.id,
    createdAt: `2024-01-01T00:00:${String(i).padStart(2, '0')}.000Z`,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('getMessagesPage — authorization', () => {
  it('throws 404 NOT_FOUND when the requester is unknown', async () => {
    findUserByIdMock.mockReturnValue(undefined);

    await expect(
      getMessagesPage({ conversationId: aliceAndBob.id, requesterId: 'ghost' }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
    expect(findConversationByIdMock).not.toHaveBeenCalled();
  });

  it('throws 404 NOT_FOUND when the conversation is unknown', async () => {
    findUserByIdMock.mockReturnValue(alice);
    findConversationByIdMock.mockReturnValue(undefined);

    await expect(
      getMessagesPage({ conversationId: 'ghost-conv', requesterId: alice.id }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
    expect(listMessagesForConversationMock).not.toHaveBeenCalled();
  });

  it('throws 403 FORBIDDEN when the requester is not a participant', async () => {
    findUserByIdMock.mockReturnValue(eve);
    findConversationByIdMock.mockReturnValue(aliceAndBob);

    await expect(
      getMessagesPage({ conversationId: aliceAndBob.id, requesterId: eve.id }),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    expect(listMessagesForConversationMock).not.toHaveBeenCalled();
  });
});

describe('getMessagesPage — pagination', () => {
  beforeEach(() => {
    findUserByIdMock.mockReturnValue(alice);
    findConversationByIdMock.mockReturnValue(aliceAndBob);
  });

  it('returns the default-sized first page when no cursor or limit is given', async () => {
    const all = Array.from({ length: DEFAULT_MESSAGES_LIMIT + 5 }, (_, i) =>
      makeMessage(i),
    );
    listMessagesForConversationMock.mockReturnValue(all);

    const page = await getMessagesPage({
      conversationId: aliceAndBob.id,
      requesterId: alice.id,
    });

    expect(page.messages).toHaveLength(DEFAULT_MESSAGES_LIMIT);
    expect(page.messages).toEqual(all.slice(0, DEFAULT_MESSAGES_LIMIT));
    expect(page.nextCursor).toBe(String(DEFAULT_MESSAGES_LIMIT));
  });

  it('returns nextCursor=null when the page exhausts the conversation', async () => {
    const all = [makeMessage(0), makeMessage(1)];
    listMessagesForConversationMock.mockReturnValue(all);

    const page = await getMessagesPage({
      conversationId: aliceAndBob.id,
      requesterId: alice.id,
      limit: 5,
    });

    expect(page.messages).toEqual(all);
    expect(page.nextCursor).toBeNull();
  });

  it('returns nextCursor=null when exactly hitting the end on a page boundary', async () => {
    const all = [makeMessage(0), makeMessage(1), makeMessage(2), makeMessage(3)];
    listMessagesForConversationMock.mockReturnValue(all);

    const page = await getMessagesPage({
      conversationId: aliceAndBob.id,
      requesterId: alice.id,
      limit: 2,
      cursor: '2',
    });

    expect(page.messages).toEqual(all.slice(2));
    expect(page.nextCursor).toBeNull();
  });

  it('honours the cursor offset', async () => {
    const all = Array.from({ length: 5 }, (_, i) => makeMessage(i));
    listMessagesForConversationMock.mockReturnValue(all);

    const page = await getMessagesPage({
      conversationId: aliceAndBob.id,
      requesterId: alice.id,
      cursor: '2',
      limit: 2,
    });

    expect(page.messages).toEqual(all.slice(2, 4));
    expect(page.nextCursor).toBe('4');
  });

  it('returns an empty page when cursor exactly equals the list length', async () => {
    const all = [makeMessage(0), makeMessage(1)];
    listMessagesForConversationMock.mockReturnValue(all);

    const page = await getMessagesPage({
      conversationId: aliceAndBob.id,
      requesterId: alice.id,
      cursor: '2',
    });

    expect(page.messages).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });

  it('caps the limit at 100 even when callers ask for more', async () => {
    const all = Array.from({ length: 250 }, (_, i) => makeMessage(i));
    listMessagesForConversationMock.mockReturnValue(all);

    const page = await getMessagesPage({
      conversationId: aliceAndBob.id,
      requesterId: alice.id,
      limit: 5000,
    });

    expect(page.messages).toHaveLength(100);
    expect(page.nextCursor).toBe('100');
  });

  it('rejects non-integer / negative / non-numeric cursors with 400 BAD_REQUEST', async () => {
    listMessagesForConversationMock.mockReturnValue([]);

    for (const cursor of ['not-a-number', '-1', '1.5']) {
      await expect(
        getMessagesPage({
          conversationId: aliceAndBob.id,
          requesterId: alice.id,
          cursor,
        }),
      ).rejects.toMatchObject({ status: 400, code: 'BAD_REQUEST' });
    }
  });

  it('rejects zero, negative, or non-integer limits with 400 BAD_REQUEST', async () => {
    listMessagesForConversationMock.mockReturnValue([]);

    for (const limit of [0, -1, 1.5, Number.NaN]) {
      await expect(
        getMessagesPage({
          conversationId: aliceAndBob.id,
          requesterId: alice.id,
          limit,
        }),
      ).rejects.toMatchObject({ status: 400, code: 'BAD_REQUEST' });
    }
  });

  it('rejects a cursor that points past the end of the list', async () => {
    listMessagesForConversationMock.mockReturnValue([makeMessage(0)]);

    await expect(
      getMessagesPage({
        conversationId: aliceAndBob.id,
        requesterId: alice.id,
        cursor: '99',
      }),
    ).rejects.toMatchObject({ status: 400, code: 'BAD_REQUEST' });
  });
});

describe('createMessage — authorization', () => {
  it('throws 404 NOT_FOUND when the sender is unknown', async () => {
    findUserByIdMock.mockReturnValue(undefined);

    await expect(
      createMessage({
        conversationId: aliceAndBob.id,
        senderId: 'ghost',
        content: 'hi',
      }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
    expect(insertMessageMock).not.toHaveBeenCalled();
    expect(touchConversationUpdatedAtMock).not.toHaveBeenCalled();
  });

  it('throws 404 NOT_FOUND when the conversation is unknown', async () => {
    findUserByIdMock.mockReturnValue(alice);
    findConversationByIdMock.mockReturnValue(undefined);

    await expect(
      createMessage({
        conversationId: 'ghost-conv',
        senderId: alice.id,
        content: 'hi',
      }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
    expect(insertMessageMock).not.toHaveBeenCalled();
  });

  it('throws 403 FORBIDDEN when the sender is not a participant', async () => {
    findUserByIdMock.mockReturnValue(eve);
    findConversationByIdMock.mockReturnValue(aliceAndBob);

    await expect(
      createMessage({
        conversationId: aliceAndBob.id,
        senderId: eve.id,
        content: 'hi',
      }),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    expect(insertMessageMock).not.toHaveBeenCalled();
  });
});

describe('createMessage — content validation', () => {
  beforeEach(() => {
    findUserByIdMock.mockReturnValue(alice);
    findConversationByIdMock.mockReturnValue(aliceAndBob);
  });

  it('rejects empty or whitespace-only content with 400 BAD_REQUEST', async () => {
    for (const content of ['', '   ', '\n\t  \r']) {
      await expect(
        createMessage({
          conversationId: aliceAndBob.id,
          senderId: alice.id,
          content,
        }),
      ).rejects.toMatchObject({ status: 400, code: 'BAD_REQUEST' });
    }
    expect(insertMessageMock).not.toHaveBeenCalled();
  });

  it('rejects content longer than 4000 characters (after trim) with 400 BAD_REQUEST', async () => {
    await expect(
      createMessage({
        conversationId: aliceAndBob.id,
        senderId: alice.id,
        content: 'x'.repeat(4001),
      }),
    ).rejects.toMatchObject({ status: 400, code: 'BAD_REQUEST' });
    expect(insertMessageMock).not.toHaveBeenCalled();
  });

  it('accepts content exactly at the 4000 character limit', async () => {
    const content = 'x'.repeat(4000);

    const message = await createMessage({
      conversationId: aliceAndBob.id,
      senderId: alice.id,
      content,
    });

    expect(message.content).toHaveLength(4000);
    expect(insertMessageMock).toHaveBeenCalledOnce();
  });

  it('allows surrounding whitespace as long as the trimmed content is within range', async () => {
    const content = '   ' + 'x'.repeat(4000) + '   ';

    const message = await createMessage({
      conversationId: aliceAndBob.id,
      senderId: alice.id,
      content,
    });

    expect(message.content).toHaveLength(4000);
  });
});

describe('createMessage — persistence', () => {
  beforeEach(() => {
    findUserByIdMock.mockReturnValue(alice);
    findConversationByIdMock.mockReturnValue(aliceAndBob);
  });

  it('trims content, mints a UUID + ISO timestamp, and writes through to the store', async () => {
    const before = Date.now();

    const message = await createMessage({
      conversationId: aliceAndBob.id,
      senderId: alice.id,
      content: '   hello world   ',
    });

    const after = Date.now();

    expect(message.content).toBe('hello world');
    expect(message.conversationId).toBe(aliceAndBob.id);
    expect(message.senderId).toBe(alice.id);
    expect(message.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    const createdAtMs = Date.parse(message.createdAt);
    expect(Number.isNaN(createdAtMs)).toBe(false);
    expect(createdAtMs).toBeGreaterThanOrEqual(before);
    expect(createdAtMs).toBeLessThanOrEqual(after);

    expect(insertMessageMock).toHaveBeenCalledOnce();
    expect(insertMessageMock).toHaveBeenCalledWith(message);
    expect(touchConversationUpdatedAtMock).toHaveBeenCalledOnce();
    expect(touchConversationUpdatedAtMock).toHaveBeenCalledWith(
      aliceAndBob.id,
      message.createdAt,
    );
  });

  it('uses the conversation id from the store, not the raw input id', async () => {
    const otherIdConv: ConversationDto = {
      ...aliceAndBob,
      id: 'real-conv-id',
    };
    findConversationByIdMock.mockReturnValue(otherIdConv);

    const message = await createMessage({
      conversationId: 'whatever-the-caller-passed',
      senderId: alice.id,
      content: 'hi',
    });

    expect(message.conversationId).toBe('real-conv-id');
    expect(touchConversationUpdatedAtMock).toHaveBeenCalledWith(
      'real-conv-id',
      message.createdAt,
    );
  });
});
