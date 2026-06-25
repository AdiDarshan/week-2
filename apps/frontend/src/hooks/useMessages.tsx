import { useEffect, useReducer } from 'react';
import { getMessages } from '../api/messages';
import type { Message } from '../api/types';
import { useAuth } from './useAuth';
import { messagesReducer } from './messagesReducer';
import type { MessagesState } from './messagesReducer';


export const initialMessagesState: MessagesState = {
  messages: [],
  isLoading: true,
  error: null,
  streamingContent: null,
};

export function useMessages(conversationId: string | undefined) {
  const [state, dispatch] = useReducer(messagesReducer, initialMessagesState);
  const { auth } = useAuth();
  const token = auth?.token ?? null;

  useEffect(() => {
    if (!conversationId || !token) {
      dispatch({ type: 'LOAD_SUCCESS', payload: [] });
      return;
    }

    const currentToken = token;
    let isCancelled = false;
    dispatch({ type: 'LOAD_START' });

    (async () => {
      try {
        const allMessages: Message[] = [];
        let cursor: string | undefined;

        while (true) {
          const page = await getMessages(conversationId, currentToken, cursor);
          if (isCancelled) {
            return;
          }

          allMessages.push(...page.messages);

          if (page.nextCursor === null) {
            break;
          }
          cursor = page.nextCursor;
        }

        dispatch({ type: 'LOAD_SUCCESS', payload: allMessages.reverse() });
      } catch (err) {
        if (!isCancelled) {
          dispatch({ type: 'LOAD_ERROR', payload: err as Error });
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [conversationId, token]);

  return {
    state,
    messagesDispatch: dispatch,
  };
}
