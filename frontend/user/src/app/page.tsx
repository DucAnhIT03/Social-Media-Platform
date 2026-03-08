'use client';

import { useChatStore } from '@/store/useChatStore';
import ChatWindow from '@/components/chat/ChatWindow';
import { cn } from '@/lib/utils';
import {
  MessageCircle,
  Users,
  Settings,
  Phone,
  Search,
  MoreHorizontal,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Film,
  Video,
  Plus,
  UserCheck,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { MOCK_CALLS, OTHER_USERS, MOCK_REELS } from '@/lib/data';
import { format } from 'date-fns';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { ProfileModal } from '@/components/modals/ProfileModal';
import { UploadReelModal } from '@/components/modals/UploadReelModal';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { CommentSection } from '@/components/video/CommentSection';
import { Modal } from '@/components/ui/Modal';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  followUserApi,
  unfollowUserApi,
  fetchFriendRecommendations,
  fetchFriendRequests,
  fetchFollowingIds,
  FriendRequest,
  clearTokens,
  acceptFriendRequestApi,
  rejectFriendRequestApi,
  fetchFriends,
  getAccessToken,
} from '@/lib/api';
import { useToastStore } from '@/store/useToastStore';
import { getRealtimeSocket } from '@/lib/realtime';

export default function Home() {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002/api';

  const router = useRouter();
  const {
    activeConversationId,
    setActiveConversation,
    openConversationWithUser,
    removeConversation,
    currentUser,
    hydrated,
  } = useChatStore();
  const loadConversations = useChatStore((state) => state.loadConversations);
  const loadMessages = useChatStore((state) => state.loadMessages);
  const receiveMessage = useChatStore((state) => state.receiveMessage);

  const conversations = useChatStore((state) => state.conversations);
  const [activeTab, setActiveTab] = useState<
    'chats' | 'search' | 'people' | 'friends' | 'videos' | 'calls'
  >('chats');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUploadReelOpen, setIsUploadReelOpen] = useState(false);
  const [reels, setReels] = useState(MOCK_REELS);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<
    { id: string; name: string; avatar: string; bio?: string | null; isOnline?: boolean }[]
  >([]);
  const [followLoadingId, setFollowLoadingId] = useState<string | null>(null);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [recommendLoaded, setRecommendLoaded] = useState(true);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const { show } = useToastStore();
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [friendRequestLoadingId, setFriendRequestLoadingId] = useState<
    string | null
  >(null);
  const [friends, setFriends] = useState<
    {
      id: string;
      name: string;
      avatar: string;
      bio?: string | null;
      isOnline?: boolean;
    }[]
  >([]);
  const socketInitRef = useRef(false);
  const suppressOpenConversationRef = useRef(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, hydrated, router]);

  useEffect(() => {
    if (!hydrated || !currentUser) return;

    const token = getAccessToken();
    if (!token) {
      router.push('/login');
      return;
    }

    void loadConversations().catch(() => {
      // Tránh văng lỗi unhandled promise trên console
    });
  }, [hydrated, currentUser, loadConversations, router]);

  useEffect(() => {
    if (!activeConversationId) return;

    const token = getAccessToken();
    if (!token) return;

    void loadMessages(activeConversationId).catch(() => {
      // Tránh văng lỗi unhandled promise trên console
    });
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    if (!hydrated || !currentUser || socketInitRef.current) return;

    const token = getAccessToken();
    if (!token) return;

    const socket = getRealtimeSocket(token);
    socketInitRef.current = true;

    const onMessageCreated = (payload: {
      id: string;
      conversationId: string;
      senderId: string;
      content: string;
      createdAt: string;
    }) => {
      receiveMessage(payload);
    };

    socket.on('message.created', onMessageCreated);

    return () => {
      socket.off('message.created', onMessageCreated);
      socketInitRef.current = false;
    };
  }, [hydrated, currentUser, receiveMessage]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const socket = getRealtimeSocket(token);

    const conversationIds = conversations.map((c) => c.id);
    conversationIds.forEach((conversationId) => {
      socket.emit('conversation.join', { conversationId });
    });

    if (activeConversationId) {
      socket.emit('conversation.join', { conversationId: activeConversationId });
    }
  }, [activeConversationId, conversations]);

  useEffect(() => {
    if (!conversationToDelete) return;
    setActiveConversation(null);
  }, [conversationToDelete, setActiveConversation]);

  // Reset selected video when switching tabs
  useEffect(() => {
    if (activeTab !== 'videos') {
      setSelectedVideoId(null);
    }
  }, [activeTab]);

  // Navigate to next/previous video
  const navigateVideo = (direction: 'up' | 'down') => {
    if (!selectedVideoId) return;
    
    const currentIndex = reels.findIndex(r => r.id === selectedVideoId);
    if (currentIndex === -1) return;

    let newIndex: number;
    if (direction === 'down') {
      // Scroll down = next video
      newIndex = currentIndex + 1;
      if (newIndex >= reels.length) {
        newIndex = 0; // Loop to first video
      }
    } else {
      // Scroll up = previous video
      newIndex = currentIndex - 1;
      if (newIndex < 0) {
        newIndex = reels.length - 1; // Loop to last video
      }
    }

    setSelectedVideoId(reels[newIndex].id);
  };

  // Tự động load gợi ý khi mở tab Search lần đầu
  useEffect(() => {
    if (activeTab !== 'search') return;
    if (recommendLoaded || searchLoading) return;

    (async () => {
      try {
        setSearchLoading(true);
        const res = await fetchFriendRecommendations();
        setSearchResults(
          res.items.map((u) => ({
            id: u.id,
            name: u.username,
            avatar: u.avatar || 'https://i.pravatar.cc/150?u=' + u.id,
            bio: u.bio,
            isOnline: u.isOnline,
          })),
        );
      } catch (e: any) {
        // Gợi ý kết bạn lỗi (ví dụ chưa đăng nhập / 401) thì im lặng, không chặn ô tìm kiếm
      } finally {
        setSearchLoading(false);
        setRecommendLoaded(true);
      }
    })();
  }, [activeTab, recommendLoaded, searchLoading]);

  // Load danh sách lời mời kết bạn khi mở tab Search hoặc People
  useEffect(() => {
    if (activeTab !== 'search' && activeTab !== 'people') return;
    // Với tab People, chỉ fetch khi người dùng bấm nút "Lời mời"
    if (activeTab === 'people' && !showFriendRequests) return;
    (async () => {
      try {
        const res = await fetchFriendRequests();
        setFriendRequests(res.items);
      } catch {
        // im lặng, chỉ không hiển thị danh sách
      }
    })();
  }, [activeTab, showFriendRequests]);

  // Đồng bộ trạng thái đã kết bạn từ backend (sau khi reload trang)
  useEffect(() => {
    if (!hydrated || !currentUser) return;
    if (followedIds.size > 0) return;

    (async () => {
      try {
        const ids = await fetchFollowingIds();
        if (ids && ids.length > 0) {
          setFollowedIds(new Set(ids));
        }
      } catch {
        // im lặng, không cần chặn UI
      }
    })();
  }, [hydrated, currentUser, followedIds.size]);

  // Load danh sách bạn bè khi mở tab Friends
  useEffect(() => {
    if (activeTab !== 'friends') return;
    (async () => {
      try {
        const res = await fetchFriends();
        setFriends(
          res.items.map((item) => ({
            id: item.user.id,
            name: item.user.username,
            avatar:
              item.user.avatar || 'https://i.pravatar.cc/150?u=' + item.user.id,
            bio: item.user.bio,
            isOnline: item.user.isOnline,
          })),
        );
      } catch {
        // im lặng, không chặn UI
      }
    })();
  }, [activeTab]);

  // Đợi hydrate xong rồi mới quyết định redirect / render
  if (!hydrated) return null;
  if (!currentUser) return null; // hoặc show loading

  const handleSearch = async () => {
    const q = searchTerm.trim();
    if (!q) return;
    try {
      setSearchLoading(true);
      setSearchError(null);
      const url = new URL(`${API_BASE_URL}/users/search`);
      url.searchParams.set('username', q);
      url.searchParams.set('page', '1');
      url.searchParams.set('limit', '20');

      type SearchUserItem = {
        id: string;
        username: string;
        avatar?: string | null;
        bio?: string | null;
        isOnline: boolean;
        createdAt: string;
      };

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'content-type': 'application/json' },
      });

      const data = (await res.json().catch(() => ({}))) as {
        items?: SearchUserItem[];
      };
      if (!res.ok) {
        throw new Error(
          (data as any)?.message || `Request failed (${res.status})`,
        );
      }

      const items = data.items ?? [];
      setSearchResults(
        items.map((u: SearchUserItem) => ({
          id: u.id,
          name: u.username,
          avatar: u.avatar || 'https://i.pravatar.cc/150?u=' + u.id,
          bio: u.bio,
          isOnline: u.isOnline,
        })),
      );
    } catch (e: any) {
      setSearchError(e.message || 'Không thể tìm kiếm người dùng');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      setFollowLoadingId(userId);
      if (followedIds.has(userId)) {
        await unfollowUserApi(userId);
        setFollowedIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
        show('Đã hủy lời mời kết bạn', 'info');
      } else {
        await followUserApi(userId);
        setFollowedIds((prev) => new Set(prev).add(userId));
        show('Đã gửi lời mời kết bạn', 'success');
      }
    } catch (e: any) {
      const msg = e?.message || 'Không thể xử lý kết bạn';
      if (msg.toLowerCase().includes('unauthorized')) {
        // Token hết hạn hoặc chưa đăng nhập
        clearTokens();
        show('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'info');
        router.push('/login');
      } else {
        show(msg, 'error');
      }
    } finally {
      setFollowLoadingId(null);
    }
  };

  const handleFriendRequestAction = async (
    notificationId: string,
    action: 'accept' | 'reject',
  ) => {
    try {
      setFriendRequestLoadingId(notificationId);
      if (action === 'accept') {
        await acceptFriendRequestApi(notificationId);
        show('Đã chấp nhận lời mời kết bạn', 'success');
      } else {
        await rejectFriendRequestApi(notificationId);
        show('Đã từ chối lời mời kết bạn', 'info');
      }
      setFriendRequests((prev) =>
        prev.filter((req) => req.id !== notificationId),
      );
    } catch (e: any) {
      show(
        e?.message || 'Không thể xử lý lời mời kết bạn, vui lòng thử lại',
        'error',
      );
    } finally {
      setFriendRequestLoadingId(null);
    }
  };

  return (
    <main className="flex h-screen overflow-hidden bg-[#F0F2F5] dark:bg-[#18191A] text-[#050505] dark:text-[#E4E6EB]">
      
      {/* Navigation Rail - Leftmost */}
      <nav className="hidden md:flex flex-col items-center py-3 w-[72px] border-r border-[#E4E6EB] dark:border-[#3E4042] bg-white dark:bg-[#242526] flex-shrink-0 z-20">
         <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center mb-4 mt-2">
            <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.096 2 11.15C2 13.902 3.496 16.35 5.8 17.84V20.9C5.8 21.36 6.305 21.65 6.702 21.41L10.05 19.57C10.686 19.68 11.336 19.74 12 19.74C17.523 19.74 22 15.645 22 10.59C22 5.536 17.523 2 12 2Z"/></svg>
         </div>
         
         <div className="flex flex-col gap-1 w-full px-2">
            <button 
               onClick={() => setActiveTab('chats')}
               className={cn(
                  "group h-12 w-full flex items-center justify-center relative rounded-lg transition-colors",
                  activeTab === 'chats' ? "bg-[#E7F3FF] dark:bg-[#3A3B3C]" : "hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C]"
               )}
            >
               {activeTab === 'chats' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#1877F2] rounded-r-full"></div>}
               <div className={cn("p-2 rounded-lg", activeTab === 'chats' ? "text-[#1877F2]" : "text-[#65676B] dark:text-[#B0B3B8]")}>
                 <MessageCircle className="w-6 h-6" />
               </div>
            </button>
            <button 
               onClick={() => setActiveTab('search')}
               className={cn(
                  "group h-12 w-full flex items-center justify-center relative rounded-lg transition-colors",
                  activeTab === 'search' ? "bg-[#E7F3FF] dark:bg-[#3A3B3C]" : "hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C]"
               )}
            >
               {activeTab === 'search' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#1877F2] rounded-r-full"></div>}
               <div className={cn("p-2 rounded-lg", activeTab === 'search' ? "text-[#1877F2]" : "text-[#65676B] dark:text-[#B0B3B8]")}>
                  <Search className="w-6 h-6" />
               </div>
            </button>
            <button 
               onClick={() => setActiveTab('people')}
               className={cn(
                  "group h-12 w-full flex items-center justify-center relative rounded-lg transition-colors",
                  activeTab === 'people' ? "bg-[#E7F3FF] dark:bg-[#3A3B3C]" : "hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C]"
               )}
            >
               {activeTab === 'people' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#1877F2] rounded-r-full"></div>}
               <div className={cn("p-2 rounded-lg", activeTab === 'people' ? "text-[#1877F2]" : "text-[#65676B] dark:text-[#B0B3B8]")}>
                  <Users className="w-6 h-6" />
               </div>
            </button>
            <button 
               onClick={() => setActiveTab('friends')}
               className={cn(
                  "group h-12 w-full flex items-center justify-center relative rounded-lg transition-colors",
                  activeTab === 'friends' ? "bg-[#E7F3FF] dark:bg-[#3A3B3C]" : "hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C]"
               )}
            >
               {activeTab === 'friends' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#1877F2] rounded-r-full"></div>}
               <div className={cn("p-2 rounded-lg", activeTab === 'friends' ? "text-[#1877F2]" : "text-[#65676B] dark:text-[#B0B3B8]")}>
                  <UserCheck className="w-6 h-6" />
               </div>
            </button>
            <button 
               onClick={() => setActiveTab('videos')}
               className={cn(
                  "group h-12 w-full flex items-center justify-center relative rounded-lg transition-colors",
                  activeTab === 'videos' ? "bg-[#E7F3FF] dark:bg-[#3A3B3C]" : "hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C]"
               )}
            >
               {activeTab === 'videos' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#1877F2] rounded-r-full"></div>}
               <div className={cn("p-2 rounded-lg", activeTab === 'videos' ? "text-[#1877F2]" : "text-[#65676B] dark:text-[#B0B3B8]")}>
                  <Film className="w-6 h-6" />
               </div>
            </button>
            <button 
               onClick={() => setActiveTab('calls')}
               className={cn(
                  "group h-12 w-full flex items-center justify-center relative rounded-lg transition-colors",
                  activeTab === 'calls' ? "bg-[#E7F3FF] dark:bg-[#3A3B3C]" : "hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C]"
               )}
            >
               {activeTab === 'calls' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#1877F2] rounded-r-full"></div>}
               <div className={cn("p-2 rounded-lg", activeTab === 'calls' ? "text-[#1877F2]" : "text-[#65676B] dark:text-[#B0B3B8]")}>
                  <Phone className="w-6 h-6" />  
               </div>
            </button>
         </div>
         
         <div className="mt-auto flex flex-col gap-3 items-center w-full px-2 pb-2">
             <button 
                onClick={() => setIsSettingsOpen(true)}
                className="text-[#65676B] dark:text-[#B0B3B8] hover:text-[#050505] dark:hover:text-[#E4E6EB] p-2 rounded-lg hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C] transition-colors"
                title="Settings"
             >
                <Settings className="w-6 h-6" />
             </button>
             <div 
                onClick={() => setIsProfileOpen(true)} 
                className="w-10 h-10 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                title="Profile"
             >
                <img src={currentUser?.avatar || "https://i.pravatar.cc/150?u=me"} alt="Me" className="w-full h-full object-cover" />
             </div>
         </div>
      </nav>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <UploadReelModal
        isOpen={isUploadReelOpen}
        onClose={() => setIsUploadReelOpen(false)}
        onSubmit={({ title, videoUrl, videoFile }) => {
          // Handle file upload (tạm thời tạo object URL, sau này sẽ upload lên server)
          let finalVideoUrl = videoUrl;
          if (videoFile) {
            // Tạo object URL để preview (tạm thời)
            finalVideoUrl = URL.createObjectURL(videoFile);
            // TODO: Upload file lên server và lấy URL thực tế
          }

          setReels((prev) => [
            {
              id: `reel-${Date.now()}`,
              title,
              creator: currentUser.name,
              views: '0',
              duration: '0:30',
              thumbnail: `https://picsum.photos/200/320?random=${Math.floor(Math.random() * 1000)}`,
              videoUrl: finalVideoUrl || '',
            },
            ...prev,
          ]);
        }}
      />

      <Modal
        isOpen={Boolean(conversationToDelete)}
        onClose={() => setConversationToDelete(null)}
        title="Xác nhận"
        className="max-w-[420px]"
      >
        <p className="text-sm text-[#1c2b41] dark:text-[#E4E6EB] mb-5 leading-6">
          Toàn bộ nội dung trò chuyện sẽ bị xóa vĩnh viễn.
          <br />
          Bạn có chắc chắn muốn xóa?
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setConversationToDelete(null)}
            className="min-w-[88px] h-10 px-3 rounded-md bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#1c2b41] dark:text-[#E4E6EB] text-base font-semibold hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] transition-colors"
          >
            Không
          </button>
          <button
            type="button"
            onClick={() => {
              if (!conversationToDelete) return;
              void removeConversation(conversationToDelete)
                .then(() => setConversationToDelete(null))
                .catch((err: any) => {
                  show(err?.message || 'Không thể xóa cuộc trò chuyện', 'error');
                });
            }}
            className="min-w-[88px] h-10 px-3 rounded-md bg-[#D91C1C] text-white text-base font-semibold hover:bg-[#b61717] transition-colors"
          >
            Xóa
          </button>
        </div>
      </Modal>

      {/* Left Sidebar - Chat List */}
      <aside className={cn(
        "flex-col w-full md:w-[360px] border-r border-[#E4E6EB] dark:border-[#3E4042] bg-white dark:bg-[#242526]",
        (activeTab === 'videos' && selectedVideoId) || (activeTab !== 'videos' && activeConversationId) ? "hidden md:flex" : "flex"
      )}>
        <div className="p-3 h-[60px] flex items-center justify-between border-b border-[#E4E6EB] dark:border-[#3E4042] flex-shrink-0">
           <h1 className="text-2xl font-bold text-[#050505] dark:text-[#E4E6EB]">
             {activeTab === 'chats'
               ? 'Chats'
               : activeTab === 'search'
               ? 'Search'
               : activeTab === 'people'
               ? 'People'
               : activeTab === 'friends'
               ? 'Friends'
               : activeTab === 'videos'
               ? 'Short Videos'
               : 'Calls'}
           </h1>
           <div className="flex items-center gap-2">
             {activeTab === 'search' ? (
               <div className="flex items-center gap-2">
                 <div className="relative">
                   <Search className="w-4 h-4 text-[#65676B] dark:text-[#B0B3B8] absolute left-2 top-1/2 -translate-y-1/2" />
                   <input
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         void handleSearch();
                       }
                     }}
                     placeholder="Tìm theo tên hoặc số điện thoại"
                     className="pl-8 pr-3 py-1.5 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] text-sm text-[#050505] dark:text-[#E4E6EB] outline-none w-52"
                   />
                 </div>
                 <button
                   onClick={() => void handleSearch()}
                   disabled={searchLoading}
                   className="w-9 h-9 rounded-full bg-[#1877F2] flex items-center justify-center hover:bg-[#166FE5] disabled:opacity-60 transition-colors"
                 >
                   <Search className="w-5 h-5 text-white" />
                 </button>
               </div>
             ) : (
               <button className="w-9 h-9 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] flex items-center justify-center hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] transition-colors">
                 <Search className="w-5 h-5 text-[#050505] dark:text-[#E4E6EB]" />
               </button>
             )}
             {activeTab === 'people' && (
               <button
                 onClick={() => setShowFriendRequests((prev) => !prev)}
                 className="px-3 h-9 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] text-xs font-semibold text-[#050505] dark:text-[#E4E6EB] flex items-center gap-2 hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] transition-colors"
               >
                 Lời mời
                 {friendRequests.length > 0 && (
                   <span className="min-w-[18px] h-[18px] rounded-full bg-[#1877F2] text-white text-[10px] flex items-center justify-center">
                     {friendRequests.length}
                   </span>
                 )}
               </button>
             )}
             {activeTab === 'chats' && (
                <button className="w-9 h-9 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] flex items-center justify-center hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] transition-colors">
                  <svg className="w-5 h-5 text-[#050505] dark:text-[#E4E6EB]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                </button>
             )}
             {activeTab === 'videos' && (
               <button
                 className="flex items-center gap-1 px-3 h-9 rounded-full bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-semibold transition-colors"
                 onClick={() => setIsUploadReelOpen(true)}
               >
                 <Plus className="w-4 h-4" />
                 Đăng video
               </button>
             )}
           </div>
        </div>
        <div className="flex-1 overflow-y-auto">
           {activeTab === 'chats' && conversations.map((conversation) => {
             const isActive = activeConversationId === conversation.id;
             const otherParticipant = conversation.participants.find(p => p.id !== 'me') || conversation.participants[0];
             const lastMessage = conversation.messages[conversation.messages.length - 1];
             
             return (
               <div 
                  key={conversation.id} 
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 transition-colors",
                    isActive 
                      ? "bg-[#E7F3FF] dark:bg-[#2F3A4A]" 
                      : "hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C]"
                  )}
               >
                  <button
                    type="button"
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    onClick={() => {
                      if (suppressOpenConversationRef.current) {
                        suppressOpenConversationRef.current = false;
                        return;
                      }
                      setActiveConversation(conversation.id);
                    }}
                  >
                    <div className="relative flex-shrink-0">
                      <div className={cn(
                        "w-12 h-12 rounded-full overflow-hidden",
                        isActive ? "ring-2 ring-[#1877F2]" : ""
                      )}>
                        <img 
                          src={otherParticipant.avatar}
                          alt={otherParticipant.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#242526]"></span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[15px] font-semibold truncate text-[#050505] dark:text-[#E4E6EB]">
                          {otherParticipant.name}
                        </h3>
                        {lastMessage && (
                          <span className={cn(
                            "text-xs ml-2 flex-shrink-0",
                            isActive ? "text-[#1877F2]" : "text-[#65676B] dark:text-[#B0B3B8]"
                          )}>
                            {new Date(lastMessage.createdAt).getMinutes() % 2 === 0 ? '2m' : '1h'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <p className={cn(
                          "text-sm truncate flex-1",
                          isActive ? "text-[#050505] dark:text-[#E4E6EB]" : "text-[#65676B] dark:text-[#B0B3B8]",
                          lastMessage?.senderId === 'me' && "italic"
                        )}>
                          {lastMessage ? (lastMessage.senderId === 'me' ? `You: ${lastMessage.content}` : lastMessage.content) : 'No messages yet'}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-[#1877F2] text-white text-xs flex items-center justify-center font-semibold flex-shrink-0">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    title="Xóa cuộc trò chuyện"
                    className="w-7 h-7 rounded-full hover:bg-[#E4E6EB] dark:hover:bg-[#4E4F50] flex items-center justify-center flex-shrink-0"
                    onPointerDown={(e) => {
                      suppressOpenConversationRef.current = true;
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onMouseDown={(e) => {
                      suppressOpenConversationRef.current = true;
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      suppressOpenConversationRef.current = true;
                      e.preventDefault();
                      e.stopPropagation();
                      setConversationToDelete(conversation.id);
                    }}
                  >
                    <MoreHorizontal className="w-4 h-4 text-[#65676B] dark:text-[#B0B3B8]" />
                  </button>
               </div>
             );
           })}

          {activeTab === 'people' && (
            <div className="p-2">
               {showFriendRequests && friendRequests.length > 0 && (
                 <>
                   <div className="mb-2 px-2 text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8] uppercase">
                     Lời mời kết bạn
                   </div>
                   {friendRequests.map((req) => (
                     <div
                       key={req.id}
                       className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] rounded-lg transition-colors"
                     >
                       <div className="relative flex-shrink-0">
                         <div className="w-10 h-10 rounded-full overflow-hidden">
                           <img
                             src={
                               req.fromUser.avatar ||
                               `https://i.pravatar.cc/150?u=${req.fromUser.id}`
                             }
                             alt={req.fromUser.username}
                             className="w-full h-full object-cover"
                           />
                         </div>
                       </div>
                       <div className="flex-1 min-w-0">
                         <h3 className="text-[15px] font-semibold text-[#050505] dark:text-[#E4E6EB] truncate">
                           {req.fromUser.username}
                         </h3>
                         <p className="text-xs text-[#65676B] dark:text-[#B0B3B8]">
                           Đã gửi lời mời kết bạn
                         </p>
                       </div>
                       <div className="flex flex-shrink-0 gap-2">
                         <button
                           onClick={() =>
                             void handleFriendRequestAction(req.id, 'accept')
                           }
                           disabled={friendRequestLoadingId === req.id}
                           className="px-3 py-1 rounded-full text-xs font-semibold bg-[#1877F2] text-white hover:bg-[#166FE5] disabled:opacity-60 transition-colors"
                         >
                           Chấp nhận
                         </button>
                         <button
                           onClick={() =>
                             void handleFriendRequestAction(req.id, 'reject')
                           }
                           disabled={friendRequestLoadingId === req.id}
                           className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] disabled:opacity-60 transition-colors"
                         >
                           Từ chối
                         </button>
                       </div>
                     </div>
                   ))}
                   <div className="h-px bg-[#E4E6EB] dark:bg-[#3A3B3C] my-2" />
                 </>
               )}
               {showFriendRequests && friendRequests.length === 0 && (
                 <>
                   <div className="mb-2 px-2 text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8] uppercase">
                     Lời mời kết bạn
                   </div>
                   <div className="px-2 py-2 text-xs text-[#65676B] dark:text-[#B0B3B8]">
                     Chưa có lời mời kết bạn nào
                   </div>
                   <div className="h-px bg-[#E4E6EB] dark:bg-[#3A3B3C] my-2" />
                 </>
               )}
               <div className="mb-2 px-2 text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8] uppercase">Gợi ý kết bạn</div>
               {OTHER_USERS.map((user, idx) => (
                 <div key={user.id} className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] rounded-lg transition-colors">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      </div>
                      {(idx % 3 !== 0) && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#242526]"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                       <h3 className="text-[15px] font-semibold text-[#050505] dark:text-[#E4E6EB]">{user.name}</h3>
                       <p className="text-xs text-[#65676B] dark:text-[#B0B3B8]">{(idx % 3 !== 0) ? 'Active now' : 'Active 10m ago'}</p>
                    </div>
                 </div>
               ))}
             </div>
          )}

          {activeTab === 'friends' && (
            <div className="p-2">
              <div className="mb-2 px-2 text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8] uppercase">
                Bạn bè
              </div>
              {friends.length === 0 && (
                <div className="px-2 py-2 text-xs text-[#65676B] dark:text-[#B0B3B8]">
                  Chưa có bạn bè nào
                </div>
              )}
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  onClick={() => {
                    void openConversationWithUser({
                      id: friend.id,
                      name: friend.name,
                      avatar: friend.avatar,
                    }).catch((e: any) => {
                      show(e?.message || 'Không thể mở cuộc trò chuyện', 'error');
                    });
                  }}
                  className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] rounded-lg transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <img
                        src={friend.avatar}
                        alt={friend.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {friend.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#242526]"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-[#050505] dark:text-[#E4E6EB] truncate">
                      {friend.name}
                    </h3>
                    {friend.bio && (
                      <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] truncate">
                        {friend.bio}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'search' && (
            <div className="p-2">
               {friendRequests.length > 0 && (
                 <>
                   <div className="mb-2 px-2 text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8] uppercase">
                     Lời mời kết bạn
                   </div>
                   {friendRequests.map((req) => (
                     <div
                       key={req.id}
                       className="flex items-center gap-3 px-2 py-2 rounded-lg bg-[#E4E6EB] dark:bg-[#3A3B3C] mb-1"
                     >
                       <div className="relative flex-shrink-0">
                         <div className="w-10 h-10 rounded-full overflow-hidden">
                           <img
                             src={
                               req.fromUser.avatar ||
                               `https://i.pravatar.cc/150?u=${req.fromUser.id}`
                             }
                             alt={req.fromUser.username}
                             className="w-full h-full object-cover"
                           />
                         </div>
                       </div>
                       <div className="flex-1 min-w-0">
                         <h3 className="text-[15px] font-semibold text-[#050505] dark:text-[#E4E6EB] truncate">
                           {req.fromUser.username}
                         </h3>
                         <p className="text-xs text-[#65676B] dark:text-[#B0B3B8]">
                           Đã gửi lời mời kết bạn
                         </p>
                       </div>
                      <div className="flex flex-shrink-0 gap-2">
                        <button
                          onClick={() =>
                            void handleFriendRequestAction(req.id, 'accept')
                          }
                          disabled={friendRequestLoadingId === req.id}
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-[#1877F2] text-white hover:bg-[#166FE5] disabled:opacity-60 transition-colors"
                        >
                          Chấp nhận
                        </button>
                        <button
                          onClick={() =>
                            void handleFriendRequestAction(req.id, 'reject')
                          }
                          disabled={friendRequestLoadingId === req.id}
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F0F2F5] dark:bg-[#4E4F50] text-[#050505] dark:text-[#E4E6EB] hover:bg-[#D8DADF] dark:hover:bg-[#5A5B5D] disabled:opacity-60 transition-colors"
                        >
                          Từ chối
                        </button>
                      </div>
                     </div>
                   ))}
                   <div className="h-px bg-[#E4E6EB] dark:bg-[#3A3B3C] my-2" />
                 </>
               )}
               {searchError && (
                 <div className="mb-2 px-2 text-xs text-red-500">
                   {searchError}
                 </div>
               )}
               {searchLoading && (
                 <div className="px-2 py-2 text-sm text-[#65676B] dark:text-[#B0B3B8]">
                   Đang tìm kiếm...
                 </div>
               )}
               {!searchLoading && searchResults.length > 0 && (
                 <>
                   <div className="mb-2 px-2 text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8] uppercase">
                     Kết quả tìm kiếm
                   </div>
                   {searchResults.map((user) => (
                     <div key={user.id} className="flex items-center gap-3 px-2 py-2 hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] rounded-lg transition-colors">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-full overflow-hidden">
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          </div>
                          {user.isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#242526]"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                           <h3 className="text-[15px] font-semibold text-[#050505] dark:text-[#E4E6EB]">{user.name}</h3>
                           {user.bio && (
                             <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] truncate">{user.bio}</p>
                           )}
                        </div>
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => void handleFollow(user.id)}
                            disabled={followLoadingId === user.id}
                            className="px-3 py-1 rounded-full text-xs font-semibold border border-[#1877F2] text-[#1877F2] hover:bg-[#1877F2] hover:text-white disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-[#1877F2] transition-colors"
                          >
                            {followLoadingId === user.id
                              ? followedIds.has(user.id)
                                ? 'Đang hủy...'
                                : 'Đang gửi...'
                              : followedIds.has(user.id)
                              ? 'Đã gửi lời mời'
                              : 'Kết bạn'}
                          </button>
                        </div>
                     </div>
                   ))}
                 </>
               )}
             </div>
           )}

           {activeTab === 'videos' && (
              <div className="p-2 space-y-3">
                {reels.map((reel) => (
                  <div
                    key={reel.id}
                    onClick={() => setSelectedVideoId(reel.id)}
                    className={cn(
                      "flex items-center gap-3 px-2 py-2 cursor-pointer rounded-lg transition-colors",
                      selectedVideoId === reel.id
                        ? "bg-[#E7F3FF] dark:bg-[#2F3A4A]"
                        : "hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C]"
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-24 rounded-lg overflow-hidden bg-[#E4E6EB] dark:bg-[#3A3B3C]">
                        <img
                          src={reel.thumbnail}
                          alt={reel.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px]">
                        {reel.duration}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-semibold text-[#050505] dark:text-[#E4E6EB] truncate">
                        {reel.title}
                      </h3>
                      <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] truncate">
                        {reel.creator}
                      </p>
                      <p className="text-xs text-[#65676B] dark:text-[#B0B3B8]">
                        {reel.views} views · 1h ago
                      </p>
                    </div>
                  </div>
                ))}
              </div>
           )}

           {activeTab === 'calls' && (
              <div className="p-2">
                 {MOCK_CALLS.map((call) => (
                    <div key={call.id} className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] rounded-lg transition-colors">
                       <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-full overflow-hidden">
                             <img src={call.participant.avatar} alt={call.participant.name} className="w-full h-full object-cover" />
                          </div>
                       </div>
                       <div className="flex-1 min-w-0">
                          <h3 className="text-[15px] font-semibold text-[#050505] dark:text-[#E4E6EB]">{call.participant.name}</h3>
                          <div className="flex items-center gap-1 text-xs text-[#65676B] dark:text-[#B0B3B8]">
                             {call.type === 'incoming' && <PhoneIncoming size={12} />}
                             {call.type === 'outgoing' && <PhoneOutgoing size={12} />}
                             {call.type === 'missed' && <PhoneMissed size={12} className="text-red-500" />}
                             <span>
                                {call.type === 'missed' ? 'Missed' : call.type === 'incoming' ? 'Incoming' : 'Outgoing'}
                                {' • '}
                                {format(call.date, 'MMM d, h:mm a')}
                             </span>
                          </div>
                       </div>
                       <div className="flex items-center gap-1">
                          <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E4E6EB] dark:hover:bg-[#4E4F50] transition-colors">
                              <Phone size={20} className="text-[#050505] dark:text-[#E4E6EB]" />
                          </button>
                          <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E4E6EB] dark:hover:bg-[#4E4F50] transition-colors">
                              <Video size={20} className="text-[#050505] dark:text-[#E4E6EB]" />
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           )}
        </div>
      </aside>

      {/* Middle - Chat Window or Video Player */}
      <section className={cn(
        "flex-1 min-w-0 relative flex flex-col bg-white dark:bg-[#18191A]",
        (activeTab === 'videos' && selectedVideoId) || (activeTab !== 'videos' && activeConversationId) ? "flex" : "hidden md:flex"
      )}>
        {activeTab === 'videos' && selectedVideoId ? (
          (() => {
            const selectedVideo = reels.find(r => r.id === selectedVideoId);
            if (!selectedVideo) return null;
            return (
              <VideoPlayer
                video={selectedVideo}
                isLiked={likedVideos.has(selectedVideoId)}
                onNavigate={navigateVideo}
                onLike={() => {
                  setLikedVideos(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(selectedVideoId)) {
                      newSet.delete(selectedVideoId);
                    } else {
                      newSet.add(selectedVideoId);
                    }
                    return newSet;
                  });
                }}
                onShare={() => {
                  // TODO: Implement share functionality
                  console.log('Share video:', selectedVideoId);
                }}
              />
            );
          })()
        ) : activeConversationId ? (
          <ChatWindow />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] flex items-center justify-center">
                {activeTab === 'videos' ? (
                  <Film className="w-12 h-12 text-[#65676B] dark:text-[#B0B3B8]" />
                ) : (
                  <MessageCircle className="w-12 h-12 text-[#65676B] dark:text-[#B0B3B8]" />
                )}
              </div>
              <p className="text-[#65676B] dark:text-[#B0B3B8] text-lg">
                {activeTab === 'videos' ? 'Chọn video để xem' : 'Select a chat to start messaging'}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Right Sidebar - Details or Comments */}
      <aside className={cn(
          "w-[360px] border-l border-[#E4E6EB] dark:border-[#3E4042] bg-white dark:bg-[#242526] hidden lg:flex flex-col",
          (activeTab === 'videos' && selectedVideoId) || (activeTab !== 'videos' && activeConversationId) ? "flex" : "lg:hidden xl:flex"
      )}>
         {activeTab === 'videos' && selectedVideoId ? (
           <CommentSection videoId={selectedVideoId} />
         ) : activeConversationId ? (
             <>
                <div className="p-6 flex flex-col items-center border-b border-[#E4E6EB] dark:border-[#3E4042]">
                    <div className="w-24 h-24 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] mb-4 overflow-hidden">
                      <img src="https://i.pravatar.cc/150?u=alice" alt="Alice" className="w-full h-full object-cover" />
                    </div>
                    <h2 className="text-xl font-semibold text-[#050505] dark:text-[#E4E6EB] mb-1">Alice</h2>
                    <p className="text-sm text-[#65676B] dark:text-[#B0B3B8]">Active 5m ago</p>
                </div>
                <div className="p-4 space-y-4">
                    <h3 className="text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8] uppercase tracking-wider">Shared Media</h3>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="aspect-square bg-[#E4E6EB] dark:bg-[#3A3B3C] rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                          <img src="https://picsum.photos/200/200?random=1" alt="Media" className="w-full h-full object-cover" />
                        </div>
                        <div className="aspect-square bg-[#E4E6EB] dark:bg-[#3A3B3C] rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                          <img src="https://picsum.photos/200/200?random=2" alt="Media" className="w-full h-full object-cover" />
                        </div>
                        <div className="aspect-square bg-[#E4E6EB] dark:bg-[#3A3B3C] rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                          <img src="https://picsum.photos/200/200?random=3" alt="Media" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>
             </>
         ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-[#65676B] dark:text-[#B0B3B8]">
                Details
            </div>
         )}
      </aside>

    </main>
  );
}
