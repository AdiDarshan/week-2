import { useState } from "react";
import { ConversationsList } from "./ConversationsList";
import { ChatPane } from "./ChatPane";
import { LoginScreen } from "./LoginScreen";
import { UserBadge } from "./UserBadge";
import { useAuth } from "../hooks/useAuth";
import { ConversationsProvider } from "../hooks/useConversations";

export function App() {
    const { auth, userId } = useAuth();

    if (!auth) {
        return <LoginScreen />;
    }

    return (
        <ConversationsProvider key={userId}>
            <AuthenticatedApp />
        </ConversationsProvider>
    );
}

function AuthenticatedApp() {
    const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();

    return (
        <div className="app-shell">
            <UserBadge />
            <div className="app">
                <ConversationsList onConversationSelected={setSelectedConversationId} />
                <ChatPane selectedConversationId={selectedConversationId} />
            </div>
        </div>
    );
}
