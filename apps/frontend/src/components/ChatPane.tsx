import { MessageComposer } from "./MessageComposer";
import { MessagesList } from "./MessagesList";
import { useMessages } from "../hooks/useMessages";

type ChatPaneProps = {
    selectedConversationId: string | undefined;
};

export function ChatPane({ selectedConversationId }: ChatPaneProps) {
    const { state, messagesDispatch } = useMessages(selectedConversationId);

    const canSend =
        selectedConversationId !== undefined && !state.isLoading && !state.error;

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
                />
            )}
        </div>
    );
}
