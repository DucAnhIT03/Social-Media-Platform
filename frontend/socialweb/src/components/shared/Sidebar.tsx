import { NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Home, Heart, MessageSquare, Users, User, Settings, MoreHorizontal, Plus, PlaySquare } from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const navItems = [
    { name: 'Trang chủ', path: '/', icon: Home },
    { name: 'Hẹn hò', path: '/explore', icon: Heart },
    { name: 'Videos', path: '/video', icon: PlaySquare },
    { name: 'Tin nhắn', path: '/messages', icon: MessageSquare },
    { name: 'Bạn bè', path: '/friends', icon: Users },
    { name: 'Cá nhân', path: '/profile', icon: User },
    { name: 'Cài đặt', path: '/settings', icon: Settings },
    { name: 'Thêm', path: '/more', icon: MoreHorizontal },
  ];

  return (
    <aside className="w-64 bg-[#1A1A1A] border-r border-[#2A2A2A] flex flex-col h-full">
      <div className="p-6 flex items-center space-x-3">
        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">c</span>
        </div>
        <span className="text-xl font-bold tracking-tight text-white">connectDucAnh</span>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? 'bg-[#2A2A2A] text-white font-medium'
                  : 'text-gray-400 hover:bg-[#222222] hover:text-gray-200'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4">
        <button
          onClick={() => navigate('/?createPost=1')}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Tạo bài viết</span>
        </button>
      </div>
    </aside>
  );
}
