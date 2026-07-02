import { useState } from 'react';
import type { Dispatch } from 'react';
import { sendMessage, streamAiReply } from '../api/messages';
import { AI_ASSISTANT_PARTICIPANT_ID } from '../api/constants';
import type { Message } from '../api/types';
import type { MessagesAction } from '../hooks/messagesReducer';
import { useErrorToast } from './useErrorToast';
import { useAuth } from './useAuth';
import { useConversations } from './useConversations';

export function useMessageComposer(
  conversationId: string,
  dispatch: Dispatch<MessagesAction>,
  isAssistant: boolean,
) {
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
    if (content === '') return;
    if (!auth) {
      showToast('You must be signed in to send messages.');
      return;
    }

    const senderId = auth.user.id;
    const token = auth.token;
    const tempId = optimisticAddMessage(content, senderId);
    setValue('');
    const rollbackBump = bumpConversation(conversationId);

    try {
      const realMessage = await sendMessage(conversationId, content, token);
      dispatch({ type: 'CONFIRM_MESSAGE', payload: { tempId, realMessage } });
    } catch (err) {
      dispatch({ type: 'REMOVE_MESSAGE', payload: { id: tempId } });
      rollbackBump();
      setValue(content);
      showToast(err instanceof Error ? err.message : 'Failed to send message');
      return;
    }

    if (!isAssistant) return;

    dispatch({ type: 'STREAM_START' });

    await streamAiReply(
      conversationId,
      token,
      (token) => dispatch({ type: 'STREAM_TOKEN', payload: token }),
      (fullContent, persisted) => {
        const aiMessage: Message = {
          id: persisted.id,
          conversationId,
          content: fullContent,
          senderId: AI_ASSISTANT_PARTICIPANT_ID,
          citations: persisted.citations,
          createdAt: new Date(persisted.createdAt),
          isPending: false,
        };
        dispatch({ type: 'STREAM_DONE', payload: aiMessage });
        bumpConversation(conversationId);
      },
      (err) => {
        dispatch({ type: 'STREAM_ERROR' });
        showToast(err.message);
      },
    );
  }

  return { value, setValue, sendToServer, toast };
}
