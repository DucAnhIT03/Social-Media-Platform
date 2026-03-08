'use client';

import React, { useState } from 'react';
import { Send, Heart, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/useChatStore';

interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  content: string;
  likes: number;
  isLiked: boolean;
  createdAt: Date;
  replies?: Comment[];
}

interface CommentSectionProps {
  videoId: string;
}

// Mock comments data
const MOCK_COMMENTS: Comment[] = [
  {
    id: 'comment-1',
    author: {
      id: 'user-1',
      name: 'Alice Freeman',
      avatar: 'https://i.pravatar.cc/150?u=alice',
    },
    content: 'This is amazing! Great work! 👏',
    likes: 42,
    isLiked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
  },
  {
    id: 'comment-2',
    author: {
      id: 'user-2',
      name: 'Bob Smith',
      avatar: 'https://i.pravatar.cc/150?u=bob',
    },
    content: 'Can you share the source code?',
    likes: 15,
    isLiked: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
  },
  {
    id: 'comment-3',
    author: {
      id: 'user-3',
      name: 'Charlie Brown',
      avatar: 'https://i.pravatar.cc/150?u=charlie',
    },
    content: 'Love this! Keep it up! 💪',
    likes: 28,
    isLiked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
];

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
};

export const CommentSection: React.FC<CommentSectionProps> = ({ videoId }) => {
  const { currentUser } = useChatStore();
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar || 'https://i.pravatar.cc/150?u=me',
      },
      content: newComment.trim(),
      likes: 0,
      isLiked: false,
      createdAt: new Date(),
    };

    setComments([comment, ...comments]);
    setNewComment('');
  };

  const toggleLike = (commentId: string) => {
    setComments(
      comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          };
        }
        return comment;
      })
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#242526]">
      {/* Header */}
      <div className="p-4 border-b border-[#E4E6EB] dark:border-[#3E4042] flex-shrink-0">
        <h2 className="text-lg font-semibold text-[#050505] dark:text-[#E4E6EB]">
          Bình luận ({comments.length})
        </h2>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img
                  src={comment.author.avatar}
                  alt={comment.author.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-lg p-3">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-semibold text-[#050505] dark:text-[#E4E6EB]">
                    {comment.author.name}
                  </h4>
                  <button className="text-[#65676B] dark:text-[#B0B3B8] hover:text-[#050505] dark:hover:text-[#E4E6EB]">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-[#050505] dark:text-[#E4E6EB] mb-2">
                  {comment.content}
                </p>
                <div className="flex items-center gap-4 text-xs text-[#65676B] dark:text-[#B0B3B8]">
                  <span>{formatTimeAgo(comment.createdAt)}</span>
                  <button
                    onClick={() => toggleLike(comment.id)}
                    className={cn(
                      "flex items-center gap-1 hover:text-[#050505] dark:hover:text-[#E4E6EB] transition-colors",
                      comment.isLiked && "text-red-500"
                    )}
                  >
                    <Heart
                      className={cn(
                        "w-3 h-3",
                        comment.isLiked && "fill-current"
                      )}
                    />
                    <span>{comment.likes}</span>
                  </button>
                  <button className="hover:text-[#050505] dark:hover:text-[#E4E6EB] transition-colors">
                    Phản hồi
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comment Input */}
      <div className="p-4 border-t border-[#E4E6EB] dark:border-[#3E4042] flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img
                src={currentUser?.avatar || 'https://i.pravatar.cc/150?u=me'}
                alt={currentUser?.name || 'Me'}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Viết bình luận..."
              className="flex-1 px-3 py-2 rounded-full bg-[#F0F2F5] dark:bg-[#3A3B3C] border-none focus:ring-2 focus:ring-[#1877F2] outline-none text-[#050505] dark:text-[#E4E6EB] text-sm"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                newComment.trim()
                  ? "bg-[#1877F2] hover:bg-[#166FE5] text-white"
                  : "bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#65676B] dark:text-[#B0B3B8] cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
