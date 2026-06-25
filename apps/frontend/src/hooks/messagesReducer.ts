import type { Message } from '../api/types';

export type MessagesState = {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  streamingContent: string | null;
};

export type MessagesAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: Message[] }
  | { type: 'LOAD_ERROR'; payload: Error }
  | { type: 'ADD_OPTIMISTIC'; payload: Message }
  | { type: 'CONFIRM_MESSAGE'; payload: { tempId: string; realMessage: Message } }
  | { type: 'REMOVE_MESSAGE'; payload: { id: string } }
  | { type: 'STREAM_START' }
  | { type: 'STREAM_TOKEN'; payload: string }
  | { type: 'STREAM_DONE'; payload: Message }
  | { type: 'STREAM_ERROR' };

export function messagesReducer(state: MessagesState, action: MessagesAction): MessagesState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, isLoading: true, error: null };

    case 'LOAD_SUCCESS':
      return { ...state, messages: action.payload, isLoading: false, error: null };

    case 'LOAD_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'ADD_OPTIMISTIC':
      return { ...state, messages: [...state.messages, action.payload] };

    case 'CONFIRM_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.payload.tempId ? action.payload.realMessage : message,
        ),
      };

    case 'REMOVE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter((message) => message.id !== action.payload.id),
      };

    case 'STREAM_START':
      return { ...state, streamingContent: '' };

    case 'STREAM_TOKEN':
      return {
        ...state,
        streamingContent: (state.streamingContent ?? '') + action.payload,
      };

    case 'STREAM_DONE':
      return {
        ...state,
        streamingContent: null,
        messages: [...state.messages, action.payload],
      };

    case 'STREAM_ERROR':
      return { ...state, streamingContent: null };
  }
}
