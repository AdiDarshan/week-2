import { useState } from "react";
import { ConversationsList } from "./ConversationsList";
import { ChatPane } from "./ChatPane";
import { KnowledgeBase } from "./KnowledgeBase";
import { LoginScreen } from "./LoginScreen";
import { UserBadge } from "./UserBadge";
import { useAuth } from "../hooks/useAuth";
import { ConversationsProvider, useConversations } from "../hooks/useConversations";
import { TUTOR_CONVERSATION_TYPE } from "../api/constants";

export function App() {
    const { auth } = useAuth();

    if (!auth) {
        return <LoginScreen />;
    }

    return (
        <ConversationsProvider key={auth.user.id}>
            <AuthenticatedApp />
        </ConversationsProvider>
    );
}

function AuthenticatedApp() {
    const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
    const { conversations } = useConversations();

    const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

    return (
        <div className="app-shell">
            <UserBadge />
            <div className="app">
                <ConversationsList onConversationSelected={setSelectedConversationId} />
                <ChatPane selectedConversationId={selectedConversationId} />
                {selectedConversation?.type === TUTOR_CONVERSATION_TYPE && (
                    <KnowledgeBase conversationId={selectedConversation.id} />
                )}
            </div>
        </div>
    );
}
