import { IsArray, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';

export class CreateConversationDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  participantIds!: string[];

  @IsOptional()
  @IsString()
  title?: string;
}
