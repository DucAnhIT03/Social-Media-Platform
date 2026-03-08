import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useChatStore } from '@/store/useChatStore';
import { Camera, Mail, MapPin, Calendar, Power, Save, KeyRound } from 'lucide-react';
import {
  changePasswordApi,
  clearTokens,
  fetchMeProfileApi,
  updateMeProfileApi,
} from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useToastStore } from '@/store/useToastStore';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { currentUser, setCurrentUser, logout } = useChatStore();
  const toast = useToastStore();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (!currentUser) return;

    setUsername(currentUser.name || '');
    setAvatar(currentUser.avatar || '');

    void (async () => {
      try {
        const me = await fetchMeProfileApi();
        setEmail(me.email || '');
        setUsername(me.username || '');
        setBio(me.bio || '');
        setAvatar(me.avatar || currentUser.avatar || '');
      } catch (e: any) {
        toast.show(e?.message || 'Không tải được hồ sơ', 'error');
      }
    })();
  }, [isOpen, currentUser, toast]);

  if (!currentUser) return null;

  const handleLogout = () => {
    clearTokens();
    logout();
    onClose();
    toast.show('Đã đăng xuất', 'success');
    router.push('/login');
  };

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      toast.show('Tên hiển thị không được để trống', 'error');
      return;
    }

    try {
      setSavingProfile(true);
      const updated = await updateMeProfileApi({
        username: username.trim(),
        bio: bio.trim() || undefined,
        avatar: avatar.trim() || undefined,
      });

      setCurrentUser({
        ...currentUser,
        name: updated.username,
        avatar: updated.avatar || currentUser.avatar,
      });

      toast.show('Cập nhật hồ sơ thành công', 'success');
    } catch (e: any) {
      toast.show(e?.message || 'Không thể cập nhật hồ sơ', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.show('Vui lòng nhập đầy đủ thông tin mật khẩu', 'error');
      return;
    }
    if (newPassword.length < 6) {
      toast.show('Mật khẩu mới tối thiểu 6 ký tự', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.show('Xác nhận mật khẩu mới không khớp', 'error');
      return;
    }

    try {
      setSavingPassword(true);
      await changePasswordApi({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.show('Đổi mật khẩu thành công', 'success');
    } catch (e: any) {
      toast.show(e?.message || 'Không thể đổi mật khẩu', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profile" className="max-w-[640px]">
      <div className="flex flex-col items-center">
        <div className="w-full h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-t-lg" />

        <div className="relative -mt-16 mb-4">
          <div className="w-32 h-32 rounded-full border-4 border-white dark:border-[#242526] overflow-hidden bg-white">
            <img
              src={avatar || currentUser.avatar}
              alt={username || currentUser.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute bottom-1 right-1 p-2 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB]">
            <Camera size={16} />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-[#050505] dark:text-[#E4E6EB] mb-1">
          {username || currentUser.name}
        </h2>
        <p className="text-[#65676B] dark:text-[#B0B3B8] text-sm mb-6">@{currentUser.id}</p>

        <div className="w-full border-t border-[#E4E6EB] dark:border-[#3E4042] pt-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#65676B] dark:text-[#B0B3B8]">Email</label>
              <div className="mt-1 flex items-center gap-2 bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-lg px-3 py-2">
                <Mail size={16} className="text-[#65676B] dark:text-[#B0B3B8]" />
                <input
                  value={email}
                  disabled
                  className="w-full bg-transparent outline-none text-sm text-[#050505] dark:text-[#E4E6EB]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-[#65676B] dark:text-[#B0B3B8]">Tên hiển thị</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-lg px-3 py-2 outline-none text-sm text-[#050505] dark:text-[#E4E6EB]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#65676B] dark:text-[#B0B3B8]">Avatar URL</label>
            <input
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="mt-1 w-full bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-lg px-3 py-2 outline-none text-sm text-[#050505] dark:text-[#E4E6EB]"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="text-xs text-[#65676B] dark:text-[#B0B3B8]">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="mt-1 w-full bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-lg px-3 py-2 outline-none text-sm text-[#050505] dark:text-[#E4E6EB] resize-none"
              placeholder="Giới thiệu ngắn..."
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => void handleSaveProfile()}
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1877F2] text-white hover:bg-[#166FE5] disabled:opacity-60 transition-colors"
            >
              <Save size={16} />
              {savingProfile ? 'Đang lưu...' : 'Lưu hồ sơ'}
            </button>
          </div>
        </div>

        <div className="w-full mt-6 pt-4 border-t border-[#E4E6EB] dark:border-[#3E4042] space-y-3">
          <h3 className="text-sm font-semibold text-[#050505] dark:text-[#E4E6EB] flex items-center gap-2">
            <KeyRound size={16} /> Đổi mật khẩu
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Mật khẩu hiện tại"
              className="bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-lg px-3 py-2 outline-none text-sm text-[#050505] dark:text-[#E4E6EB]"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mật khẩu mới"
              className="bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-lg px-3 py-2 outline-none text-sm text-[#050505] dark:text-[#E4E6EB]"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Xác nhận mật khẩu mới"
              className="bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-lg px-3 py-2 outline-none text-sm text-[#050505] dark:text-[#E4E6EB]"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => void handleChangePassword()}
              disabled={savingPassword}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22a06b] text-white hover:bg-[#1a8a5a] disabled:opacity-60 transition-colors"
            >
              <KeyRound size={16} />
              {savingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </div>

        <div className="w-full mt-8 pt-4 border-t border-[#E4E6EB] dark:border-[#3E4042]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-semibold"
          >
            <Power size={18} />
            Đăng xuất
          </button>
        </div>

        <div className="w-full mt-3 text-xs text-[#65676B] dark:text-[#B0B3B8] flex items-center gap-2">
          <MapPin size={14} /> Ho Chi Minh City, Vietnam
          <span className="mx-1">•</span>
          <Calendar size={14} /> Joined January 2024
        </div>
      </div>
    </Modal>
  );
};
