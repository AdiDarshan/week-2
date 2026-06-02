import type { Conversation } from '../api/types';

type ConversationItemProps = {
  conversation: Conversation;
  onSelect: (conversationId: string) => void;
};

export function ConversationItem({ conversation, onSelect }: ConversationItemProps) {
  return (
    <li onClick={() => onSelect(conversation.id)}>
      {conversation.title}
    </li>
  );
}
