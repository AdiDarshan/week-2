import { NestFactory } from '@nestjs/core';
import { getConnectionToken } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { AppModule } from '../../app.module';
import { CHUNKS_COLLECTION, VECTOR_INDEX_NAME } from '../knowledge.constants';
import { KNOWLEDGE_CHUNK_VECTOR_INDEX } from './vector.index';


async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const connection = app.get<Connection>(getConnectionToken(), {
      strict: false,
    });
    const db = connection.db;
    if (!db) {
      throw new Error('Mongoose connection has no database handle.');
    }

    const collections = await db
      .listCollections({ name: CHUNKS_COLLECTION })
      .toArray();
    if (collections.length === 0) {
      await db.createCollection(CHUNKS_COLLECTION);
      console.log(`Created collection "${CHUNKS_COLLECTION}".`);
    }

    const collection = db.collection(CHUNKS_COLLECTION);
    const existing = await collection.listSearchIndexes().toArray();
    const alreadyExists = existing.some(
      (index: { name?: string }) => index.name === VECTOR_INDEX_NAME,
    );
    if (alreadyExists) {
      await collection.updateSearchIndex(
        VECTOR_INDEX_NAME,
        KNOWLEDGE_CHUNK_VECTOR_INDEX.definition,
      );
      console.log(
        `Updated vector index "${VECTOR_INDEX_NAME}" to the committed ` +
          'definition. Atlas rebuilds it asynchronously; it may take a ' +
          'minute before queries return results.',
      );
      return;
    }

    const createdName = await collection.createSearchIndex(
      KNOWLEDGE_CHUNK_VECTOR_INDEX,
    );
    console.log(
      `Created vector index "${createdName}". Atlas builds it asynchronously; ` +
        'it may take a minute before queries return results.',
    );
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
