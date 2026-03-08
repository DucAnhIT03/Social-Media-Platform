
import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useTheme } from 'next-themes';
import { useChatStore } from '@/store/useChatStore';
import { Moon, Sun, Bell, Power, User, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { clearTokens } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useToastStore } from '@/store/useToastStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const toast = useToastStore();
  const { theme, setTheme } = useTheme();
  const { currentUser, setCurrentUser, logout } = useChatStore();
  const [activeStatus, setActiveStatus] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [username, setUsername] = useState(currentUser?.name || '');

  const handleLogout = () => {
    clearTokens();
    logout();
    onClose();
    toast.show('Đã đăng xuất', 'success');
    router.push('/login');
  };

  const handleSaveName = () => {
     if (username.trim() && currentUser) {
         setCurrentUser({ ...currentUser, name: username });
     }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6">
        {/* Profile Section */}
        <section>
           <h3 className="text-sm font-semibold text-[#65676B] dark:text-[#B0B3B8] uppercase mb-3">Profile</h3>
           <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-[#050505] dark:text-[#E4E6EB]">Display Name</label>
              <div className="flex gap-2">
                 <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="flex-1 bg-[#F0F2F5] dark:bg-[#3A3B3C] border-none rounded-lg px-4 py-2 text-[#050505] dark:text-[#E4E6EB] focus:ring-2 focus:ring-[#1877F2] outline-none"
                 />
                 <button 
                    onClick={handleSaveName}
                    disabled={username === currentUser?.name}
                    className="px-4 py-2 bg-[#1877F2] text-white font-semibold rounded-lg hover:bg-[#166FE5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                    Save
                 </button>
              </div>
           </div>
        </section>

        {/* Preferences Section */}
        <section>
           <h3 className="text-sm font-semibold text-[#65676B] dark:text-[#B0B3B8] uppercase mb-3 text-mt-4">Preferences</h3>
           
           {/* Active Status */}
           <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C]">
                    <div className={cn("w-5 h-5 rounded-full", activeStatus ? "bg-green-500" : "bg-gray-400")}></div>
                 </div>
                 <span className="font-medium text-[#050505] dark:text-[#E4E6EB]">Active Status</span>
              </div>
              <button 
                 onClick={() => setActiveStatus(!activeStatus)}
                 className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    activeStatus ? "bg-[#1877F2]" : "bg-[#B0B3B8] dark:bg-[#4E4F50]"
                 )}
              >
                 <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                    activeStatus ? "left-7" : "left-1"
                 )}></div>
              </button>
           </div>

           {/* Notifications */}
           <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C]">
                    <Bell className="w-5 h-5 text-[#050505] dark:text-[#E4E6EB]" />
                 </div>
                 <span className="font-medium text-[#050505] dark:text-[#E4E6EB]">Notifications</span>
              </div>
              <button 
                 onClick={() => setNotifications(!notifications)}
                 className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    notifications ? "bg-[#1877F2]" : "bg-[#B0B3B8] dark:bg-[#4E4F50]"
                 )}
              >
                 <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                    notifications ? "left-7" : "left-1"
                 )}></div>
              </button>
           </div>
        </section>

        {/* Theme Section */}
        <section>
          <h3 className="text-sm font-semibold text-[#65676B] dark:text-[#B0B3B8] uppercase mb-3">Theme</h3>
          <div className="grid grid-cols-3 gap-2">
             <button 
               onClick={() => setTheme('light')}
               className={cn(
                 "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                 theme === 'light' ? "border-[#1877F2] bg-[#E7F3FF] dark:bg-[#2F3A4A]" : "border-transparent hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C]"
               )}
             >
               <Sun className="w-6 h-6 text-[#050505] dark:text-[#E4E6EB]" />
               <span className="text-sm font-medium text-[#050505] dark:text-[#E4E6EB]">Light</span>
             </button>
             <button 
               onClick={() => setTheme('dark')}
               className={cn(
                 "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                 theme === 'dark' ? "border-[#1877F2] bg-[#E7F3FF] dark:bg-[#2F3A4A]" : "border-transparent hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C]"
               )}
             >
               <Moon className="w-6 h-6 text-[#050505] dark:text-[#E4E6EB]" />
               <span className="text-sm font-medium text-[#050505] dark:text-[#E4E6EB]">Dark</span>
             </button>
             <button 
               onClick={() => setTheme('system')}
               className={cn(
                 "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                 theme === 'system' ? "border-[#1877F2] bg-[#E7F3FF] dark:bg-[#2F3A4A]" : "border-transparent hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C]"
               )}
             >
               <Monitor className="w-6 h-6 text-[#050505] dark:text-[#E4E6EB]" />
               <span className="text-sm font-medium text-[#050505] dark:text-[#E4E6EB]">System</span>
             </button>
          </div>
        </section>

        {/* Account Section */}
        <section className="pt-2 border-t border-[#E4E6EB] dark:border-[#3E4042]">
           <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] text-red-500 transition-colors"
           >
              <div className="p-2 rounded-full bg-[#FFE4E4] dark:bg-[#4A2024]">
                 <Power className="w-5 h-5" />
              </div>
              <span className="font-semibold">Log Out</span>
           </button>
        </section>
      </div>
    </Modal>
  );
};
