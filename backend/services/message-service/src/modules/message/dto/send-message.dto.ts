import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export enum MessageTypeDto {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  FILE = 'FILE',
}

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  content: string;

  @IsEnum(MessageTypeDto)
  type: MessageTypeDto;
}

