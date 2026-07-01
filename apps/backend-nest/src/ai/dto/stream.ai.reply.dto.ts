import { IsNotEmpty, IsString } from 'class-validator';

export class StreamAiReplyDto {
  @IsNotEmpty()
  @IsString()
  conversationId!: string;
}
