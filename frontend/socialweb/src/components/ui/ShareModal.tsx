import React, { useEffect, useRef } from 'react';
import { X, Share, MessageCircle, Link as LinkIcon, Users, Edit3, Send } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shareOptions = [
    { icon: Share, label: 'Chia sẻ ngay (Công khai)', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: Edit3, label: 'Chia sẻ lên Bảng tin', color: 'text-gray-300', bg: 'bg-[#3A3B3C]' },
    { icon: MessageCircle, label: 'Gửi trong Messenger', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { icon: Users, label: 'Chia sẻ lên nhóm', color: 'text-green-500', bg: 'bg-green-500/10' },
    { icon: LinkIcon, label: 'Sao chép liên kết', color: 'text-gray-300', bg: 'bg-[#3A3B3C]' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div 
        ref={modalRef}
        className="bg-[#242526] w-full max-w-[500px] rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="relative flex items-center justify-center p-4 border-b border-[#3E4042]">
          <h2 className="text-xl font-bold text-[#E4E6EB]">Chia sẻ</h2>
          <button 
            onClick={onClose}
            className="absolute right-4 w-9 h-9 rounded-full bg-[#3A3B3C] hover:bg-[#4E4F50] flex items-center justify-center text-[#B0B3B8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share Options */}
        <div className="p-4 space-y-2">
          {shareOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <button 
                key={index}
                onClick={onClose}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-[#3A3B3C] transition-colors group"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${option.bg}`}>
                  <Icon className={`w-5 h-5 ${option.color}`} />
                </div>
                <span className="text-[15px] font-semibold text-[#E4E6EB]">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
