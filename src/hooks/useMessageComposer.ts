import { useState } from 'react';
import type { Dispatch } from 'react';
import { sendMessage } from '../api/messages';
import type { Message } from '../api/types';
import type { MessagesAction } from '../hooks/messagesReducer';
import { useErrorToast } from './useErrorToast';
import { useAuth } from './useAuth';
import { useConversations } from './useConversations';

export function useMessageComposer(conversationId: string, dispatch: Dispatch<MessagesAction>) {
    const [value, setValue] = useState('');
    const { toast, showToast } = useErrorToast();
    const { bumpConversation } = useConversations();
    const { auth } = useAuth();

    function optimisticAddMessage(content: string, senderId: string) {
        const tempId = crypto.randomUUID();
        const tempMessage: Message = {
            id: tempId,
            conversationId,
            content,
            senderId,
            createdAt: new Date(),
            isPending: true,
        };
        dispatch({ type: 'ADD_OPTIMISTIC', payload: tempMessage });
        return tempId;
    }

    async function sendToServer() {
        const content = value.trim();
        if (content === '') {
            return;
        }
        if (!auth) {
            showToast('You must be signed in to send messages.');
            return;
        }

        const senderId = auth.user.id;
        const tempId = optimisticAddMessage(content, senderId);
        setValue('');
        const rollbackBump = bumpConversation(conversationId);

        try {
            const realMessage = await sendMessage(conversationId, content, senderId);
            dispatch({ type: 'CONFIRM_MESSAGE', payload: { tempId, realMessage } });
        } catch (err) {
            dispatch({ type: 'REMOVE_MESSAGE', payload: { id: tempId } });
            rollbackBump();
            setValue(content);
            showToast(err instanceof Error ? err.message : 'Failed to send message');
        }
    }

    return { value, setValue, sendToServer, toast };
}
