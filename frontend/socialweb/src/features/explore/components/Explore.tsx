import React, { useState } from 'react';
import { X, Heart, Star, MapPin, Info, RefreshCw } from 'lucide-react';

export default function Explore() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  const profiles = [
    { id: 1, name: 'Linh Nguyễn', age: 24, bio: 'Thích du lịch, cafe và chụp ảnh. Tìm người cùng sở thích.', distance: 'Cách 5 km', seed: 'linh123' },
    { id: 2, name: 'Trang Phạm', age: 22, bio: 'Yêu động vật, đặc biệt là mèo. Cuối tuần hay đi dạo phố.', distance: 'Cách 2 km', seed: 'trang456' },
    { id: 3, name: 'Hải Yến', age: 25, bio: 'Nhân viên văn phòng. Thích xem phim Netflix và nấu ăn.', distance: 'Cách 8 km', seed: 'yen789' },
    { id: 4, name: 'Minh Thư', age: 23, bio: 'Sống tích cực, yêu thể thao. Tìm bạn chạy bộ chung.', distance: 'Cách 3 km', seed: 'thu101' },
    { id: 5, name: 'Mai Anh', age: 26, bio: 'Đam mê nghệ thuật và âm nhạc. Tìm người biết lắng nghe.', distance: 'Cách 10 km', seed: 'mai202' },
  ];

  const handleAction = (action: 'pass' | 'like' | 'super') => {
    if (currentIndex >= profiles.length) return;
    
    setDirection(action === 'pass' ? 'left' : 'right');
    
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setDirection(null);
    }, 300);
  };

  const resetProfiles = () => {
    setCurrentIndex(0);
    setDirection(null);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm relative h-[600px]">
        {currentIndex < profiles.length ? (
          <div 
            className={`absolute inset-0 bg-[#1A1A1A] rounded-3xl overflow-hidden shadow-2xl border border-[#2A2A2A] transition-transform duration-300 ease-in-out ${
              direction === 'left' ? '-translate-x-full rotate-[-20deg] opacity-0' : 
              direction === 'right' ? 'translate-x-full rotate-[20deg] opacity-0' : 
              'translate-x-0 rotate-0 opacity-100'
            }`}
          >
            {/* Photo */}
            <div className="relative h-3/4 w-full bg-gray-800">
              <img 
                src={`https://picsum.photos/seed/${profiles[currentIndex].seed}/400/600`} 
                alt={profiles[currentIndex].name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent" />
              
              {/* Info Overlay */}
              <div className="absolute bottom-0 left-0 w-full p-6">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-white flex items-baseline space-x-2">
                      <span>{profiles[currentIndex].name}</span>
                      <span className="text-xl font-normal text-gray-300">{profiles[currentIndex].age}</span>
                    </h2>
                    <div className="flex items-center text-gray-300 mt-2 text-sm">
                      <MapPin className="w-4 h-4 mr-1" />
                      {profiles[currentIndex].distance}
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                    <Info className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="p-6 h-1/4">
              <p className="text-gray-300 text-sm line-clamp-3">
                {profiles[currentIndex].bio}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="absolute bottom-6 left-0 w-full flex justify-center items-center space-x-6 px-6">
              <button 
                onClick={() => handleAction('pass')}
                className="w-14 h-14 rounded-full bg-[#1A1A1A] border border-red-500/50 flex items-center justify-center text-red-500 hover:bg-red-500/10 hover:scale-110 transition-all shadow-lg"
              >
                <X className="w-6 h-6" />
              </button>
              <button 
                onClick={() => handleAction('super')}
                className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-blue-500/50 flex items-center justify-center text-blue-500 hover:bg-blue-500/10 hover:scale-110 transition-all shadow-lg"
              >
                <Star className="w-5 h-5 fill-current" />
              </button>
              <button 
                onClick={() => handleAction('like')}
                className="w-14 h-14 rounded-full bg-[#1A1A1A] border border-green-500/50 flex items-center justify-center text-green-500 hover:bg-green-500/10 hover:scale-110 transition-all shadow-lg"
              >
                <Heart className="w-6 h-6 fill-current" />
              </button>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A1A1A] rounded-3xl border border-[#2A2A2A] p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-[#2A2A2A] flex items-center justify-center mb-6">
              <Heart className="w-10 h-10 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Hết lượt ghép đôi</h2>
            <p className="text-gray-400 mb-8">Bạn đã xem hết danh sách gợi ý hôm nay. Hãy quay lại sau nhé!</p>
            <button 
              onClick={resetProfiles}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-full font-medium transition-all hover:scale-105"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Tìm kiếm lại</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
