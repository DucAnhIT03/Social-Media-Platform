import api from '@/api/axios';
import type { PaginatedResponse, UserSummary } from '@/api/friends';

const userApiBaseUrl =
  import.meta.env.VITE_USER_API_BASE_URL?.trim() || 'http://localhost:3002/api';

export type FeedPost = {
  id: string;
  content: string;
  imageUrl?: string | null;
  postType?: 'POST' | 'SHORT_VIDEO';
  shortVideoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  author: UserSummary;
};

export type CreatePostPayload = {
  content: string;
  imageUrl?: string;
  postType?: 'POST' | 'SHORT_VIDEO';
  shortVideoUrl?: string;
};

export type UploadMediaType = 'image' | 'video';

export type UploadMediaResponse = {
  url: string;
  publicId: string;
  resourceType: string;
  format: string;
  bytes: number;
  duration?: number | null;
};

export const createPost = async (payload: CreatePostPayload): Promise<FeedPost> => {
  const response = await api.post(`${userApiBaseUrl}/users/me/posts`, payload);
  return response.data;
};

export const uploadPostMedia = async (
  file: File,
  type: UploadMediaType,
): Promise<UploadMediaResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(
    `${userApiBaseUrl}/users/me/uploads`,
    formData,
    {
      params: { type },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
};

export const fetchFeedPosts = async (
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<FeedPost>> => {
  const response = await api.get(`${userApiBaseUrl}/users/feed/posts`, {
    params: { page, limit },
  });

  return response.data;
};

export const fetchShortVideoPosts = async (
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<FeedPost>> => {
  const response = await api.get(`${userApiBaseUrl}/users/feed/short-videos`, {
    params: { page, limit },
  });

  return response.data;
};
