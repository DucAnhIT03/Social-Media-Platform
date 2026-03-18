import { Users, Heart, MessageCircle, Mail } from 'lucide-react';

export default function Notifications() {
  const notifications = [
    { type: 'friend', user: 'Alex Chen', action: 'wants to be friends', time: '2m ago', icon: Users, color: 'bg-blue-500', seed: 'n1' },
    { type: 'like', user: 'Sarah Lee', action: 'liked your recent video "Sunset Vibes"', time: '15m ago', icon: Heart, color: 'bg-red-500', seed: 'n2' },
    { type: 'comment', user: 'Mike Davis', action: 'commented on your post: "Great shot!"', time: '1h ago', icon: MessageCircle, color: 'bg-blue-500', seed: 'n3' },
    { type: 'message', user: 'Emily White', action: 'sent you a message', time: '3h ago', icon: Mail, color: 'bg-green-500', seed: 'n4' },
    { type: 'like', user: 'Chris Kim', action: 'liked your short video', time: 'Yesterday', icon: Heart, color: 'bg-red-500', seed: 'n5' },
  ];

  return (
    <div className="max-w-3xl mx-auto h-full overflow-y-auto custom-scrollbar">
      <h1 className="text-2xl font-bold text-white mb-6">Notifications</h1>
      
      <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] overflow-hidden">
        {notifications.map((notif, i) => (
          <div key={i} className={`flex items-center p-4 hover:bg-[#222222] transition-colors cursor-pointer ${i !== notifications.length - 1 ? 'border-b border-[#2A2A2A]' : ''}`}>
            <div className="relative mr-4">
              <img src={`https://picsum.photos/seed/${notif.seed}/48/48`} alt={notif.user} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${notif.color} flex items-center justify-center border-2 border-[#1A1A1A]`}>
                <notif.icon className="w-3 h-3 text-white" />
              </div>
            </div>
            
            <div className="flex-1">
              <p className="text-gray-300 text-sm">
                <span className="font-semibold text-white">{notif.user}</span> {notif.action}
              </p>
            </div>
            
            <span className="text-xs text-gray-500 whitespace-nowrap ml-4">{notif.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
