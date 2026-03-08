
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={cn(
          "bg-white dark:bg-[#242526] w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E4E6EB] dark:border-[#3E4042]">
          <h2 className="text-xl font-bold text-[#050505] dark:text-[#E4E6EB]">{title}</h2>
          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#65676B] dark:text-[#B0B3B8] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
