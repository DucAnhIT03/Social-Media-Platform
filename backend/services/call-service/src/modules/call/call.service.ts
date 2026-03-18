import { ForbiddenException, Injectable } from '@nestjs/common';
import { EventBusService } from '../../shared/events/event-bus.service';
import { CallRepository } from './call.repository';
import { VideoOfferDto } from './dto/video-offer.dto';
import { VideoAnswerDto } from './dto/video-answer.dto';
import { VideoIceCandidateDto } from './dto/video-ice-candidate.dto';
import { VideoEndDto } from './dto/video-end.dto';
import { AudioOfferDto } from './dto/audio-offer.dto';
import { AudioAnswerDto } from './dto/audio-answer.dto';
import { AudioIceCandidateDto } from './dto/audio-ice-candidate.dto';
import { AudioEndDto } from './dto/audio-end.dto';

@Injectable()
export class CallService {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly repo: CallRepository,
  ) {}

  private async assertUsersInConversation(
    conversationId: string,
    currentUserId: string,
    targetUserId: string,
  ) {
    const currentMembership = await this.repo.ensureUserInConversation(
      conversationId,
      currentUserId,
    );

    if (!currentMembership) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    const memberIds = await this.repo.listActiveMemberIds(conversationId);
    if (!memberIds.includes(targetUserId)) {
      throw new ForbiddenException('Target user is not a member of this conversation');
    }
  }

  async sendVideoOffer(currentUserId: string, dto: VideoOfferDto) {
    await this.assertUsersInConversation(
      dto.conversationId,
      currentUserId,
      dto.targetUserId,
    );

    await this.eventBus.publish('video-call.offer', {
      conversationId: dto.conversationId,
      fromUserId: currentUserId,
      targetUserId: dto.targetUserId,
      sdp: dto.sdp,
      metadata: dto.metadata ?? null,
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  }

  async sendVideoAnswer(currentUserId: string, dto: VideoAnswerDto) {
    await this.assertUsersInConversation(
      dto.conversationId,
      currentUserId,
      dto.targetUserId,
    );

    await this.eventBus.publish('video-call.answer', {
      conversationId: dto.conversationId,
      fromUserId: currentUserId,
      targetUserId: dto.targetUserId,
      accepted: dto.accepted,
      sdp: dto.sdp ?? null,
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  }

  async sendVideoIceCandidate(currentUserId: string, dto: VideoIceCandidateDto) {
    await this.assertUsersInConversation(
      dto.conversationId,
      currentUserId,
      dto.targetUserId,
    );

    await this.eventBus.publish('video-call.ice-candidate', {
      conversationId: dto.conversationId,
      fromUserId: currentUserId,
      targetUserId: dto.targetUserId,
      candidate: dto.candidate,
      sdpMid: dto.sdpMid,
      sdpMLineIndex: dto.sdpMLineIndex,
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  }

  async endVideoCall(currentUserId: string, dto: VideoEndDto) {
    await this.assertUsersInConversation(
      dto.conversationId,
      currentUserId,
      dto.targetUserId,
    );

    await this.eventBus.publish('video-call.end', {
      conversationId: dto.conversationId,
      fromUserId: currentUserId,
      targetUserId: dto.targetUserId,
      reason: dto.reason ?? 'ended',
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  }

  async sendAudioOffer(currentUserId: string, dto: AudioOfferDto) {
    await this.assertUsersInConversation(
      dto.conversationId,
      currentUserId,
      dto.targetUserId,
    );

    await this.eventBus.publish('audio-call.offer', {
      conversationId: dto.conversationId,
      fromUserId: currentUserId,
      targetUserId: dto.targetUserId,
      sdp: dto.sdp,
      metadata: dto.metadata ?? null,
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  }

  async sendAudioAnswer(currentUserId: string, dto: AudioAnswerDto) {
    await this.assertUsersInConversation(
      dto.conversationId,
      currentUserId,
      dto.targetUserId,
    );

    await this.eventBus.publish('audio-call.answer', {
      conversationId: dto.conversationId,
      fromUserId: currentUserId,
      targetUserId: dto.targetUserId,
      accepted: dto.accepted,
      sdp: dto.sdp ?? null,
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  }

  async sendAudioIceCandidate(currentUserId: string, dto: AudioIceCandidateDto) {
    await this.assertUsersInConversation(
      dto.conversationId,
      currentUserId,
      dto.targetUserId,
    );

    await this.eventBus.publish('audio-call.ice-candidate', {
      conversationId: dto.conversationId,
      fromUserId: currentUserId,
      targetUserId: dto.targetUserId,
      candidate: dto.candidate,
      sdpMid: dto.sdpMid,
      sdpMLineIndex: dto.sdpMLineIndex,
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  }

  async endAudioCall(currentUserId: string, dto: AudioEndDto) {
    await this.assertUsersInConversation(
      dto.conversationId,
      currentUserId,
      dto.targetUserId,
    );

    await this.eventBus.publish('audio-call.end', {
      conversationId: dto.conversationId,
      fromUserId: currentUserId,
      targetUserId: dto.targetUserId,
      reason: dto.reason ?? 'ended',
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  }
}
