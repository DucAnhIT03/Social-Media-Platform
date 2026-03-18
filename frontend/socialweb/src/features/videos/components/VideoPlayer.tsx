import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Bookmark, X, Send, CheckCircle, Volume2, VolumeX, Play } from 'lucide-react';
import { fetchShortVideoPosts, type FeedPost } from '@/api/posts';

type ShortVideoItem = {
  id: string;
  title: string;
  description: string;
  views: string;
  likes: string;
  comments: string;
  time: string;
  user: { name: string; avatar: string };
  thumbnail: string;
  videoUrl: string;
  commentList: typeof MOCK_COMMENTS;
};

const MOCK_COMMENTS = [
  { id: 1, user: 'Sarah Jenkins', avatar: 'https://picsum.photos/seed/sarah/32/32', text: 'This is absolutely amazing! 😍', time: '2h ago', likes: 124 },
  { id: 2, user: 'David Lee', avatar: 'https://picsum.photos/seed/david/32/32', text: 'Wow, I need to visit this place soon.', time: '5h ago', likes: 89 },
  { id: 3, user: 'Maria Rodriguez', avatar: 'https://picsum.photos/seed/maria/32/32', text: 'Great video quality! What camera are you using?', time: '1d ago', likes: 45 },
  { id: 4, user: 'Alex Chen', avatar: 'https://picsum.photos/seed/alex/32/32', text: 'Love the editing style 🔥', time: '1d ago', likes: 233 },
  { id: 5, user: 'Emma Wilson', avatar: 'https://picsum.photos/seed/emma/32/32', text: 'Thanks for sharing this!', time: '2d ago', likes: 12 },
];

const MOCK_VIDEOS = [
  { 
    id: '1', 
    title: 'Exploring the hidden gems of Kyoto!', 
    description: 'Join me on this amazing journey through Kyoto. We visited ancient temples, beautiful gardens, and tried some amazing local food! #Japan #Travel #Kyoto', 
    views: '15.4K',
    likes: '1.2K',
    comments: '342',
    time: '2 hours ago', 
    user: { name: '@travel_diaries', avatar: 'https://picsum.photos/seed/travel/50/50' }, 
    thumbnail: 'https://picsum.photos/seed/kyoto/800/450', 
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    commentList: MOCK_COMMENTS
  },
  { 
    id: '2', 
    title: 'Easy weeknight pasta recipe!', 
    description: 'Quick and delicious pasta recipe perfect for busy weeknights. Ready in 15 minutes! #Foodie #Cooking #Pasta', 
    views: '12.4K',
    likes: '856',
    comments: '128',
    time: '5 hours ago', 
    user: { name: '@cooking_adventures', avatar: 'https://picsum.photos/seed/cooking/40/40' }, 
    thumbnail: 'https://picsum.photos/seed/pasta/800/450', 
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    commentList: MOCK_COMMENTS
  },
  { 
    id: '3', 
    title: 'Unboxing the latest gadget', 
    description: 'Finally got my hands on the new tech! Let\'s see what\'s inside the box. #Tech #Gadgets #Unboxing', 
    views: '8.2K',
    likes: '543',
    comments: '89',
    time: '1 day ago', 
    user: { name: '@tech_trends', avatar: 'https://picsum.photos/seed/tech/40/40' }, 
    thumbnail: 'https://picsum.photos/seed/gadget/800/450', 
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    commentList: MOCK_COMMENTS
  },
  { 
    id: '4', 
    title: 'Sunset Vibes at the Beach', 
    description: 'Nothing beats a good sunset. #Nature #Beach #Sunset', 
    views: '45.1K',
    likes: '4.5K',
    comments: '892',
    time: '2 days ago', 
    user: { name: '@nature_lover', avatar: 'https://picsum.photos/seed/nature/40/40' }, 
    thumbnail: 'https://picsum.photos/seed/sunset/800/450', 
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    commentList: MOCK_COMMENTS
  },
  { 
    id: '5', 
    title: 'My Morning Routine', 
    description: 'How I start my day for maximum productivity. #Productivity #MorningRoutine', 
    views: '102K',
    likes: '12K',
    comments: '1.5K',
    time: '3 days ago', 
    user: { name: '@productivity_hacks', avatar: 'https://picsum.photos/seed/prod/40/40' }, 
    thumbnail: 'https://picsum.photos/seed/morning/800/450', 
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    commentList: MOCK_COMMENTS
  },
  { 
    id: '6', 
    title: 'Top 10 Places to Visit in 2026', 
    description: 'Planning your next vacation? Here are the top 10 places you must visit this year. #Travel #Vacation #Top10', 
    views: '210K',
    likes: '25K',
    comments: '3.2K',
    time: '1 week ago', 
    user: { name: '@wanderlust', avatar: 'https://picsum.photos/seed/wander/40/40' }, 
    thumbnail: 'https://picsum.photos/seed/places/800/450', 
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    commentList: MOCK_COMMENTS
  },
];

export default function VideoPlayer() {
  const { id } = useParams();
  const [activeCommentVideoId, setActiveCommentVideoId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videos, setVideos] = useState<ShortVideoItem[]>(MOCK_VIDEOS as ShortVideoItem[]);

  useEffect(() => {
    let cancelled = false;

    const loadShortVideos = async () => {
      try {
        const response = await fetchShortVideoPosts(1, 50);
        if (cancelled || response.items.length === 0) {
          return;
        }

        const apiVideos: ShortVideoItem[] = response.items
          .filter((item: FeedPost) => Boolean(item.shortVideoUrl))
          .map((item: FeedPost) => ({
            id: item.id,
            title: item.content.slice(0, 80) || 'Video short',
            description: item.content,
            views: '0',
            likes: '0',
            comments: '0',
            time: 'Vừa xong',
            user: {
              name: `@${item.author.username}`,
              avatar: item.author.avatar || `https://picsum.photos/seed/${item.author.id}/50/50`,
            },
            thumbnail:
              item.imageUrl ||
              `https://picsum.photos/seed/${item.id}-short/800/450`,
            videoUrl: item.shortVideoUrl || '',
            commentList: MOCK_COMMENTS,
          }));

        if (apiVideos.length > 0) {
          setVideos(apiVideos);
        }
      } catch {
        // Keep local mock videos if short-video API is not available.
      }
    };

    void loadShortVideos();

    return () => {
      cancelled = true;
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        containerRef.current.scrollBy({ top: containerRef.current.clientHeight, behavior: 'smooth' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        containerRef.current.scrollBy({ top: -containerRef.current.clientHeight, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scroll to initial video if ID is provided
  useEffect(() => {
    if (id && containerRef.current) {
      const index = videos.findIndex(v => v.id === id);
      if (index !== -1) {
        // Wait a brief moment for layout to complete
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = index * containerRef.current.clientHeight;
          }
        }, 100);
      }
    }
  }, [id, videos]);

  const activeVideo = videos.find(v => v.id === activeCommentVideoId);

  return (
    <div className="flex h-full bg-[#121212] rounded-2xl overflow-hidden border border-[#2A2A2A]">
      {/* Main Feed */}
      <div 
        ref={containerRef}
        className="flex-1 h-full overflow-y-auto snap-y snap-mandatory custom-scrollbar relative focus:outline-none scroll-smooth"
        tabIndex={0}
      >
        {videos.map((video) => (
          <ShortVideo 
            key={video.id} 
            video={video} 
            onOpenComments={() => setActiveCommentVideoId(video.id)} 
          />
        ))}
      </div>

      {/* Comments Panel */}
      {activeCommentVideoId && activeVideo && (
        <div className="w-96 bg-[#1A1A1A] border-l border-[#2A2A2A] flex flex-col h-full shrink-0 animate-in slide-in-from-right-8 duration-300">
          <div className="h-16 border-b border-[#2A2A2A] flex items-center justify-between px-4 shrink-0">
            <h3 className="text-white font-semibold">Comments ({activeVideo.comments})</h3>
            <button onClick={() => setActiveCommentVideoId(null)} className="text-gray-400 hover:text-white transition-colors p-2">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {activeVideo.commentList.map(comment => (
              <div key={comment.id} className="flex space-x-3">
                <img src={comment.avatar} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                <div className="flex-1">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-sm font-medium text-gray-300">{comment.user}</span>
                    <span className="text-xs text-gray-500">{comment.time}</span>
                  </div>
                  <p className="text-sm text-white mt-1">{comment.text}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <button className="text-xs text-gray-500 hover:text-gray-300 flex items-center space-x-1 transition-colors">
                      <Heart className="w-3 h-3" /> <span>{comment.likes}</span>
                    </button>
                    <button className="text-xs text-gray-500 hover:text-gray-300 font-medium transition-colors">Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-[#2A2A2A] bg-[#1A1A1A] shrink-0">
            <div className="flex items-center bg-[#2A2A2A] rounded-full px-4 py-2 border border-[#333333] focus-within:border-gray-500 transition-colors">
              <input 
                type="text" 
                placeholder="Add a comment..." 
                className="flex-1 bg-transparent border-none focus:outline-none text-white text-sm placeholder-gray-500"
              />
              <button className="text-blue-500 hover:text-blue-400 ml-2 p-1 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShortVideo({ video, onOpenComments }: { video: any, onOpenComments: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
            setIsPlaying(true);
          } else {
            videoRef.current?.pause();
            setIsPlaying(false);
            // Reset to start when out of view
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="h-full w-full snap-center snap-always flex justify-center items-center py-4 bg-[#121212]">
      <div className="relative w-full max-w-[400px] h-full bg-black rounded-2xl overflow-hidden shadow-2xl group">
        <video 
          ref={videoRef}
          src={video.videoUrl}
          poster={video.thumbnail}
          loop
          muted={isMuted}
          playsInline
          onClick={togglePlay}
          className="w-full h-full object-cover cursor-pointer"
        />
        
        {/* Play/Pause Overlay Indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
        )}

        {/* Mute Toggle */}
        <button 
          onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
          className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/60 transition-colors z-10"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
        </button>
        
        {/* Overlay Info (Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pt-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none flex flex-col justify-end">
          <div className="flex items-center space-x-3 mb-3 pointer-events-auto">
            <img src={video.user.avatar} alt={video.user.name} className="w-10 h-10 rounded-full border border-gray-600 object-cover" referrerPolicy="no-referrer" />
            <span className="text-white font-semibold text-base flex items-center">
              {video.user.name}
              <CheckCircle className="w-4 h-4 text-blue-500 ml-1" />
            </span>
            <button className="bg-transparent border border-white text-white text-xs font-medium px-3 py-1 rounded-full hover:bg-white hover:text-black transition-colors">
              Follow
            </button>
          </div>
          <p className="text-white text-sm mb-3 pointer-events-auto line-clamp-3">{video.description}</p>
          
          {/* Stats below video description */}
          <div className="flex items-center space-x-4 text-gray-300 text-xs font-medium pointer-events-auto bg-white/10 w-fit px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <span>{video.likes} Likes</span>
            <span>•</span>
            <span>{video.comments} Comments</span>
            <span>•</span>
            <span>{video.views} Views</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="absolute bottom-24 right-4 flex flex-col items-center space-y-5 pointer-events-auto z-10">
          <button onClick={() => setIsLiked(!isLiked)} className="flex flex-col items-center group/btn">
            <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center group-hover/btn:bg-black/60 transition-colors mb-1">
              <Heart className={`w-6 h-6 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
            </div>
            <span className="text-white text-xs font-medium drop-shadow-md">{video.likes}</span>
          </button>
          
          <button onClick={onOpenComments} className="flex flex-col items-center group/btn">
            <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center group-hover/btn:bg-black/60 transition-colors mb-1">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium drop-shadow-md">{video.comments}</span>
          </button>
          
          <button onClick={() => setIsSaved(!isSaved)} className="flex flex-col items-center group/btn">
            <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center group-hover/btn:bg-black/60 transition-colors mb-1">
              <Bookmark className={`w-6 h-6 ${isSaved ? 'text-yellow-500 fill-yellow-500' : 'text-white'}`} />
            </div>
            <span className="text-white text-xs font-medium drop-shadow-md">Save</span>
          </button>
          
          <button className="flex flex-col items-center group/btn">
            <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center group-hover/btn:bg-black/60 transition-colors mb-1">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium drop-shadow-md">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
