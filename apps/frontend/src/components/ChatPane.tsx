import { MessageComposer } from './MessageComposer';
import { MessagesList } from './MessagesList';
import { useMessages } from '../hooks/useMessages';
import { useConversations } from '../hooks/useConversations';

type ChatPaneProps = {
  selectedConversationId: string | undefined;
};

export function ChatPane({ selectedConversationId }: ChatPaneProps) {
  const { state, messagesDispatch } = useMessages(selectedConversationId);
  const { conversations } = useConversations();

  const conversation = conversations.find((c) => c.id === selectedConversationId);
  const isAssistant = conversation?.type === 'assistant';
  const canSend = selectedConversationId !== undefined && !state.isLoading && !state.error;

  return (
    <div className="messages-pane">
      <MessagesList
        selectedConversationId={selectedConversationId}
        messagesState={state}
      />
      {canSend && (
        <MessageComposer
          conversationId={selectedConversationId}
          dispatch={messagesDispatch}
          isAssistant={isAssistant}
        />
      )}
    </div>
  );
}
