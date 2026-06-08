import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageItem } from './MessageItem';
import { AuthProvider } from '../hooks/useAuth';
import type { Message } from '../api/types';

const ALICE_ID = 'a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0001';
const CONVERSATION_ID = 'c0c0c0c0-c0c0-4c0c-8c0c-cccccccc0001';
const MESSAGE_ID = 'e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee0001';

const pendingMessage: Message = {
  id: MESSAGE_ID,
  conversationId: CONVERSATION_ID,
  content: 'Hello there',
  senderId: ALICE_ID,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  isPending: true,
};

const aliceAuth = {
  token: 'test-token',
  user: { id: ALICE_ID, name: 'Alice' },
};

describe('<MessageItem />', () => {
  it('renders the content and marks own messages with data-role="self" and the pending class', () => {
    render(
      <AuthProvider initialAuth={aliceAuth}>
        <ul>
          <MessageItem message={pendingMessage} />
        </ul>
      </AuthProvider>,
    );

    const item = screen.getByText('Hello there');
    expect(item).toBeInTheDocument();
    expect(item).toHaveClass('pending');
    expect(item).toHaveAttribute('data-role', 'self');
  });
});
