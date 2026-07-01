import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsIn,
  ValidateIf,
} from 'class-validator';
import {
  ASSISTANT_CONVERSATION_TYPE,
  CONVERSATION_TYPES,
  type ConversationType,
} from '../types';

export class CreateConversationDto {
  @ValidateIf(
    (dto: CreateConversationDto) => dto.type !== ASSISTANT_CONVERSATION_TYPE,
  )
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  participantIds?: string[];

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsIn(CONVERSATION_TYPES)
  type?: ConversationType;
}
