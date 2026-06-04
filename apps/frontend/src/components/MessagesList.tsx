import { useEffect, useRef } from 'react';
import type { MessagesState } from '../hooks/messagesReducer';
import { MessageItem } from './MessageItem';

type MessagesListProps = {
    selectedConversationId: string | undefined;
    messagesState: MessagesState;
};

export function MessagesList({
    selectedConversationId,
    messagesState
}: MessagesListProps) {
    const { messages, isLoading, error } = messagesState;
    const listRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        const list = listRef.current;
        if (list) {
            list.scrollTop = list.scrollHeight;
        }
    }, [selectedConversationId, messages]);

    if (selectedConversationId === undefined) {
        return <div className="placeholder">Select a conversation to view messages.</div>;
    }

    if (isLoading) {
        return <div className="placeholder">Loading messages...</div>;
    }

    if (error) {
        return <div className="placeholder">Could not load messages.</div>;
    }

    if (messages.length === 0) {
        return <div className="placeholder">No messages yet.</div>;
    }

    return (
        <ul className="messages" ref={listRef}>
            {messages.map((message) => (
                <MessageItem key={message.id} message={message} />
            ))}
        </ul>
    );
}
