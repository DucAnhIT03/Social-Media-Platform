import { IsNotEmpty, IsString } from 'class-validator';

export class VideoIceCandidateDto {
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @IsNotEmpty()
  @IsString()
  targetUserId: string;

  @IsNotEmpty()
  @IsString()
  candidate: string;

  @IsNotEmpty()
  @IsString()
  sdpMid: string;

  @IsNotEmpty()
  @IsString()
  sdpMLineIndex: string;
}
