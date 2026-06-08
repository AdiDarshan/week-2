import type { Message } from '../api/types';
import { useAuth } from '../hooks/useAuth';

type MessageItemProps = {
    message: Message;
};

export function MessageItem({ message }: MessageItemProps) {
    const { auth, userId } = useAuth();
    const isMine = auth !== null && message.senderId === userId;

    return (
        <li
            data-role={isMine ? 'self' : 'other'}
            className={message.isPending ? 'pending' : undefined}
        >
            {message.content}
        </li>
    );
}
