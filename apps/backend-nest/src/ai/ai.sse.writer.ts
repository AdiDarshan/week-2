import type { MessageEvent } from '@nestjs/common';
import { Observable, from } from 'rxjs';
import type { Message } from '../messages/types';

const DONE_EVENT_TYPE = 'done';

export function toAiSseStream(
  replyStream: AsyncGenerator<string, Message>,
): Observable<MessageEvent> {
  return from(toSseEvents(replyStream));
}

async function* toSseEvents(
  replyStream: AsyncGenerator<string, Message>,
): AsyncGenerator<MessageEvent> {
  let next = await replyStream.next();
  while (!next.done) {
    yield { data: next.value };
    next = await replyStream.next();
  }

  const persisted = next.value;
  yield {
    type: DONE_EVENT_TYPE,
    data: JSON.stringify({
      id: persisted.id,
      createdAt: persisted.createdAt,
      citations: persisted.citations,
    }),
  };
}
