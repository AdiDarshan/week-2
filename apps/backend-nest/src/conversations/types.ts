export type ConversationType = 'human' | 'assistant';

export const HUMAN_CONVERSATION_TYPE: ConversationType = 'human';
export const ASSISTANT_CONVERSATION_TYPE: ConversationType = 'assistant';
export const CONVERSATION_TYPES: ConversationType[] = [
  HUMAN_CONVERSATION_TYPE,
  ASSISTANT_CONVERSATION_TYPE,
];

export interface Conversation {
  id: string;
  title: string;
  type: ConversationType;
  updatedAt: string;
  participantIds: string[];
}
