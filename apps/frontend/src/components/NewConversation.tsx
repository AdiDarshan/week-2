import type { ChangeEvent } from 'react';
import { useNewConversation } from '../hooks/useNewConversation';

type NewConversationProps = {
  onCreated?: (conversationId: string) => void;
};

export function NewConversation({ onCreated }: NewConversationProps) {
  const {
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
    const next = Array.from(event.target.selectedOptions, (option) => option.value);
    const toAdd = next.filter((id) => !selectedParticipantIds.includes(id));
    const toRemove = selectedParticipantIds.filter((id) => !next.includes(id));
    toAdd.forEach(toggleParticipant);
    toRemove.forEach(toggleParticipant);
  }

  const noUsers = !isUsersLoading && !usersError && availableUsers.length === 0;

  return (
    <form className="new-conversation-form" onSubmit={handleSubmit}>
      <label className="new-conversation-label">
        Participants
        <select
          multiple
          className="new-conversation-select"
          value={selectedParticipantIds}
          onChange={handleSelectChange}
          disabled={isPending || isUsersLoading || availableUsers.length === 0}
          aria-label="Participants"
          size={Math.min(Math.max(availableUsers.length, 3), 6)}
        >
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
