import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessagesList } from './MessagesList';
import { AuthProvider } from '../hooks/useAuth';
import type { MessagesState } from '../hooks/messagesReducer';
import type { Message } from '../api/types';

const ALICE_ID = 'a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0001';
const BOB_ID = 'a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0002';
const CONVERSATION_ID = 'c0c0c0c0-c0c0-4c0c-8c0c-cccccccc0001';

const aliceAuth = {
  token: 'test-token',
  user: { id: ALICE_ID, name: 'Alice' },
};

const emptyState: MessagesState = {
  messages: [],
  isLoading: false,
  error: null,
};

const populatedState: MessagesState = {
  messages: [
    {
      id: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee0001',
      conversationId: CONVERSATION_ID,
      content: 'Hello',
      senderId: ALICE_ID,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      isPending: false,
    },
    {
      id: 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee0002',
      conversationId: CONVERSATION_ID,
      content: 'Hi back',
      senderId: BOB_ID,
      createdAt: new Date('2024-01-01T00:01:00Z'),
      isPending: false,
    },
  ] satisfies Message[],
  isLoading: false,
  error: null,
};

function renderList(props: {
  selectedConversationId: string | undefined;
  messagesState: MessagesState;
}) {
  return render(
    <AuthProvider initialAuth={aliceAuth}>
      <MessagesList
        selectedConversationId={props.selectedConversationId}
        messagesState={props.messagesState}
      />
    </AuthProvider>,
  );
}

describe('<MessagesList />', () => {
  it('shows the "select a conversation" placeholder when no conversation is selected', () => {
    renderList({ selectedConversationId: undefined, messagesState: emptyState });

    expect(
      screen.getByText('Select a conversation to view messages.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows the loading placeholder while messages are being fetched', () => {
    renderList({
      selectedConversationId: CONVERSATION_ID,
      messagesState: { messages: [], isLoading: true, error: null },
    });

    expect(screen.getByText('Loading messages...')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows the error placeholder when fetching fails', () => {
    renderList({
      selectedConversationId: CONVERSATION_ID,
      messagesState: {
        messages: [],
        isLoading: false,
        error: new Error('network down'),
      },
    });

    expect(screen.getByText('Could not load messages.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows the empty placeholder when the conversation has no messages', () => {
    renderList({
      selectedConversationId: CONVERSATION_ID,
      messagesState: emptyState,
    });

    expect(screen.getByText('No messages yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders all messages for the selected conversation', () => {
    renderList({
      selectedConversationId: CONVERSATION_ID,
      messagesState: populatedState,
    });

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi back')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders an optimistic (pending) message alongside confirmed ones', () => {
    const pending: Message = {
      id: '11111111-1111-4111-8111-111111111111',
      conversationId: CONVERSATION_ID,
      content: 'sending…',
      senderId: ALICE_ID,
      createdAt: new Date('2024-01-01T00:02:00Z'),
      isPending: true,
    };

    renderList({
      selectedConversationId: CONVERSATION_ID,
      messagesState: {
        ...populatedState,
        messages: [...populatedState.messages, pending],
      },
    });

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    const pendingItem = screen.getByText('sending…');
    expect(pendingItem).toHaveClass('pending');
    expect(pendingItem).toHaveAttribute('data-role', 'self');
  });
});
