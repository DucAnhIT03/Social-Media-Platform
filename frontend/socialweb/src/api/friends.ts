import api from '@/api/axios';

const userApiBaseUrl =
  import.meta.env.VITE_USER_API_BASE_URL?.trim() || 'http://localhost:3002/api';

type Pagination = {
  page?: number;
  limit?: number;
};

export type UserSummary = {
  id: string;
  username: string;
  avatar?: string | null;
  bio?: string | null;
  isOnline: boolean;
};

export type FriendItem = {
  createdAt: string;
  user: UserSummary;
};

export type FriendRequestItem = {
  id: string;
  isRead: boolean;
  createdAt: string;
  fromUser: UserSummary;
};

export type PaginatedResponse<T> = {
  page: number;
  limit: number;
  total: number;
  items: T[];
};

export const fetchFriends = async (
  pagination: Pagination = {},
): Promise<PaginatedResponse<FriendItem>> => {
  const response = await api.get(`${userApiBaseUrl}/users/me/friends`, {
    params: { page: pagination.page ?? 1, limit: pagination.limit ?? 20 },
  });

  return response.data;
};

export const fetchFriendRequests = async (
  pagination: Pagination = {},
): Promise<PaginatedResponse<FriendRequestItem>> => {
  const response = await api.get(`${userApiBaseUrl}/users/me/friend-requests`, {
    params: { page: pagination.page ?? 1, limit: pagination.limit ?? 20 },
  });

  return response.data;
};

export const acceptFriendRequest = async (
  requestId: string,
): Promise<{ success: boolean }> => {
  const response = await api.post(
    `${userApiBaseUrl}/users/me/friend-requests/${requestId}/accept`,
    {},
  );

  return response.data;
};

export const rejectFriendRequest = async (
  requestId: string,
): Promise<{ success: boolean }> => {
  const response = await api.post(
    `${userApiBaseUrl}/users/me/friend-requests/${requestId}/reject`,
    {},
  );

  return response.data;
};

export const sendFriendRequest = async (
  userId: string,
): Promise<{ success: boolean }> => {
  const response = await api.post(
    `${userApiBaseUrl}/users/${userId}/follow`,
    {},
  );

  return response.data;
};

export const cancelFriendRequest = async (
  userId: string,
): Promise<{ success: boolean }> => {
  const response = await api.delete(`${userApiBaseUrl}/users/${userId}/follow`);

  return response.data;
};

export const fetchFollowingIds = async (): Promise<string[]> => {
  const response = await api.get(`${userApiBaseUrl}/users/me/following-ids`);

  return response.data;
};

export const fetchRecommendations = async (
  pagination: Pagination = {},
): Promise<PaginatedResponse<UserSummary>> => {
  const response = await api.get(`${userApiBaseUrl}/users/recommendations`, {
    params: { page: pagination.page ?? 1, limit: pagination.limit ?? 20 },
  });

  return response.data;
};

export const searchUsers = async (
  keyword: string,
  pagination: Pagination = {},
): Promise<PaginatedResponse<UserSummary>> => {
  const response = await api.get(`${userApiBaseUrl}/users/search`, {
    params: {
      username: keyword,
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 50,
    },
  });

  return response.data;
};
