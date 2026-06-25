import type { ChangeEvent } from 'react';
import { useNewConversation } from '../hooks/useNewConversation';
import { AI_ASSISTANT_PARTICIPANT_ID } from '../api/constants';

type NewConversationProps = {
  onCreated?: (conversationId: string) => void;
};

export function NewConversation({ onCreated }: NewConversationProps) {
  const {
    isOpen,
    availableUsers,
    isUsersLoading,
    usersError,
    selectedParticipantId,
    title,
    submitError,
    isPending,
    canSubmit,
    open,
    close,
    selectParticipant,
    setTitle,
    handleSubmit,
  } = useNewConversation({ onCreated });

  if (!isOpen) {
    return (
      <button
        type="button"
        className="new-conversation-button"
        onClick={open}
      >
        + New conversation
      </button>
    );
  }

  function handleSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    selectParticipant(event.target.value);
  }

  const noUsers = !isUsersLoading && !usersError && availableUsers.length === 0;

  return (
    <form className="new-conversation-form" onSubmit={handleSubmit}>
      <label className="new-conversation-label">
        Chat with
        <select
          className="new-conversation-select"
          value={selectedParticipantId ?? ''}
          onChange={handleSelectChange}
          disabled={isPending || isUsersLoading}
          aria-label="Chat with"
        >
          <option value="">Select someone…</option>
          <option value={AI_ASSISTANT_PARTICIPANT_ID}>AI Assistant</option>
          {availableUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </label>
      {isUsersLoading && (
        <p className="new-conversation-hint">Loading users…</p>
      )}
      {usersError && (
        <p role="alert" className="new-conversation-error">
          {usersError}
        </p>
      )}
      {noUsers && (
        <p className="new-conversation-hint">No other users available.</p>
      )}

      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        disabled={isPending}
        aria-label="Conversation title"
      />

      <div className="new-conversation-actions">
        <button type="submit" disabled={!canSubmit}>
          {isPending ? 'Creating…' : 'Create'}
        </button>
        <button
          type="button"
          className="new-conversation-cancel"
          onClick={close}
          disabled={isPending}
        >
          Cancel
        </button>
      </div>
      {submitError && (
        <p role="alert" className="new-conversation-error">
          {submitError}
        </p>
      )}
    </form>
  );
}
