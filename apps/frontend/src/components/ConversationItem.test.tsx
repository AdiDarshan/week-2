import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversationItem } from './ConversationItem';
import type { Conversation } from '../api/types';

const CONVERSATION_ID = 'c0c0c0c0-c0c0-4c0c-8c0c-cccccccc0042';
const PARTICIPANT_ID = 'a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa00ad';

const conversation: Conversation = {
  id: CONVERSATION_ID,
  title: 'Project discussion',
  type: 'human',
  updatedAt: new Date('2024-05-02T15:30:00Z'),
  participantIds: [PARTICIPANT_ID],
};

function renderItem(
  overrides: Partial<React.ComponentProps<typeof ConversationItem>> = {},
) {
  const onSelect = overrides.onSelect ?? vi.fn();
  render(
    <ul>
      <ConversationItem
        conversation={overrides.conversation ?? conversation}
        onSelect={onSelect}
      />
    </ul>,
  );
  return { onSelect };
}

describe('<ConversationItem />', () => {
  it('renders the conversation title', () => {
    renderItem();
    expect(screen.getByText('Project discussion')).toBeInTheDocument();
  });

  it('renders as a list item', () => {
    renderItem();
    expect(screen.getByRole('listitem')).toHaveTextContent('Project discussion');
  });

  it('does not call onSelect on mount', () => {
    const { onSelect } = renderItem();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('calls onSelect with the conversation id when clicked', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderItem();

    await user.click(screen.getByText('Project discussion'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(CONVERSATION_ID);
  });

  it('passes its own conversation id to onSelect when multiple items are rendered', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const other: Conversation = {
      ...conversation,
      id: 'c0c0c0c0-c0c0-4c0c-8c0c-cccccccc0099',
      title: 'Other chat',
    };

    render(
      <ul>
        <ConversationItem conversation={conversation} onSelect={onSelect} />
        <ConversationItem conversation={other} onSelect={onSelect} />
      </ul>,
    );

    await user.click(screen.getByText('Other chat'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(other.id);
  });
});
