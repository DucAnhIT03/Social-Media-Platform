import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/auth/jwt.guard';
import { CallService } from './call.service';
import { VideoOfferDto } from './dto/video-offer.dto';
import { VideoAnswerDto } from './dto/video-answer.dto';
import { VideoIceCandidateDto } from './dto/video-ice-candidate.dto';
import { VideoEndDto } from './dto/video-end.dto';
import { AudioOfferDto } from './dto/audio-offer.dto';
import { AudioAnswerDto } from './dto/audio-answer.dto';
import { AudioIceCandidateDto } from './dto/audio-ice-candidate.dto';
import { AudioEndDto } from './dto/audio-end.dto';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('calls')
@UseGuards(JwtAuthGuard)
export class CallController {
  constructor(private readonly callService: CallService) {}

  // Video call signaling
  @Post('video/offer')
  sendVideoOffer(@Req() req: RequestWithUser, @Body() dto: VideoOfferDto) {
    return this.callService.sendVideoOffer(req.user.userId, dto);
  }

  @Post('video/answer')
  sendVideoAnswer(@Req() req: RequestWithUser, @Body() dto: VideoAnswerDto) {
    return this.callService.sendVideoAnswer(req.user.userId, dto);
  }

  @Post('video/ice-candidate')
  sendVideoIceCandidate(
    @Req() req: RequestWithUser,
    @Body() dto: VideoIceCandidateDto,
  ) {
    return this.callService.sendVideoIceCandidate(req.user.userId, dto);
  }

  @Post('video/end')
  endVideoCall(@Req() req: RequestWithUser, @Body() dto: VideoEndDto) {
    return this.callService.endVideoCall(req.user.userId, dto);
  }

  // Audio call signaling
  @Post('audio/offer')
  sendAudioOffer(@Req() req: RequestWithUser, @Body() dto: AudioOfferDto) {
    return this.callService.sendAudioOffer(req.user.userId, dto);
  }

  @Post('audio/answer')
  sendAudioAnswer(@Req() req: RequestWithUser, @Body() dto: AudioAnswerDto) {
    return this.callService.sendAudioAnswer(req.user.userId, dto);
  }

  @Post('audio/ice-candidate')
  sendAudioIceCandidate(
    @Req() req: RequestWithUser,
    @Body() dto: AudioIceCandidateDto,
  ) {
    return this.callService.sendAudioIceCandidate(req.user.userId, dto);
  }

  @Post('audio/end')
  endAudioCall(@Req() req: RequestWithUser, @Body() dto: AudioEndDto) {
    return this.callService.endAudioCall(req.user.userId, dto);
  }
}
