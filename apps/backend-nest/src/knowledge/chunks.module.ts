import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KnowledgeChunk, KnowledgeChunkSchema } from './schemas/chunk.schema';
import { ChunksDbService } from './chunks.db.service';
import { ChunksService } from './chunks.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KnowledgeChunk.name, schema: KnowledgeChunkSchema },
    ]),
  ],
  providers: [ChunksDbService, ChunksService],
  exports: [ChunksService],
})
export class ChunksModule {}
