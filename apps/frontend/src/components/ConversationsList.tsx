import { useConversations } from '../hooks/useConversations';
import { ConversationItem } from './ConversationItem';

type ConversationsListProps = {
  onConversationSelected: (conversationId: string) => void;
};

export function ConversationsList({ onConversationSelected }: ConversationsListProps) {
  const { conversations, isLoading, error } = useConversations();

  return (
    <aside className="conversations">
      <h2 className="conversations-title">Conversations</h2>

      {isLoading && <div className="placeholder">Loading conversations...</div>}
      {error && <div className="placeholder">Something went wrong.</div>}
      {!isLoading && !error && conversations.length === 0 && (
        <div className="placeholder">No conversations yet.</div>
      )}

      {!isLoading && !error && conversations.length > 0 && (
        <ul>
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              onSelect={onConversationSelected}
            />
          ))}
        </ul>
      )}

      
    </aside>
  );
}
