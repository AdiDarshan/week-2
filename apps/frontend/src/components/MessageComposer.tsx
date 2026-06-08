import type { Dispatch } from 'react';
import type { MessagesAction } from '../hooks/messagesReducer';
import { useMessageComposer } from '../hooks/useMessageComposer';
import { ErrorToast } from './ErrorToast';
type MessageComposerProps = {
    conversationId: string;
    dispatch: Dispatch<MessagesAction>;
};

export function MessageComposer({ conversationId, dispatch }: MessageComposerProps) {
    const { value, setValue, sendToServer, toast } = useMessageComposer(conversationId, dispatch);

    async function handleSendMessage(event: React.KeyboardEvent<HTMLTextAreaElement> | React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        sendToServer();
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === 'Enter' && !event.shiftKey) {
            handleSendMessage(event);
        }
    }

    return (
        <form className="composer" onSubmit={handleSendMessage}>
            <textarea
                placeholder="Type a message..."
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={handleKeyDown}
            />
            <button type="submit">Send</button>
            {toast && <ErrorToast message={toast} />}
        </form>
       
    
    );
}
