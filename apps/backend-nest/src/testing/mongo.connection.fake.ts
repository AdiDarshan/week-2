import type { ClientSession, Connection } from 'mongoose';

export function connectionFake(): Connection {
  const session = {
    withTransaction: async (work: () => Promise<unknown>) => work(),
    endSession: async () => undefined,
  };
  const connection = {
    startSession: async () => session as unknown as ClientSession,
  };
  return connection as unknown as Connection;
}
