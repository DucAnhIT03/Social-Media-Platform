import React, { useEffect, useState } from 'react';
import { Image, Video, Smile, ThumbsUp, MessageSquare, Share2, MoreHorizontal, Globe, Users, Search, MoreVertical, Send } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import CreatePostModal from '../../../components/ui/CreatePostModal';
import CreateStoryModal from '../../../components/ui/CreateStoryModal';
import ShareModal from '../../../components/ui/ShareModal';
import {
  createPost,
  fetchFeedPosts,
  uploadPostMedia,
  type FeedPost,
  type UploadMediaType,
} from '@/api/posts';

const STORIES = [
  { id: 1, user: 'Your Story', avatar: 'https://picsum.photos/seed/user1/40/40', image: 'https://picsum.photos/seed/story1/150/250', isUser: true },
  { id: 2, user: 'Alex Chen', avatar: 'https://picsum.photos/seed/alex/40/40', image: 'https://picsum.photos/seed/story2/150/250' },
  { id: 3, user: 'Maria Garcia', avatar: 'https://picsum.photos/seed/maria/40/40', image: 'https://picsum.photos/seed/story3/150/250' },
  { id: 4, user: 'David Lee', avatar: 'https://picsum.photos/seed/david/40/40', image: 'https://picsum.photos/seed/story4/150/250' },
  { id: 5, user: 'Emma Wilson', avatar: 'https://picsum.photos/seed/emma/40/40', image: 'https://picsum.photos/seed/story5/150/250' },
];

const POSTS = [
  {
    id: 1,
    user: { name: 'Tech Insider', avatar: 'https://picsum.photos/seed/techpage/50/50', time: '2 hrs', isPage: true },
    content: 'Just announced: The new quantum processor that will revolutionize computing as we know it. What are your thoughts on this massive leap in technology? 🚀💻 #TechNews #Innovation',
    image: 'https://picsum.photos/seed/quantum/800/450',
    stats: { likes: '12K', comments: '1.2K', shares: '4.5K' },
    liked: false
  },
  {
    id: 2,
    user: { name: 'Sarah Jenkins', avatar: 'https://picsum.photos/seed/sarah/50/50', time: '5 hrs', isPage: false },
    content: 'Finally took that weekend trip to the mountains! The views were absolutely breathtaking. Nature really is the best medicine. 🌲⛰️✨',
    image: 'https://picsum.photos/seed/mountain/800/600',
    stats: { likes: '245', comments: '42', shares: '5' },
    liked: true
  },
  {
    id: 3,
    user: { name: 'Cooking Masterclass', avatar: 'https://picsum.photos/seed/cookingpage/50/50', time: '8 hrs', isPage: true },
    content: 'Secret to the perfect homemade pizza dough? It\'s all about the resting time. Check out our full recipe below! 🍕👨‍🍳',
    image: 'https://picsum.photos/seed/pizza/800/800',
    stats: { likes: '8.5K', comments: '956', shares: '2.1K' },
    liked: false
  },
  {
    id: 4,
    user: { name: 'Alex Chen', avatar: 'https://picsum.photos/seed/alex/50/50', time: '1 day', isPage: false },
    content: 'Just finished setting up my new workspace! Ready to tackle some big projects this year. 💻☕',
    image: 'https://picsum.photos/seed/workspace/800/500',
    stats: { likes: '156', comments: '18', shares: '2' },
    liked: false
  }
];

const CONTACTS = [
  { name: 'Alex Chen', online: true, seed: 'alex' },
  { name: 'Maria Garcia', online: true, seed: 'maria' },
  { name: 'David Lee', online: false, seed: 'david' },
  { name: 'Emma Wilson', online: true, seed: 'emma' },
  { name: 'James Smith', online: true, seed: 'james' },
  { name: 'Olivia Johnson', online: false, seed: 'olivia' },
  { name: 'William Brown', online: true, seed: 'william' },
  { name: 'Sophia Davis', online: true, seed: 'sophia' },
];

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | number | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [posts, setPosts] = useState(POSTS);

  useEffect(() => {
    if (searchParams.get('createPost') !== '1') {
      return;
    }

    setIsCreatePostOpen(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('createPost');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    let cancelled = false;

    const loadFeed = async () => {
      try {
        const response = await fetchFeedPosts(1, 20);
        if (cancelled || response.items.length === 0) {
          return;
        }

        const apiPosts = response.items.map((item: FeedPost) => ({
          id: item.id,
          user: {
            name: item.author.username,
            avatar: item.author.avatar || `https://picsum.photos/seed/${item.author.id}/50/50`,
            time: 'Vừa xong',
            isPage: false,
          },
          content: item.content,
          image: item.imageUrl || undefined,
          postType: item.postType,
          shortVideoUrl: item.shortVideoUrl,
          stats: { likes: '0', comments: '0', shares: '0' },
          liked: false,
        }));

        setPosts(apiPosts as any);
      } catch {
        // Keep local mock posts if feed API is not available.
      }
    };

    void loadFeed();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreatePost = async (payload: {
    content: string;
    imageUrl?: string;
    postType?: 'POST' | 'SHORT_VIDEO';
    shortVideoUrl?: string;
  }) => {
    const created = await createPost(payload);

    const newPost = {
      id: created.id,
      user: {
        name: created.author.username,
        avatar: created.author.avatar || `https://picsum.photos/seed/${created.author.id}/50/50`,
        time: 'Vừa xong',
        isPage: false,
      },
      content: created.content,
      image: created.imageUrl || undefined,
      postType: created.postType,
      shortVideoUrl: created.shortVideoUrl,
      stats: { likes: '0', comments: '0', shares: '0' },
      liked: false,
    };

    setPosts((prev) => [newPost as any, ...prev]);
  };

  const handleUploadMedia = async (file: File, mediaType: UploadMediaType) => {
    const uploaded = await uploadPostMedia(file, mediaType);
    return uploaded.url;
  };

  const toggleComment = (postId: string | number) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
    } else {
      setActiveCommentPostId(postId);
    }
  };

  return (
    <div className="flex justify-center gap-8 h-full">
      {/* Center Feed Column */}
      <div className="flex-1 max-w-[680px] overflow-y-auto custom-scrollbar pb-20 space-y-6">
        
        {/* Stories Section */}
        <div className="flex space-x-2 overflow-x-auto custom-scrollbar pb-2">
          {STORIES.map((story) => (
            <div 
              key={story.id} 
              className="relative w-28 h-48 rounded-xl overflow-hidden shrink-0 cursor-pointer group"
              onClick={() => story.isUser && setIsCreateStoryOpen(true)}
            >
              <img src={story.image} alt="Story" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80"></div>
              
              {story.isUser ? (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex flex-col items-center w-full">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-[#1A1A1A] -mb-4 z-10">
                    <span className="text-white text-lg font-bold leading-none">+</span>
                  </div>
                  <div className="bg-[#1A1A1A] w-full pt-5 pb-2 text-center">
                    <span className="text-white text-xs font-medium">Create Story</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="absolute top-3 left-3 w-10 h-10 rounded-full border-4 border-blue-500 overflow-hidden">
                    <img src={story.avatar} alt={story.user} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <span className="absolute bottom-3 left-3 text-white text-sm font-medium leading-tight pr-2">
                    {story.user}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Create Post Box */}
        <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] p-4 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <img src="https://picsum.photos/seed/user1/40/40" alt="User" className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
            <div 
              onClick={() => setIsCreatePostOpen(true)}
              className="flex-1 bg-[#2A2A2A] hover:bg-[#333333] text-gray-400 rounded-full px-4 py-2.5 cursor-pointer transition-colors flex items-center"
            >
              Bạn đang nghĩ gì?
            </div>
          </div>
          <div className="border-t border-[#2A2A2A] pt-3 flex justify-between">
            <button 
              onClick={() => setIsCreatePostOpen(true)}
              className="flex-1 flex items-center justify-center space-x-2 hover:bg-[#2A2A2A] py-2 rounded-lg transition-colors text-gray-400 font-medium"
            >
              <Video className="w-6 h-6 text-red-500" />
              <span>Video trực tiếp</span>
            </button>
            <button 
              onClick={() => setIsCreatePostOpen(true)}
              className="flex-1 flex items-center justify-center space-x-2 hover:bg-[#2A2A2A] py-2 rounded-lg transition-colors text-gray-400 font-medium"
            >
              <Image className="w-6 h-6 text-green-500" />
              <span>Ảnh/Video</span>
            </button>
            <button 
              onClick={() => setIsCreatePostOpen(true)}
              className="flex-1 flex items-center justify-center space-x-2 hover:bg-[#2A2A2A] py-2 rounded-lg transition-colors text-gray-400 font-medium hidden sm:flex"
            >
              <Smile className="w-6 h-6 text-yellow-500" />
              <span>Cảm xúc/Hoạt động</span>
            </button>
          </div>
        </div>

        {/* Feed Posts */}
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] shadow-sm overflow-hidden">
              {/* Post Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img src={post.user.avatar} alt={post.user.name} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <h3 className="text-white font-semibold text-[15px] hover:underline cursor-pointer">
                      {post.user.name}
                    </h3>
                    <div className="flex items-center text-gray-400 text-xs space-x-1">
                      <span>{post.user.time}</span>
                      <span>•</span>
                      {post.user.isPage ? <Globe className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-full hover:bg-[#2A2A2A] flex items-center justify-center text-gray-400 transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Post Content */}
              <div className="px-4 pb-3">
                <p className="text-gray-200 text-[15px] leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>
              </div>

              {/* Post Image */}
              {post.image && (
                <div className="w-full max-h-[600px] overflow-hidden bg-black flex items-center justify-center cursor-pointer">
                  <img src={post.image} alt="Post content" className="w-full object-contain max-h-[600px]" referrerPolicy="no-referrer" />
                </div>
              )}

              {/* Post Stats */}
              <div className="px-4 py-3 flex items-center justify-between text-gray-400 text-sm border-b border-[#2A2A2A] mx-4">
                <div className="flex items-center space-x-1.5 cursor-pointer hover:underline">
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <ThumbsUp className="w-3 h-3 text-white fill-white" />
                  </div>
                  <span>{post.stats.likes}</span>
                </div>
                <div className="flex space-x-3">
                  <span className="cursor-pointer hover:underline">{post.stats.comments} comments</span>
                  <span className="cursor-pointer hover:underline">{post.stats.shares} shares</span>
                </div>
              </div>

              {/* Post Actions */}
              <div className="px-4 py-1 flex justify-between">
                <button className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg transition-colors font-medium ${post.liked ? 'text-blue-500 hover:bg-blue-500/10' : 'text-gray-400 hover:bg-[#2A2A2A]'}`}>
                  <ThumbsUp className={`w-5 h-5 ${post.liked ? 'fill-blue-500' : ''}`} />
                  <span>Thích</span>
                </button>
                <button 
                  onClick={() => toggleComment(post.id)}
                  className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg transition-colors text-gray-400 font-medium hover:bg-[#2A2A2A]"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Bình luận</span>
                </button>
                <button 
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg transition-colors text-gray-400 font-medium hover:bg-[#2A2A2A]"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Chia sẻ</span>
                </button>
              </div>

              {/* Comment Section */}
              {activeCommentPostId === post.id && (
                <div className="px-4 py-3 border-t border-[#2A2A2A] bg-[#1A1A1A]">
                  {/* Write comment */}
                  <div className="flex space-x-2 mb-4">
                    <img src="https://picsum.photos/seed/user1/32/32" alt="User" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                    <div className="flex-1 bg-[#3A3B3C] rounded-2xl px-3 py-2 flex items-center">
                      <input 
                        type="text" 
                        placeholder="Viết bình luận..." 
                        className="bg-transparent w-full text-[15px] text-[#E4E6EB] placeholder-[#B0B3B8] focus:outline-none" 
                        autoFocus
                      />
                      <button className="ml-2 text-blue-500 hover:text-blue-400 transition-colors">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mock Comments */}
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <img src="https://picsum.photos/seed/commenter1/32/32" alt="Commenter" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                      <div>
                        <div className="bg-[#3A3B3C] rounded-2xl px-3 py-2 inline-block">
                          <span className="font-semibold text-[13px] text-[#E4E6EB] block cursor-pointer hover:underline">Nguyễn Văn A</span>
                          <span className="text-[15px] text-[#E4E6EB]">Bài viết rất hữu ích, cảm ơn bạn đã chia sẻ!</span>
                        </div>
                        <div className="text-[12px] font-bold text-[#B0B3B8] mt-1 ml-3 flex space-x-4">
                          <button className="hover:underline cursor-pointer">Thích</button>
                          <button className="hover:underline cursor-pointer">Phản hồi</button>
                          <span className="font-normal">1 giờ</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <img src="https://picsum.photos/seed/commenter2/32/32" alt="Commenter" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                      <div>
                        <div className="bg-[#3A3B3C] rounded-2xl px-3 py-2 inline-block">
                          <span className="font-semibold text-[13px] text-[#E4E6EB] block cursor-pointer hover:underline">Trần Thị B</span>
                          <span className="text-[15px] text-[#E4E6EB]">Tuyệt vời quá 😍</span>
                        </div>
                        <div className="text-[12px] font-bold text-[#B0B3B8] mt-1 ml-3 flex space-x-4">
                          <button className="hover:underline cursor-pointer">Thích</button>
                          <button className="hover:underline cursor-pointer">Phản hồi</button>
                          <span className="font-normal">3 giờ</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Sidebar (Contacts & Sponsored) */}
      <div className="hidden xl:block w-[320px] shrink-0 overflow-y-auto custom-scrollbar pb-20 pr-2 space-y-6">
        {/* Sponsored */}
        <div>
          <h3 className="text-gray-400 font-semibold text-[15px] mb-4">Sponsored</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 cursor-pointer group">
              <img src="https://picsum.photos/seed/ad1/120/120" alt="Ad" className="w-28 h-28 rounded-lg object-cover" referrerPolicy="no-referrer" />
              <div>
                <h4 className="text-white font-medium text-[15px] group-hover:underline">Learn React Fast</h4>
                <p className="text-gray-400 text-xs mt-1">react-mastery.com</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 cursor-pointer group">
              <img src="https://picsum.photos/seed/ad2/120/120" alt="Ad" className="w-28 h-28 rounded-lg object-cover" referrerPolicy="no-referrer" />
              <div>
                <h4 className="text-white font-medium text-[15px] group-hover:underline">Premium UI Kits</h4>
                <p className="text-gray-400 text-xs mt-1">design-assets.io</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#2A2A2A] my-2"></div>

        {/* Contacts */}
        <div>
          <div className="flex items-center justify-between mb-4 text-gray-400">
            <h3 className="font-semibold text-[15px]">Contacts</h3>
            <div className="flex space-x-2">
              <button className="w-8 h-8 rounded-full hover:bg-[#2A2A2A] flex items-center justify-center transition-colors">
                <Search className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-full hover:bg-[#2A2A2A] flex items-center justify-center transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="space-y-1">
            {CONTACTS.map((contact, i) => (
              <div key={i} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-[#2A2A2A] cursor-pointer transition-colors">
                <div className="relative">
                  <img src={`https://picsum.photos/seed/${contact.seed}/36/36`} alt={contact.name} className="w-9 h-9 rounded-full object-cover" referrerPolicy="no-referrer" />
                  {contact.online && (
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-[#121212]" />
                  )}
                </div>
                <span className="text-gray-200 font-medium text-[15px]">{contact.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CreatePostModal 
        isOpen={isCreatePostOpen} 
        onClose={() => setIsCreatePostOpen(false)} 
        onSubmit={handleCreatePost}
        onUploadMedia={handleUploadMedia}
      />
      <CreateStoryModal 
        isOpen={isCreateStoryOpen} 
        onClose={() => setIsCreateStoryOpen(false)} 
      />
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
      />
    </div>
  );
}
