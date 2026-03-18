import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VideoEndDto {
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @IsNotEmpty()
  @IsString()
  targetUserId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
