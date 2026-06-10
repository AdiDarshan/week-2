import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { createConversation } from '../api/conversations';
import { getUsers } from '../api/users';
import type { UserDto } from '../api/types';
import { useAuth } from './useAuth';
import { useConversations } from './useConversations';

type UseNewConversationOptions = {
  onCreated?: (conversationId: string) => void;
};

export function useNewConversation({ onCreated }: UseNewConversationOptions = {}) {
  const { auth } = useAuth();
  const { addConversation } = useConversations();

  const [isOpen, setIsOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserDto[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const canSubmit = !isPending && selectedParticipantIds.length > 0;

  const reset = useCallback(() => {
    setSelectedParticipantIds([]);
    setTitle('');
    setSubmitError(null);
    setIsPending(false);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    setSubmitError(null);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    reset();
  }, [reset]);

  useEffect(() => {
    if (!isOpen || !auth) {
      return;
    }

    const token = auth.token;
    let cancelled = false;

    async function load() {
      setIsUsersLoading(true);
      setUsersError(null);
      try {
        const users = await getUsers(token);
        if (!cancelled) {
          setAvailableUsers(users);
        }
      } catch (err) {
        if (!cancelled) {
          setUsersError(err instanceof Error ? err.message : 'Failed to load users');
        }
      } finally {
        if (!cancelled) {
          setIsUsersLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, auth]);

  const toggleParticipant = useCallback((userId: string) => {
    setSelectedParticipantIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    if (!auth) {
      setSubmitError('You must be signed in to create a conversation.');
      return;
    }

    setIsPending(true);
    setSubmitError(null);
    try {
      const trimmedTitle = title.trim();
      const conversation = await createConversation(auth.token, {
        participantIds: selectedParticipantIds,
        ...(trimmedTitle === '' ? {} : { title: trimmedTitle }),
      });
      addConversation(conversation);
      onCreated?.(conversation.id);
      setIsOpen(false);
      reset();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create conversation');
    } finally {
      setIsPending(false);
    }
  }

  return {
    isOpen,
    availableUsers,
    isUsersLoading,
    usersError,
    selectedParticipantIds,
    title,
    submitError,
    isPending,
    canSubmit,
    open,
    close,
    toggleParticipant,
    setTitle,
    handleSubmit,
  };
}
