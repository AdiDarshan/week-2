import type { Message } from '../api/types';
import { useAuth } from '../hooks/useAuth';

type MessageItemProps = {
    message: Message;
};

export function MessageItem({ message }: MessageItemProps) {
    const { auth } = useAuth();
    const isMine = auth?.user.id === message.senderId;

    const citations = message.citations ?? [];

    return (
        <li
            data-role={isMine ? 'self' : 'other'}
            className={message.isPending ? 'pending' : undefined}
        >
            {message.content}
            {citations.length > 0 && (
                <ul className="citations">
                    {citations.map((citation) => (
                        <li key={citation.chunkId}>
                            <details>
                                <summary>From: {citation.documentName}</summary>
                                <blockquote>{citation.snippet}</blockquote>
                            </details>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
}
