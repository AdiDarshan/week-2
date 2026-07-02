import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import {
  KnowledgeDocument,
  type KnowledgeDocumentDocument,
} from './schemas/document.schema';
import { InvalidDocumentIdError } from './knowledge.errors';

export type CreateDocumentInput = {
  userId: string;
  name: string;
  mimeType: string;
  contentHash: string;
};

@Injectable()
export class DocumentsDbService {
  constructor(
    @InjectModel(KnowledgeDocument.name)
    private readonly documentModel: Model<KnowledgeDocumentDocument>,
  ) {}

  async insertDocument(
    input: CreateDocumentInput,
    session?: ClientSession,
  ): Promise<KnowledgeDocumentDocument> {
    const [doc] = await this.documentModel.create([input], { session });
    return doc;
  }

  async findByContentHash(
    userId: string,
    contentHash: string,
  ): Promise<KnowledgeDocumentDocument | null> {
    return this.documentModel.findOne({ userId, contentHash }).exec();
  }

  async findByIds(
    userId: string,
    ids: string[],
  ): Promise<KnowledgeDocumentDocument[]> {
    if (ids.length === 0) {
      return [];
    }
    return this.documentModel
      .find({ userId, _id: { $in: ids } })
      .sort({ createdAt: -1, _id: -1 })
      .exec();
  }

  async deleteById(
    userId: string,
    id: string,
    session?: ClientSession,
  ): Promise<KnowledgeDocumentDocument | null> {
    this.assertValidId(id);
    return this.documentModel
      .findOneAndDelete({ _id: id, userId }, { session })
      .exec();
  }

  private assertValidId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new InvalidDocumentIdError(id);
    }
  }
}
