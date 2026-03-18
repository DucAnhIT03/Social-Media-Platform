import api from '@/api/axios';

const callApiBaseUrl =
  import.meta.env.VITE_CALL_API_BASE_URL?.trim() || 'http://localhost:3006';

export type AudioOfferPayload = {
  conversationId: string;
  targetUserId: string;
  sdp: string;
  metadata?: Record<string, any>;
};

export type VideoOfferPayload = {
  conversationId: string;
  targetUserId: string;
  sdp: string;
  metadata?: Record<string, any>;
};

export type AudioAnswerPayload = {
  conversationId: string;
  targetUserId: string;
  accepted: boolean;
  sdp?: string;
};

export type VideoAnswerPayload = {
  conversationId: string;
  targetUserId: string;
  accepted: boolean;
  sdp?: string;
};

export type AudioIceCandidatePayload = {
  conversationId: string;
  targetUserId: string;
  candidate: string;
  sdpMid: string;
  sdpMLineIndex: string;
};

export type VideoIceCandidatePayload = {
  conversationId: string;
  targetUserId: string;
  candidate: string;
  sdpMid: string;
  sdpMLineIndex: string;
};

export type AudioEndPayload = {
  conversationId: string;
  targetUserId: string;
  reason?: string;
};

export type VideoEndPayload = {
  conversationId: string;
  targetUserId: string;
  reason?: string;
};

export const sendVideoOffer = async (payload: VideoOfferPayload) => {
  const response = await api.post(`${callApiBaseUrl}/calls/video/offer`, payload);
  return response.data;
};

export const sendVideoAnswer = async (payload: VideoAnswerPayload) => {
  const response = await api.post(`${callApiBaseUrl}/calls/video/answer`, payload);
  return response.data;
};

export const sendVideoIceCandidate = async (payload: VideoIceCandidatePayload) => {
  const response = await api.post(`${callApiBaseUrl}/calls/video/ice-candidate`, payload);
  return response.data;
};

export const endVideoCall = async (payload: VideoEndPayload) => {
  const response = await api.post(`${callApiBaseUrl}/calls/video/end`, payload);
  return response.data;
};

export const sendAudioOffer = async (payload: AudioOfferPayload) => {
  const response = await api.post(`${callApiBaseUrl}/calls/audio/offer`, payload);
  return response.data;
};

export const sendAudioAnswer = async (payload: AudioAnswerPayload) => {
  const response = await api.post(`${callApiBaseUrl}/calls/audio/answer`, payload);
  return response.data;
};

export const sendAudioIceCandidate = async (payload: AudioIceCandidatePayload) => {
  const response = await api.post(`${callApiBaseUrl}/calls/audio/ice-candidate`, payload);
  return response.data;
};

export const endAudioCall = async (payload: AudioEndPayload) => {
  const response = await api.post(`${callApiBaseUrl}/calls/audio/end`, payload);
  return response.data;
};
