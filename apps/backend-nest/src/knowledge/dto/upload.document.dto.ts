import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { SUPPORTED_MIME_TYPES } from '../knowledge.constants';

const NAME_MAX_LENGTH = 200;
const CONTENT_MAX_LENGTH = 1_000_000;

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  name!: string;

  @IsIn(SUPPORTED_MIME_TYPES)
  mimeType!: (typeof SUPPORTED_MIME_TYPES)[number];

  @IsString()
  @IsNotEmpty()
  @MaxLength(CONTENT_MAX_LENGTH)
  content!: string;
}
