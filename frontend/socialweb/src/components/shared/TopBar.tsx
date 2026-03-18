import { Search, Bell, MessageCircle, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function TopBar() {
  const location = useLocation();

  const getSearchPlaceholder = () => {
    const path = location.pathname;
    if (path.startsWith('/friends')) return 'Tìm kiếm bạn bè...';
    if (path.startsWith('/messages')) return 'Tìm kiếm tin nhắn...';
    if (path.startsWith('/explore')) return 'Tìm kiếm người ấy...';
    if (path.startsWith('/profile')) return 'Tìm kiếm trên trang cá nhân...';
    if (path.startsWith('/notifications')) return 'Tìm kiếm thông báo...';
    if (path.startsWith('/video')) return 'Tìm kiếm video...';
    if (path.startsWith('/settings')) return 'Tìm kiếm cài đặt...';
    return 'Tìm kiếm trên mạng xã hội...';
  };

  return (
    <header className="h-16 bg-[#1A1A1A] border-b border-[#2A2A2A] flex items-center justify-between px-6 shrink-0">
      <div className="flex-1 max-w-xl relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={getSearchPlaceholder()}
          className="block w-full pl-10 pr-3 py-2 border border-transparent rounded-full leading-5 bg-[#2A2A2A] text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-[#333333] focus:border-gray-600 sm:text-sm transition-colors"
        />
      </div>

      <div className="flex items-center space-x-6 ml-4">
        <Link to="/notifications" className="text-gray-400 hover:text-white transition-colors relative">
          <Bell className="h-6 w-6" />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#1A1A1A]" />
        </Link>
        <Link to="/messages" className="text-gray-400 hover:text-white transition-colors">
          <MessageCircle className="h-6 w-6" />
        </Link>
        <div className="h-8 w-8 rounded-full bg-gray-600 overflow-hidden cursor-pointer border border-gray-500">
          <img
            src="https://picsum.photos/seed/user1/100/100"
            alt="User profile"
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
}
