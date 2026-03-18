import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VideoOfferDto {
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
