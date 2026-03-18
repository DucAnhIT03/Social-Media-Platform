import React, { useEffect } from 'react';
import { X, Image, Type, Settings } from 'lucide-react';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateStoryModal({ isOpen, onClose }: CreateStoryModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#18191A] animate-in fade-in duration-200">
      {/* Header */}
      <div className="h-14 bg-[#242526] border-b border-[#3E4042] flex items-center px-4 shadow-sm shrink-0">
        <button 
          onClick={onClose} 
          className="w-10 h-10 rounded-full bg-[#3A3B3C] flex items-center justify-center hover:bg-[#4E4F50] transition-colors"
        >
          <X className="w-6 h-6 text-[#E4E6EB]" />
        </button>
        <h1 className="ml-4 text-xl font-bold text-[#E4E6EB]">Tạo tin</h1>
        <div className="flex-1" />
        <button className="w-10 h-10 rounded-full bg-[#3A3B3C] flex items-center justify-center hover:bg-[#4E4F50] transition-colors">
          <Settings className="w-5 h-5 text-[#E4E6EB]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
        <div className="flex flex-col sm:flex-row gap-6 max-w-3xl w-full justify-center">
          {/* Photo Story */}
          <button className="flex-1 h-[330px] max-w-[220px] rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 flex flex-col items-center justify-center gap-4 hover:opacity-90 transition-opacity shadow-lg group">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Image className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-white font-bold text-lg">Tạo tin ảnh</span>
          </button>

          {/* Text Story */}
          <button className="flex-1 h-[330px] max-w-[220px] rounded-xl bg-gradient-to-b from-purple-500 to-pink-500 flex flex-col items-center justify-center gap-4 hover:opacity-90 transition-opacity shadow-lg group">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Type className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-white font-bold text-lg">Tạo tin dạng văn bản</span>
          </button>
        </div>
      </div>
    </div>
  );
}
