import { describe, it, expect } from 'vitest';
import type { Message } from '../api/types';
import { messagesReducer, type MessagesState } from './messagesReducer';

const ALICE_ID = 'a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0001';
const CONVERSATION_ID = 'c0c0c0c0-c0c0-4c0c-8c0c-cccccccc0001';

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee0001',
    conversationId: CONVERSATION_ID,
    content: 'Hello',
    senderId: ALICE_ID,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    isPending: false,
    ...overrides,
  };
}

const initialState: MessagesState = {
  messages: [],
  isLoading: false,
  error: null,
};

describe('messagesReducer', () => {
  it('LOAD_START sets loading and clears any previous error', () => {
    const stateWithError: MessagesState = {
      messages: [makeMessage()],
      isLoading: false,
      error: new Error('previous failure'),
    };

    const next = messagesReducer(stateWithError, { type: 'LOAD_START' });

    expect(next.isLoading).toBe(true);
    expect(next.error).toBeNull();
    expect(next.messages).toBe(stateWithError.messages);
  });

  it('LOAD_SUCCESS replaces messages and clears loading/error', () => {
    const loadingState: MessagesState = {
      messages: [],
      isLoading: true,
      error: new Error('previous'),
    };
    const loaded = [
      makeMessage({ id: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee000a' }),
      makeMessage({ id: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee000b' }),
    ];

    const next = messagesReducer(loadingState, {
      type: 'LOAD_SUCCESS',
      payload: loaded,
    });

    expect(next.messages).toEqual(loaded);
    expect(next.isLoading).toBe(false);
    expect(next.error).toBeNull();
  });

  it('LOAD_ERROR stores the error and clears loading without touching messages', () => {
    const existing = [makeMessage()];
    const loadingState: MessagesState = {
      messages: existing,
      isLoading: true,
      error: null,
    };
    const failure = new Error('network down');

    const next = messagesReducer(loadingState, {
      type: 'LOAD_ERROR',
      payload: failure,
    });

    expect(next.error).toBe(failure);
    expect(next.isLoading).toBe(false);
    expect(next.messages).toBe(existing);
  });

  it('ADD_OPTIMISTIC appends the message to the end of the list', () => {
    const existing = makeMessage({ id: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee000a' });
    const stateWithMessage: MessagesState = {
      ...initialState,
      messages: [existing],
    };
    const optimistic = makeMessage({
      id: '11111111-1111-4111-8111-111111111111',
      content: 'pending message',
      isPending: true,
    });

    const next = messagesReducer(stateWithMessage, {
      type: 'ADD_OPTIMISTIC',
      payload: optimistic,
    });

    expect(next.messages).toEqual([existing, optimistic]);
  });

  it('CONFIRM_MESSAGE swaps the optimistic message for the real one', () => {
    const TEMP_ID = '11111111-1111-4111-8111-111111111111';
    const REAL_ID = '22222222-2222-4222-8222-222222222222';
    const optimistic = makeMessage({ id: TEMP_ID, isPending: true });
    const stateWithPending: MessagesState = {
      ...initialState,
      messages: [optimistic],
    };
    const real = makeMessage({ id: REAL_ID });

    const next = messagesReducer(stateWithPending, {
      type: 'CONFIRM_MESSAGE',
      payload: { tempId: TEMP_ID, realMessage: real },
    });

    expect(next.messages).toEqual([real]);
  });

  it('REMOVE_MESSAGE drops the message with the matching id and leaves the rest', () => {
    const keptA = makeMessage({ id: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee000a' });
    const removed = makeMessage({ id: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee000b' });
    const keptB = makeMessage({ id: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee000c' });
    const stateWithMessages: MessagesState = {
      ...initialState,
      messages: [keptA, removed, keptB],
    };

    const next = messagesReducer(stateWithMessages, {
      type: 'REMOVE_MESSAGE',
      payload: { id: removed.id },
    });

    expect(next.messages).toEqual([keptA, keptB]);
  });
});
