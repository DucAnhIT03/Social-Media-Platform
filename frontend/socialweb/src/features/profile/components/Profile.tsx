import { Edit2, Users, FileText, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const videos = [
    { views: '15.4K', seed: 'v1' },
    { views: '3.2K', seed: 'v2' },
    { views: '3.2K', seed: 'v3' },
    { views: '3.2K', seed: 'v4' },
    { views: '3.2K', seed: 'v5' },
    { views: '3.2K', seed: 'v6' },
    { views: '3.2K', seed: 'v7' },
    { views: '3.2K', seed: 'v8' },
    { views: '3.2K', seed: 'v9' },
  ];

  return (
    <div className="max-w-5xl mx-auto h-full overflow-y-auto custom-scrollbar pb-20">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center mb-12 mt-8">
        <img src="https://picsum.photos/seed/alex_rivera/120/120" alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-[#1A1A1A] mb-4" referrerPolicy="no-referrer" />
        <h1 className="text-3xl font-bold text-white mb-2">@Alex_Rivera</h1>
        <p className="text-gray-400 max-w-md mb-6">
          Digital creator & storyteller. Capturing life in motion. ðŸŽ¥ #ShortFilms
        </p>
        
        <button className="bg-[#2A2A2A] hover:bg-[#333333] text-white font-medium px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-colors mb-8">
          <Edit2 className="w-4 h-4" />
          <span>Edit Profile</span>
        </button>

        <div className="flex items-center space-x-8 text-gray-300">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-500" />
            <span className="font-semibold text-white">1.2K</span>
            <span>Friends</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-500" />
            <span className="font-semibold text-white">500</span>
            <span>Following</span>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-gray-500" />
            <span className="font-semibold text-white">150</span>
            <span>Posts</span>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {videos.map((video, i) => (
          <Link to={`/video/${(i % 6) + 1}`} key={i} className="relative aspect-video bg-[#1A1A1A] rounded-2xl overflow-hidden group cursor-pointer block">
            <img src={`https://picsum.photos/seed/${video.seed}/400/225`} alt="Video thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Play className="w-6 h-6 text-white ml-1" />
              </div>
            </div>
            <div className="absolute bottom-3 left-3 flex items-center space-x-1 text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-lg backdrop-blur-sm">
              <Play className="w-3 h-3" />
              <span>{video.views} views</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
