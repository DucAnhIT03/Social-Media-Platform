import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export enum ConversationKind {
  PRIVATE = 'PRIVATE',
  GROUP = 'GROUP',
}

export class CreateConversationDto {
  @IsEnum(ConversationKind)
  type: ConversationKind;

  @ValidateIf((o) => o.type === ConversationKind.GROUP)
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title?: string;

  // For PRIVATE conversation: exactly one other participant
  @ValidateIf((o) => o.type === ConversationKind.PRIVATE)
  @IsNotEmpty()
  @IsString()
  participantId?: string;

  // For GROUP conversation: list of member ids (excluding current user; backend will add current user automatically)
  @ValidateIf((o) => o.type === ConversationKind.GROUP)
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  memberIds?: string[];
}

