import { MessageComposer } from './MessageComposer';
import { MessagesList } from './MessagesList';
import { useMessages } from '../hooks/useMessages';
import { useConversations } from '../hooks/useConversations';
import { TUTOR_CONVERSATION_TYPE } from '../api/constants';

type ChatPaneProps = {
  selectedConversationId: string | undefined;
};

export function ChatPane({ selectedConversationId }: ChatPaneProps) {
  const { state, messagesDispatch } = useMessages(selectedConversationId);
  const { conversations } = useConversations();

  const conversation = conversations.find((c) => c.id === selectedConversationId);
  // Both AI conversation types stream their reply through /chat/ai/stream.
  const isAssistant =
    conversation?.type === 'assistant' ||
    conversation?.type === TUTOR_CONVERSATION_TYPE;
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
