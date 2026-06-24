import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { UserDocument } from './schemas/user.schema';
import { User } from './schemas/user.schema';
import { DuplicateKeyError } from '../common/errors/persistence.error';
import { InvalidUserIdError } from './users.errors';

export type CreateUserInput = {
  email: string;
  name: string;
  passwordHash: string;
};

const MONGO_DUPLICATE_KEY_ERROR_CODE = 11000;

function isMongoDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === MONGO_DUPLICATE_KEY_ERROR_CODE
  );
}

@Injectable()
export class UsersDbService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async insertUser(input: CreateUserInput): Promise<UserDocument> {
    try {
      return await this.userModel.create(input);
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        throw new DuplicateKeyError();
      }
      throw error;
    }
  }

  async findUserById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new InvalidUserIdError(id);
    }
    return this.userModel.findById(id).exec();
  }

  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async listUsers(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }
}
