import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import {
  KnowledgeDocumentLink,
  type KnowledgeDocumentLinkDocument,
} from './schemas/document.link.schema';

export type DocumentLinkInput = {
  userId: string;
  documentId: string;
  conversationId: string;
};

@Injectable()
export class DocumentLinksDbService {
  constructor(
    @InjectModel(KnowledgeDocumentLink.name)
    private readonly linkModel: Model<KnowledgeDocumentLinkDocument>,
  ) {}

  async upsertLink(
    link: DocumentLinkInput,
    session?: ClientSession,
  ): Promise<KnowledgeDocumentLinkDocument> {
    return this.linkModel
      .findOneAndUpdate(
        link,
        { $setOnInsert: link },
        { upsert: true, new: true, session },
      )
      .orFail()
      .exec();
  }

  async findDocumentIds(
    userId: string,
    conversationId: string,
  ): Promise<string[]> {
    const links = await this.linkModel
      .find({ userId, conversationId })
      .sort({ createdAt: -1, _id: -1 })
      .exec();
    return links.map((link) => link.documentId);
  }

  async deleteLink(
    link: DocumentLinkInput,
    session?: ClientSession,
  ): Promise<boolean> {
    const result = await this.linkModel
      .deleteOne(link)
      .session(session ?? null)
      .exec();
    return result.deletedCount > 0;
  }

  async countByDocument(
    documentId: string,
    session?: ClientSession,
  ): Promise<number> {
    return this.linkModel
      .countDocuments({ documentId })
      .session(session ?? null)
      .exec();
  }
}
