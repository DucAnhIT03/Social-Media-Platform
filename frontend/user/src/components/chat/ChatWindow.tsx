import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import {
  Send,
  Image as ImageIcon,
  Smile,
  MoreHorizontal,
  Phone,
  Video,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import { useChatScroll } from '@/hooks/useChatScroll';
import { useChatStore } from '@/store/useChatStore';
import { MessageBubble } from './MessageBubble';
import { cn } from '@/lib/utils';

const chatSchema = z.object({
  message: z.string().min(1, { message: 'Message cannot be empty' }),
});

type ChatFormValues = z.infer<typeof chatSchema>;

export default function ChatWindow() {
  const { currentUser, sendMessage, getActiveConversation, setActiveConversation } =
    useChatStore();

  const activeConversation = getActiveConversation();
  const messages = activeConversation?.messages || [];

  const otherUser =
    activeConversation?.participants.find((p) => p.id !== currentUser?.id) || {
      id: 'unknown',
      name: 'Unknown User',
      avatar: 'https://i.pravatar.cc/150?u=unknown',
    };

  const scrollRef = useChatScroll(messages);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
    watch,
  } = useForm<ChatFormValues>({
    resolver: zodResolver(chatSchema),
    defaultValues: { message: '' },
  });

  const messageValue = watch('message');

  const onSubmit = async (data: ChatFormValues) => {
    await sendMessage(data.message);
    reset();
  };

  if (!activeConversation) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#18191A]">
      <header className="h-[60px] flex items-center justify-between px-4 border-b border-[#E4E6EB] dark:border-[#3E4042] bg-white dark:bg-[#242526] z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveConversation(null)}
            className="md:hidden p-2 -ml-2 text-[#65676B] dark:text-[#B0B3B8] hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C] rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="relative">
            <img
              src={otherUser.avatar}
              alt={otherUser.name}
              className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#242526]"></span>
          </div>
          <div>
            <h3 className="font-semibold text-[15px] text-[#050505] dark:text-[#E4E6EB]">
              {otherUser.name}
            </h3>
            <p className="text-[13px] text-[#65676B] dark:text-[#B0B3B8]">Active now</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-9 h-9 flex items-center justify-center text-[#65676B] dark:text-[#B0B3B8] hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C] rounded-full transition-colors">
            <Phone size={20} />
          </button>
          <button className="w-9 h-9 flex items-center justify-center text-[#65676B] dark:text-[#B0B3B8] hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C] rounded-full transition-colors">
            <Video size={20} />
          </button>
          <button className="w-9 h-9 flex items-center justify-center text-[#65676B] dark:text-[#B0B3B8] hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C] rounded-full transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#18191A]">
        <div className="py-2">
          {messages.map((msg, index) => {
            const isMe = msg.senderId === 'me' || msg.senderId === currentUser?.id;
            const prevMsg = index > 0 ? messages[index - 1] : null;

            const msgDate = new Date(msg.createdAt);
            const prevMsgDate = prevMsg ? new Date(prevMsg.createdAt) : null;

            const showDateSeparator =
              !prevMsgDate ||
              Math.abs(msgDate.getTime() - prevMsgDate.getTime()) >
                1000 * 60 * 60 * 24;

            return (
              <div
                key={msg.id}
                ref={index === messages.length - 1 ? scrollRef : null}
              >
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-4">
                    <span className="text-xs text-[#65676B] dark:text-[#B0B3B8] bg-[#E4E6EB] dark:bg-[#3A3B3C] px-3 py-1 rounded-full">
                      {format(msg.createdAt, 'MMMM d, yyyy')}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  isMe={isMe}
                  sender={isMe ? currentUser! : otherUser}
                />
              </div>
            );
          })}
        </div>
      </div>

      <footer className="p-3 border-t border-[#E4E6EB] dark:border-[#3E4042] bg-white dark:bg-[#242526]">
        <div className="flex items-end gap-2">
          <button className="w-9 h-9 flex items-center justify-center text-[#65676B] dark:text-[#B0B3B8] hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C] rounded-full transition-colors flex-shrink-0">
            <Plus size={20} />
          </button>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex items-end gap-2">
            <div className="relative flex-1 flex items-end">
              <div className="w-full bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-2xl px-4 py-2 min-h-[36px] max-h-[120px] overflow-y-auto flex items-center">
                <input
                  {...register('message')}
                  autoComplete="off"
                  placeholder="Aa"
                  className="w-full bg-transparent text-[15px] text-[#050505] dark:text-[#E4E6EB] placeholder:text-[#65676B] dark:placeholder:text-[#B0B3B8] focus:outline-none resize-none"
                  style={{ lineHeight: '1.33' }}
                />
              </div>
            </div>

            {messageValue && messageValue.trim() ? (
              <button
                type="submit"
                className="w-9 h-9 flex items-center justify-center bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-full transition-colors disabled:opacity-50 flex-shrink-0"
                disabled={isSubmitting}
              >
                <Send size={18} className={cn(isSubmitting && 'animate-pulse')} />
              </button>
            ) : (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  className="w-9 h-9 flex items-center justify-center text-[#65676B] dark:text-[#B0B3B8] hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C] rounded-full transition-colors"
                >
                  <ImageIcon size={20} />
                </button>
                <button
                  type="button"
                  className="w-9 h-9 flex items-center justify-center text-[#65676B] dark:text-[#B0B3B8] hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C] rounded-full transition-colors"
                >
                  <Smile size={20} />
                </button>
              </div>
            )}
          </form>
        </div>
      </footer>
    </div>
  );
}
