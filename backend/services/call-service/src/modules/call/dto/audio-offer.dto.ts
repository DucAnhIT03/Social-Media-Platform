import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AudioOfferDto {
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @IsNotEmpty()
  @IsString()
  targetUserId: string;

  @IsNotEmpty()
  @IsString()
  sdp: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
