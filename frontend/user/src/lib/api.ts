export type AuthUser = {
  id: string;
  email: string;
  username: string;
  avatar?: string | null;
  bio?: string | null;
  isVerified?: boolean;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type SearchUsersResponse = {
  page: number;
  limit: number;
  total: number;
  items: {
    id: string;
    username: string;
    avatar?: string | null;
    bio?: string | null;
    isOnline: boolean;
    createdAt: string;
  }[];
};

export type FriendRequest = {
  id: string;
  isRead: boolean;
  createdAt: string;
  fromUser: {
    id: string;
    username: string;
    avatar?: string | null;
    bio?: string | null;
    isOnline: boolean;
  };
};

export type FriendRequestsResponse = {
  page: number;
  limit: number;
  total: number;
  items: FriendRequest[];
};

export type FriendItem = {
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatar?: string | null;
    bio?: string | null;
    isOnline: boolean;
  };
};

export type FriendsResponse = {
  page: number;
  limit: number;
  total: number;
  items: FriendItem[];
};

function apiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002/api';
}

function chatApiBaseUrl() {
  return process.env.NEXT_PUBLIC_CHAT_API_BASE_URL || 'http://localhost:3003';
}

async function postJson<T>(path: string, body: Record<string, any>): Promise<T> {
  const res = await fetch(`${apiBaseUrl()}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function registerApi(input: {
  email: string;
  password: string;
  username: string;
}): Promise<AuthResponse> {
  return postJson<AuthResponse>('/users/register', input);
}

export async function loginApi(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return postJson<AuthResponse>('/users/login', input);
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export async function followUserApi(userId: string): Promise<{ success: boolean }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Bạn cần đăng nhập để kết bạn');
  }

  const res = await fetch(`${apiBaseUrl()}/users/${userId}/follow`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data as { success: boolean };
}

export async function unfollowUserApi(
  userId: string,
): Promise<{ success: boolean }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Bạn cần đăng nhập để hủy lời mời kết bạn');
  }

  const res = await fetch(`${apiBaseUrl()}/users/${userId}/follow`, {
    method: 'DELETE',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data as { success: boolean };
}

export async function searchUsersApi(query: string): Promise<SearchUsersResponse> {
  const url = new URL(`${apiBaseUrl()}/users/search`);
  url.searchParams.set('username', query);
  url.searchParams.set('page', '1');
  url.searchParams.set('limit', '20');

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'content-type': 'application/json' },
  });

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data as SearchUsersResponse;
}

export async function fetchFriendRecommendations(): Promise<SearchUsersResponse> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Bạn cần đăng nhập để xem gợi ý kết bạn');
  }

  const url = new URL(`${apiBaseUrl()}/users/recommendations`);
  url.searchParams.set('page', '1');
  url.searchParams.set('limit', '20');

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data as SearchUsersResponse;
}

export async function fetchFriendRequests(): Promise<FriendRequestsResponse> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Bạn cần đăng nhập để xem lời mời kết bạn');
  }

  const url = new URL(`${apiBaseUrl()}/users/me/friend-requests`);
  url.searchParams.set('page', '1');
  url.searchParams.set('limit', '20');

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    if (res.status === 401) {
      clearTokens();
      throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
    }
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data as FriendRequestsResponse;
}

export async function acceptFriendRequestApi(
  notificationId: string,
): Promise<{ success: boolean }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Bạn cần đăng nhập để xử lý lời mời kết bạn');
  }

  const res = await fetch(
    `${apiBaseUrl()}/users/me/friend-requests/${notificationId}/accept`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data as { success: boolean };
}

export async function rejectFriendRequestApi(
  notificationId: string,
): Promise<{ success: boolean }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Bạn cần đăng nhập để xử lý lời mời kết bạn');
  }

  const res = await fetch(
    `${apiBaseUrl()}/users/me/friend-requests/${notificationId}/reject`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data as { success: boolean };
}

export async function fetchFollowingIds(): Promise<string[]> {
  const token = getAccessToken();
  if (!token) {
    return [];
  }

  const res = await fetch(`${apiBaseUrl()}/users/me/following-ids`, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    if (res.status === 401) {
      clearTokens();
      return [];
    }
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data as string[];
}

export async function fetchFriends(): Promise<FriendsResponse> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Bạn cần đăng nhập để xem danh sách bạn bè');
  }

  const url = new URL(`${apiBaseUrl()}/users/me/friends`);
  url.searchParams.set('page', '1');
  url.searchParams.set('limit', '50');

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    if (res.status === 401) {
      clearTokens();
      throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
    }
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data as FriendsResponse;
}

export type ChatConversationItem = {
  id: string;
  type: 'PRIVATE' | 'GROUP';
  title?: string | null;
  isGroup: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessage: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: string;
  } | null;
};

export type ChatConversationsResponse = {
  items: ChatConversationItem[];
  total: number;
};

export type ChatMessageItem = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isDeleted?: boolean;
};

export type ChatMessagesResponse = {
  items: ChatMessageItem[];
  total: number;
};

function chatServiceConnectionError() {
  return new Error('Không thể kết nối chat-service. Kiểm tra service chat ở cổng 3003.');
}

export async function createPrivateConversationApi(
  participantId: string,
): Promise<ChatConversationItem> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Bạn cần đăng nhập để nhắn tin');
  }

  let res: Response;
  try {
    res = await fetch(`${chatApiBaseUrl()}/chat/conversations`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: 'PRIVATE',
        participantId,
      }),
    });
  } catch {
    throw chatServiceConnectionError();
  }

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  return data as ChatConversationItem;
}

export async function fetchChatConversationsApi(): Promise<ChatConversationsResponse> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Bạn cần đăng nhập để xem cuộc trò chuyện');
  }

  const url = new URL(`${chatApiBaseUrl()}/chat/conversations`);
  url.searchParams.set('page', '1');
  url.searchParams.set('limit', '50');

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw chatServiceConnectionError();
  }

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  return data as ChatConversationsResponse;
}

export async function fetchConversationMessagesApi(
  conversationId: string,
): Promise<ChatMessagesResponse> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Bạn cần đăng nhập để xem tin nhắn');
  }

  const url = new URL(
    `${chatApiBaseUrl()}/chat/conversations/${conversationId}/messages`,
  );
  url.searchParams.set('page', '1');
  url.searchParams.set('limit', '100');

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw chatServiceConnectionError();
  }

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  return data as ChatMessagesResponse;
}

export async function deleteConversationApi(
  conversationId: string,
): Promise<{ success: boolean }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Bạn cần đăng nhập để xóa cuộc trò chuyện');
  }

  let res: Response;
  try {
    res = await fetch(`${chatApiBaseUrl()}/chat/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw chatServiceConnectionError();
  }

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  return data as { success: boolean };
}

export async function sendMessageApi(input: {
  conversationId: string;
  content: string;
}): Promise<ChatMessageItem> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Bạn cần đăng nhập để gửi tin nhắn');
  }

  let res: Response;
  try {
    res = await fetch(`${chatApiBaseUrl()}/chat/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    });
  } catch {
    throw chatServiceConnectionError();
  }

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  return data as ChatMessageItem;
}

export function saveTokens(tokens: { accessToken: string; refreshToken: string }) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}
