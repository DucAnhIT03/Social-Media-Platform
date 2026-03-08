import React, { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Upload, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { title: string; content: string; videoUrl?: string; videoFile?: File }) => void;
}

type UploadType = 'url' | 'file';

export const UploadReelModal: React.FC<UploadReelModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [uploadType, setUploadType] = useState<UploadType>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        setError('Vui lòng chọn file video hợp lệ');
        return;
      }
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setError('File video không được vượt quá 100MB');
        return;
      }
      setVideoFile(file);
      setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Tiêu đề không được để trống');
      return;
    }

    if (uploadType === 'url') {
      if (!videoUrl.trim()) {
        setError('Vui lòng nhập đường dẫn video');
        return;
      }
      // Basic URL validation
      try {
        new URL(videoUrl);
      } catch {
        setError('Đường dẫn video không hợp lệ');
        return;
      }
      onSubmit({ 
        title: title.trim(), 
        content: content.trim(),
        videoUrl: videoUrl.trim() 
      });
    } else {
      if (!videoFile) {
        setError('Vui lòng chọn video từ máy');
        return;
      }
      onSubmit({ 
        title: title.trim(), 
        content: content.trim(),
        videoFile 
      });
    }

    // Reset form
    setTitle('');
    setContent('');
    setVideoUrl('');
    setVideoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError('');
    onClose();
  };

  const handleClose = () => {
    // Reset form when closing
    setTitle('');
    setContent('');
    setVideoUrl('');
    setVideoFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Đăng video ngắn">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Title Input */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#050505] dark:text-[#E4E6EB]">
            Tiêu đề <span className="text-red-500">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#F0F2F5] dark:bg-[#3A3B3C] border-none focus:ring-2 focus:ring-[#1877F2] outline-none text-[#050505] dark:text-[#E4E6EB]"
            placeholder="Nhập tiêu đề video..."
            required
          />
        </div>

        {/* Content Input */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#050505] dark:text-[#E4E6EB]">
            Nội dung video
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-[#F0F2F5] dark:bg-[#3A3B3C] border-none focus:ring-2 focus:ring-[#1877F2] outline-none text-[#050505] dark:text-[#E4E6EB] resize-none"
            placeholder="Nhập mô tả hoặc nội dung video..."
          />
        </div>

        {/* Upload Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#050505] dark:text-[#E4E6EB]">
            Hình thức đăng tải <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setUploadType('url');
                setVideoFile(null);
                setError('');
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all",
                uploadType === 'url'
                  ? "border-[#1877F2] bg-[#E7F3FF] dark:bg-[#2F3A4A] text-[#1877F2]"
                  : "border-[#E4E6EB] dark:border-[#3A3B3C] bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB] hover:border-[#1877F2]"
              )}
            >
              <LinkIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Gắn link video</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadType('file');
                setVideoUrl('');
                setError('');
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all",
                uploadType === 'file'
                  ? "border-[#1877F2] bg-[#E7F3FF] dark:bg-[#2F3A4A] text-[#1877F2]"
                  : "border-[#E4E6EB] dark:border-[#3A3B3C] bg-[#F0F2F5] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB] hover:border-[#1877F2]"
              )}
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">Chọn từ máy</span>
            </button>
          </div>
        </div>

        {/* URL Input */}
        {uploadType === 'url' && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#050505] dark:text-[#E4E6EB]">
              Đường dẫn video (URL) <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F0F2F5] dark:bg-[#3A3B3C] border-none focus:ring-2 focus:ring-[#1877F2] outline-none text-[#050505] dark:text-[#E4E6EB]"
              placeholder="Ví dụ: https://..."
              required={uploadType === 'url'}
            />
            <p className="text-xs text-[#65676B] dark:text-[#B0B3B8]">
              Nhập đường dẫn video từ YouTube, Vimeo hoặc các nền tảng khác
            </p>
          </div>
        )}

        {/* File Upload Input */}
        {uploadType === 'file' && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#050505] dark:text-[#E4E6EB]">
              Chọn video từ máy <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-8 rounded-lg border-2 border-dashed border-[#E4E6EB] dark:border-[#3A3B3C] bg-[#F0F2F5] dark:bg-[#3A3B3C] cursor-pointer hover:border-[#1877F2] transition-colors flex flex-col items-center justify-center gap-2"
            >
              <Upload className="w-8 h-8 text-[#65676B] dark:text-[#B0B3B8]" />
              {videoFile ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-[#050505] dark:text-[#E4E6EB]">
                    {videoFile.name}
                  </p>
                  <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] mt-1">
                    {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-medium text-[#050505] dark:text-[#E4E6EB]">
                    Click để chọn video
                  </p>
                  <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] mt-1">
                    Hỗ trợ: MP4, MOV, AVI (tối đa 100MB)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          Đăng video
        </button>
      </form>
    </Modal>
  );
};

