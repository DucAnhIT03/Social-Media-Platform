import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VideoAnswerDto {
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @IsNotEmpty()
  @IsString()
  targetUserId: string;

  @IsBoolean()
  accepted: boolean;

  @IsOptional()
  @IsString()
  sdp?: string;
}
