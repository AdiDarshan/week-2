import { useEffect, useReducer } from 'react';
import { getMessages } from '../api/messages';
import type { Message } from '../api/types';
import { messagesReducer } from './messagesReducer';
import type { MessagesState } from './messagesReducer';


export const initialMessagesState: MessagesState = {
  messages: [],
  isLoading: true,
  error: null,
};

export function useMessages(conversationId: string | undefined) {
  const [state, dispatch] = useReducer(messagesReducer, initialMessagesState);

  useEffect(() => {
    if (!conversationId) {
      dispatch({ type: 'LOAD_SUCCESS', payload: [] });
      return;
    }

    let isCancelled = false;
    dispatch({ type: 'LOAD_START' });

    (async () => {
      try {
        const allMessages: Message[] = [];
        let cursor: string | undefined;

        // Walk the cursor-paginated endpoint until the server says there
        // are no more pages. Each iteration takes the current slice and
        // appends it to the accumulator.
        while (true) {
          const page = await getMessages(conversationId, cursor);
          if (isCancelled) return;

          allMessages.push(...page.messages);

          if (page.nextCursor === null) break;
          cursor = page.nextCursor;
        }

        dispatch({ type: 'LOAD_SUCCESS', payload: allMessages });
      } catch (err) {
        if (!isCancelled) {
          dispatch({ type: 'LOAD_ERROR', payload: err as Error });
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [conversationId]);

  return {
    state,
    messagesDispatch: dispatch,
  };
}
