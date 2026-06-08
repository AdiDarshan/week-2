import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getConversations } from '../api/conversations';
import type { Conversation } from '../api/types';
import { useAuth } from './useAuth';

type ConversationsContextValue = {
  conversations: Conversation[];
  isLoading: boolean;
  error: Error | null;
  bumpConversation: (conversationId: string) => () => void;
};

const ConversationsContext = createContext<ConversationsContextValue | null>(null);

function sortByMostRecent(list: Conversation[]): Conversation[] {
  return [...list].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

function withUpdatedAt(
  list: Conversation[],
  id: string,
  updatedAt: Date,
): Conversation[] {
  if (!list.some((conversation) => conversation.id === id)) {
    return list;
  }
  return sortByMostRecent(
    list.map((conversation) =>
      conversation.id === id ? { ...conversation, updatedAt } : conversation,
    ),
  );
}

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const { auth } = useAuth();
  const token = auth?.token ?? null;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!token) {
      setConversations([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const currentToken = token;
    let isCancelled = false;

    async function loadConversations() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getConversations(currentToken);
        if (!isCancelled) {
          setConversations(sortByMostRecent(data));
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err as Error);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadConversations();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  const bumpConversation = useCallback((conversationId: string) => {
    const bumpedAt = new Date();
    let previousAt: Date | undefined;

    setConversations((prev) => {
      previousAt = prev.find((c) => c.id === conversationId)?.updatedAt;
      return withUpdatedAt(prev, conversationId, bumpedAt);
    });

    return () => {
      if (previousAt === undefined) {
        return;
      }
      setConversations((prev) => {
        const current = prev.find((c) => c.id === conversationId);
        if (current?.updatedAt !== bumpedAt) {
          return prev;
        }
        return withUpdatedAt(prev, conversationId, previousAt!);
      });
    };
  }, []);

  return (
    <ConversationsContext.Provider
      value={{ conversations, isLoading, error, bumpConversation }}
    >
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversations(): ConversationsContextValue {
  const ctx = useContext(ConversationsContext);
  if (!ctx) {
    throw new Error('useConversations must be used inside <ConversationsProvider>');
  }
  return ctx;
}
