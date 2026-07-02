export const CONVERSATION_TYPES = ['human', 'assistant', 'tutor'] as const;

export type ConversationType = (typeof CONVERSATION_TYPES)[number];

export const HUMAN_CONVERSATION_TYPE: ConversationType = 'human';
export const ASSISTANT_CONVERSATION_TYPE: ConversationType = 'assistant';
export const TUTOR_CONVERSATION_TYPE: ConversationType = 'tutor';

export interface Conversation {
  id: string;
  title: string;
  type: ConversationType;
  updatedAt: string;
  participantIds: string[];
}
