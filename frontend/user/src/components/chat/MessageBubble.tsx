import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Message, User } from '@/types/chat';
import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  sender?: User; // Optional if not 'me'
}

export function MessageBubble({ message, isMe, sender }: MessageBubbleProps) {
  const showAvatar = !isMe;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex w-full mb-1 px-4 group",
        isMe ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex items-end gap-2 max-w-[65%]",
        isMe ? "flex-row-reverse" : "flex-row"
      )}>
        {showAvatar && (
          <div className="w-8 h-8 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] overflow-hidden flex-shrink-0 mb-1">
            {sender?.avatar ? (
              <img src={sender.avatar} alt={sender.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8]">
                {sender?.name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
        )}

        <div className={cn(
          "relative rounded-2xl px-3 py-2 text-[15px] leading-[1.33] break-words",
          isMe 
            ? "bg-[#0084FF] text-white rounded-tr-sm" 
            : "bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB] rounded-tl-sm"
        )}>
          <p className="whitespace-pre-wrap">{message.content}</p>
          
          {/* Timestamp and status */}
          <div className={cn(
            "flex items-center gap-1 mt-1 justify-end",
            isMe ? "flex-row" : "flex-row-reverse"
          )}>
            <span className={cn(
              "text-[11px] leading-none",
              isMe ? "text-white/70" : "text-[#65676B] dark:text-[#B0B3B8]"
            )}>
              {format(message.createdAt, 'HH:mm')}
            </span>
            {isMe && (
              <span className="text-[11px] leading-none text-white/70">
                {message.status === 'seen' ? (
                  <CheckCheck className="w-3.5 h-3.5" />
                ) : message.status === 'sent' ? (
                  <CheckCheck className="w-3.5 h-3.5 opacity-50" />
                ) : (
                  <Check className="w-3.5 h-3.5 opacity-50" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
