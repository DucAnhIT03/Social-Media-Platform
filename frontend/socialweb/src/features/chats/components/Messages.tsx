import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { Search, Phone, Video, Send, MoreVertical } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import {
  ChatConversation,
  ChatMessage,
  createPrivateConversation,
  fetchConversationMessages,
  fetchConversations,
  fetchUserProfile,
  sendMessage,
  UserProfile,
} from '@/api/chat';
import { sendAudioAnswer, sendVideoAnswer } from '@/api/call';
import { getRealtimeBaseUrl } from '@/utils/realtime';

const realtimeBaseUrl = getRealtimeBaseUrl();

const formatTime = (dateLike?: string | null) => {
  if (!dateLike) {
    return '';
  }

  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const parseCurrentUserId = (): string => {
  const token = localStorage.getItem('accessToken') ?? localStorage.getItem('token');
  if (!token) {
    return '';
  }

  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return '';
    }

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(window.atob(base64));
    return typeof decoded?.sub === 'string' ? decoded.sub : '';
  } catch {
    return '';
  }
};

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedUserId = searchParams.get('userId') ?? '';
  const selectedConversationIdFromQuery = searchParams.get('conversationId') ?? '';

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [targetUserProfile, setTargetUserProfile] = useState<UserProfile | null>(null);
  const [userProfilesById, setUserProfilesById] = useState<Record<string, UserProfile>>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [incomingAudioCall, setIncomingAudioCall] = useState<{
    conversationId: string;
    fromUserId: string;
    targetUserId: string;
    sdp: string;
    callerName: string;
    callerAvatar?: string | null;
  } | null>(null);
  const [incomingVideoCall, setIncomingVideoCall] = useState<{
    conversationId: string;
    fromUserId: string;
    targetUserId: string;
    sdp: string;
    callerName: string;
    callerAvatar?: string | null;
  } | null>(null);

  const currentUserId = useMemo(() => parseCurrentUserId(), []);

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const response = await fetchConversations(1, 50);
      const nextItems = response.items ?? [];
      setConversations(nextItems);

      if (!selectedConversationId && nextItems.length > 0) {
        setSelectedConversationId(nextItems[0].id);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message || 'Không tải được hội thoại');
    } finally {
      setIsLoadingConversations(false);
    }
  }, [selectedConversationId]);

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) {
      return;
    }

    setIsLoadingMessages(true);
    try {
      const response = await fetchConversationMessages(conversationId, 1, 100);
      const sorted = [...(response.items ?? [])].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      setMessages(sorted);
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message || 'Không tải được tin nhắn');
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const getPrivatePeerId = useCallback((conversation: ChatConversation): string => {
    if (conversation.isGroup) {
      return '';
    }

    const memberIds = conversation.memberIds ?? [];
    const peerId = memberIds.find((id) => id !== currentUserId);
    return peerId || '';
  }, [currentUserId]);

  useEffect(() => {
    const peerIds: string[] = Array.from(
      new Set<string>(
        conversations
          .map((conversation) => getPrivatePeerId(conversation))
          .filter((id): id is string => Boolean(id) && !userProfilesById[id]),
      ),
    );

    if (peerIds.length === 0) {
      return;
    }

    let isCancelled = false;

    const loadMissingProfiles = async () => {
      const settled = await Promise.allSettled(peerIds.map((id) => fetchUserProfile(id)));

      if (isCancelled) {
        return;
      }

      const nextEntries: Record<string, UserProfile> = {};
      settled.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value?.id) {
          nextEntries[result.value.id] = result.value;
          return;
        }

        const fallbackId = peerIds[index];
        nextEntries[fallbackId] = {
          id: fallbackId,
          username: `Người dùng ${fallbackId.slice(0, 8)}`,
        };
      });

      setUserProfilesById((prev) => ({ ...prev, ...nextEntries }));
    };

    void loadMissingProfiles();

    return () => {
      isCancelled = true;
    };
  }, [conversations, getPrivatePeerId, userProfilesById]);

  useEffect(() => {
    if (selectedConversationIdFromQuery) {
      setSelectedConversationId(selectedConversationIdFromQuery);
    }
  }, [selectedConversationIdFromQuery]);

  useEffect(() => {
    if (!selectedUserId) {
      setTargetUserProfile(null);
      return;
    }

    let isCancelled = false;

    const loadTargetProfile = async () => {
      try {
        const profile = await fetchUserProfile(selectedUserId).catch(() => null);

        if (isCancelled) {
          return;
        }

        if (profile) {
          setTargetUserProfile(profile);
        }
      } catch {
        if (!isCancelled) {
          setTargetUserProfile(null);
        }
      }
    };

    void loadTargetProfile();

    return () => {
      isCancelled = true;
    };
  }, [selectedUserId]);

  useEffect(() => {
    if (!selectedUserId || selectedConversationIdFromQuery) {
      return;
    }

    let isCancelled = false;

    const ensureConversation = async () => {
      try {
        const conversation = await createPrivateConversation(selectedUserId);

        if (isCancelled) {
          return;
        }

        setSelectedConversationId(conversation.id);
        await loadConversations();
      } catch (err: any) {
        const message = err?.response?.data?.message;
        if (!isCancelled) {
          setError(Array.isArray(message) ? message.join(', ') : message || 'Không thể mở cuộc trò chuyện');
        }
      }
    };

    void ensureConversation();

    return () => {
      isCancelled = true;
    };
  }, [selectedUserId, selectedConversationIdFromQuery, loadConversations]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    void loadMessages(selectedConversationId);
  }, [selectedConversationId, loadMessages]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken') ?? localStorage.getItem('token');
    if (!token) {
      return;
    }

    const nextSocket = io(`${realtimeBaseUrl}/realtime`, {
      auth: { token },
    });

    setSocket(nextSocket);

    return () => {
      nextSocket.disconnect();
      setSocket(null);
    };
  }, []);

  useEffect(() => {
    if (!socket || !selectedConversationId) {
      return;
    }

    const joinCurrentConversation = () => {
      socket.emit('conversation.join', { conversationId: selectedConversationId });
    };

    joinCurrentConversation();
    socket.on('connect', joinCurrentConversation);

    return () => {
      socket.off('connect', joinCurrentConversation);
    };
  }, [socket, selectedConversationId]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const onMessageCreated = (payload: ChatMessage) => {
      if (!payload?.id || !payload?.conversationId) {
        return;
      }

      setConversations((prev) => {
        const existed = prev.some((conversation) => conversation.id === payload.conversationId);
        if (!existed) {
          return prev;
        }

        const next = prev.map((conversation) => (
          conversation.id === payload.conversationId
            ? { ...conversation, lastMessage: payload, updatedAt: payload.createdAt }
            : conversation
        ));

        return next.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
      });

      if (payload.conversationId !== selectedConversationId) {
        return;
      }

      setMessages((prev) => {
        const hasSameId = prev.some((message) => message.id === payload.id);
        if (hasSameId) {
          return prev;
        }

        const withoutTempDup = prev.filter(
          (message) => !(message.id.startsWith('temp-') && message.content === payload.content && message.senderId === payload.senderId),
        );

        return [...withoutTempDup, payload].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
    };

    socket.on('message.created', onMessageCreated);

    return () => {
      socket.off('message.created', onMessageCreated);
    };
  }, [socket, selectedConversationId]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const onIncomingAudioOffer = async (payload: any) => {
      if (!payload?.conversationId || !payload?.fromUserId || !payload?.sdp) {
        return;
      }

      const cached = userProfilesById[payload.fromUserId];
      let callerName = cached?.username || `Người dùng ${String(payload.fromUserId).slice(0, 8)}`;
      let callerAvatar = cached?.avatar || null;

      if (!cached) {
        const profile = await fetchUserProfile(payload.fromUserId).catch(() => null);
        if (profile) {
          callerName = profile.username;
          callerAvatar = profile.avatar || null;
          setUserProfilesById((prev) => ({ ...prev, [profile.id]: profile }));
        }
      }

      setIncomingAudioCall({
        conversationId: payload.conversationId,
        fromUserId: payload.fromUserId,
        targetUserId: payload.targetUserId,
        sdp: payload.sdp,
        callerName,
        callerAvatar,
      });
    };

    socket.on('audio-call.offer', onIncomingAudioOffer);

    return () => {
      socket.off('audio-call.offer', onIncomingAudioOffer);
    };
  }, [socket, userProfilesById]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const onIncomingVideoOffer = async (payload: any) => {
      if (!payload?.conversationId || !payload?.fromUserId || !payload?.sdp) {
        return;
      }

      const cached = userProfilesById[payload.fromUserId];
      let callerName = cached?.username || `Người dùng ${String(payload.fromUserId).slice(0, 8)}`;
      let callerAvatar = cached?.avatar || null;

      if (!cached) {
        const profile = await fetchUserProfile(payload.fromUserId).catch(() => null);
        if (profile) {
          callerName = profile.username;
          callerAvatar = profile.avatar || null;
          setUserProfilesById((prev) => ({ ...prev, [profile.id]: profile }));
        }
      }

      setIncomingVideoCall({
        conversationId: payload.conversationId,
        fromUserId: payload.fromUserId,
        targetUserId: payload.targetUserId,
        sdp: payload.sdp,
        callerName,
        callerAvatar,
      });
    };

    socket.on('video-call.offer', onIncomingVideoOffer);

    return () => {
      socket.off('video-call.offer', onIncomingVideoOffer);
    };
  }, [socket, userProfilesById]);

  const filteredConversations = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const peerId = getPrivatePeerId(conversation);
      const peerName = peerId ? (userProfilesById[peerId]?.username || '') : '';
      const title = (conversation.title || peerName).toLowerCase();
      const lastContent = (conversation.lastMessage?.content || '').toLowerCase();
      return title.includes(keyword) || lastContent.includes(keyword) || conversation.id.toLowerCase().includes(keyword);
    });
  }, [searchKeyword, conversations, getPrivatePeerId, userProfilesById]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const selectedPeerId = selectedConversation ? getPrivatePeerId(selectedConversation) : '';
  const selectedPeerProfile = selectedPeerId ? userProfilesById[selectedPeerId] : null;

  const selectedTitle =
    targetUserProfile?.username ||
    selectedConversation?.title ||
    selectedPeerProfile?.username ||
    (selectedConversation ? `Đoạn chat ${selectedConversation.id.slice(0, 8)}` : 'Tin nhắn');

  const handleStartAudioCall = () => {
    if (!selectedConversationId || !selectedPeerId) {
      return;
    }

    navigate(`/audio-call?userId=${selectedPeerId}&conversationId=${selectedConversationId}&mode=caller`);
  };

  const handleStartVideoCall = () => {
    if (!selectedConversationId || !selectedPeerId) {
      return;
    }

    navigate(`/video-call?userId=${selectedPeerId}&conversationId=${selectedConversationId}&mode=caller`);
  };

  const handleAcceptIncomingAudioCall = () => {
    if (!incomingAudioCall) {
      return;
    }

    sessionStorage.setItem('incomingAudioCall', JSON.stringify(incomingAudioCall));
    navigate(
      `/audio-call?userId=${incomingAudioCall.fromUserId}&conversationId=${incomingAudioCall.conversationId}&mode=callee`,
    );
    setIncomingAudioCall(null);
  };

  const handleRejectIncomingAudioCall = async () => {
    if (!incomingAudioCall) {
      return;
    }

    await sendAudioAnswer({
      conversationId: incomingAudioCall.conversationId,
      targetUserId: incomingAudioCall.fromUserId,
      accepted: false,
    }).catch(() => null);

    setIncomingAudioCall(null);
  };

  const handleAcceptIncomingVideoCall = () => {
    if (!incomingVideoCall) {
      return;
    }

    sessionStorage.setItem('incomingVideoCall', JSON.stringify(incomingVideoCall));
    navigate(
      `/video-call?userId=${incomingVideoCall.fromUserId}&conversationId=${incomingVideoCall.conversationId}&mode=callee`,
    );
    setIncomingVideoCall(null);
  };

  const handleRejectIncomingVideoCall = async () => {
    if (!incomingVideoCall) {
      return;
    }

    await sendVideoAnswer({
      conversationId: incomingVideoCall.conversationId,
      targetUserId: incomingVideoCall.fromUserId,
      accepted: false,
    }).catch(() => null);

    setIncomingVideoCall(null);
  };

  const handleSendMessage = async () => {
    const trimmed = draftMessage.trim();
    if (!trimmed || !selectedConversationId || isSending) {
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      conversationId: selectedConversationId,
      senderId: currentUserId,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setDraftMessage('');
    setMessages((prev) => [...prev, optimisticMessage]);
    setIsSending(true);

    try {
      const savedMessage = await sendMessage(selectedConversationId, trimmed);

      setMessages((prev) => prev.map((message) => (message.id === tempId ? savedMessage : message)));
      setConversations((prev) => {
        const next = prev.map((conversation) => (
          conversation.id === selectedConversationId
            ? { ...conversation, lastMessage: savedMessage, updatedAt: savedMessage.createdAt }
            : conversation
        ));

        return next.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
      });
    } catch (err: any) {
      setMessages((prev) => prev.filter((message) => message.id !== tempId));
      setDraftMessage(trimmed);
      const message = err?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message || 'Không gửi được tin nhắn');
    } finally {
      setIsSending(false);
    }
  };

  const onMessageInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleSendMessage();
    }
  };

  return (
    <div className="flex h-full bg-[#121212] rounded-2xl overflow-hidden border border-[#2A2A2A]">
      <div className="w-80 bg-[#1A1A1A] border-r border-[#2A2A2A] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#2A2A2A]">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Tìm kiếm tin nhắn..."
              className="block w-full pl-10 pr-3 py-2 border border-transparent rounded-xl leading-5 bg-[#2A2A2A] text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-[#333333] sm:text-sm transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoadingConversations && (
            <p className="px-4 py-3 text-sm text-gray-400">Đang tải hội thoại...</p>
          )}

          {!isLoadingConversations && filteredConversations.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-400">Chưa có hội thoại nào.</p>
          )}

          {filteredConversations.map((conversation) => {
            const isActive = conversation.id === selectedConversationId;
            const peerId = getPrivatePeerId(conversation);
            const peerProfile = peerId ? userProfilesById[peerId] : null;
            const displayName =
              (selectedConversationId === conversation.id ? targetUserProfile?.username : undefined) ||
              conversation.title ||
              peerProfile?.username ||
              `Đoạn chat ${conversation.id.slice(0, 8)}`;
            const displayAvatar =
              peerProfile?.avatar ||
              `https://picsum.photos/seed/${peerId || conversation.id}/48/48`;

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setSelectedConversationId(conversation.id)}
                className={`w-full text-left flex items-center p-4 transition-colors ${
                  isActive ? 'bg-[#2A2A2A]' : 'hover:bg-[#222222]'
                }`}
              >
                <div className="relative mr-3">
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    className="w-12 h-12 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1 gap-2">
                    <h3 className="text-sm font-semibold text-white truncate">{displayName}</h3>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {conversation.lastMessage?.content || 'Chưa có tin nhắn'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#121212]">
        <div className="h-16 border-b border-[#2A2A2A] flex items-center justify-between px-6 bg-[#1A1A1A]">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={
                  targetUserProfile?.avatar ||
                  selectedPeerProfile?.avatar ||
                  `https://picsum.photos/seed/${selectedConversationId || 'empty'}/40/40`
                }
                alt={selectedTitle}
                className="w-10 h-10 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="text-white font-semibold">{selectedTitle}</h2>
              <p className="text-xs text-gray-400">{selectedConversation ? 'Đang hoạt động' : 'Chọn hội thoại'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={handleStartAudioCall}
              disabled={!selectedConversationId || !selectedPeerId}
              className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center hover:bg-blue-600/30 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleStartVideoCall}
              disabled={!selectedConversationId || !selectedPeerId}
              className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center hover:bg-blue-600/30 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Video className="w-5 h-5" />
            </button>
            <button type="button" className="text-gray-400 hover:text-white transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          {isLoadingMessages && (
            <p className="text-sm text-gray-400">Đang tải tin nhắn...</p>
          )}

          {!isLoadingMessages && selectedConversation && messages.length === 0 && (
            <p className="text-sm text-gray-400">Chưa có tin nhắn nào. Hãy gửi tin nhắn đầu tiên.</p>
          )}

          {!selectedConversation && (
            <p className="text-sm text-gray-400">Chọn hội thoại ở bên trái để bắt đầu nhắn tin.</p>
          )}

          {messages.map((message) => {
            const isMine = currentUserId && message.senderId === currentUserId;

            return (
              <div
                key={message.id}
                className={`flex items-end ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`px-4 py-3 max-w-[70%] break-words ${
                    isMine
                      ? 'bg-blue-600 text-white rounded-2xl rounded-br-none'
                      : 'bg-[#2A2A2A] text-gray-200 rounded-2xl rounded-bl-none'
                  }`}
                >
                  <p>{message.content}</p>
                  <span
                    className={`text-[10px] mt-1 block text-right ${
                      isMine ? 'text-blue-200' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-[#1A1A1A] border-t border-[#2A2A2A]">
          <div className="flex items-center bg-[#2A2A2A] rounded-full px-4 py-2">
            <input
              type="text"
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              onKeyDown={onMessageInputKeyDown}
              placeholder={selectedConversation ? 'Nhập tin nhắn...' : 'Hãy chọn một hội thoại trước'}
              disabled={!selectedConversation || isSending}
              className="flex-1 bg-transparent border-none focus:outline-none text-white placeholder-gray-500 disabled:cursor-not-allowed disabled:opacity-70"
            />
            <button
              type="button"
              onClick={() => void handleSendMessage()}
              disabled={!selectedConversation || !draftMessage.trim() || isSending}
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors ml-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {incomingAudioCall && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#2A2A2A] bg-[#151515] p-5 shadow-2xl">
            <p className="text-xs uppercase tracking-widest text-emerald-400">Cuộc gọi đến</p>
            <div className="mt-4 flex items-center gap-3">
              <img
                src={incomingAudioCall.callerAvatar || `https://picsum.photos/seed/${incomingAudioCall.fromUserId}/64/64`}
                alt={incomingAudioCall.callerName}
                className="h-14 w-14 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-lg font-semibold text-white">{incomingAudioCall.callerName}</p>
                <p className="text-sm text-gray-400">Đang gọi thoại cho bạn</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => void handleRejectIncomingAudioCall()}
                className="rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-500/25"
              >
                Từ chối
              </button>
              <button
                type="button"
                onClick={handleAcceptIncomingAudioCall}
                className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/25"
              >
                Chấp nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {incomingVideoCall && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#2A2A2A] bg-[#151515] p-5 shadow-2xl">
            <p className="text-xs uppercase tracking-widest text-cyan-400">Cuộc gọi video đến</p>
            <div className="mt-4 flex items-center gap-3">
              <img
                src={incomingVideoCall.callerAvatar || `https://picsum.photos/seed/${incomingVideoCall.fromUserId}/64/64`}
                alt={incomingVideoCall.callerName}
                className="h-14 w-14 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-lg font-semibold text-white">{incomingVideoCall.callerName}</p>
                <p className="text-sm text-gray-400">Đang gọi video cho bạn</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => void handleRejectIncomingVideoCall()}
                className="rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-500/25"
              >
                Từ chối
              </button>
              <button
                type="button"
                onClick={handleAcceptIncomingVideoCall}
                className="rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/25"
              >
                Chấp nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
