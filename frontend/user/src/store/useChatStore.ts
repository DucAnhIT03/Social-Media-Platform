import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Conversation, Message, User } from '@/types/chat';
import {
  createPrivateConversationApi,
  fetchChatConversationsApi,
  fetchConversationMessagesApi,
  sendMessageApi,
  getAccessToken,
  deleteConversationApi,
} from '@/lib/api';

interface ChatState {
  activeConversationId: string | null;
  currentUser: User | null;
  conversations: Conversation[];
  hydrated: boolean;

  // Actions
  setActiveConversation: (id: string | null) => void;
  openConversationWithUser: (user: User) => Promise<void>;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  removeConversation: (conversationId: string) => Promise<void>;
  receiveMessage: (message: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: string | Date;
  }) => void;
  setCurrentUser: (user: User) => void;
  logout: () => void;
  setHydrated: () => void;

  getActiveConversation: () => Conversation | undefined;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      activeConversationId: null,
      currentUser: null,
      conversations: [],
      hydrated: false,

      setActiveConversation: (id) => set({ activeConversationId: id }),

      loadConversations: async () => {
        const { currentUser, conversations } = get();
        if (!currentUser) return;
        if (!getAccessToken()) return;

        const res = await fetchChatConversationsApi();

        const nextConversations: Conversation[] = res.items.map((item) => {
          const existed = conversations.find((c) => c.id === item.id);
          const otherParticipant =
            existed?.participants.find((p) => p.id !== currentUser.id) ?? {
              id: item.id,
              name: item.title || 'Cuộc trò chuyện',
              avatar: `https://i.pravatar.cc/150?u=${item.id}`,
            };

          const messages: Message[] = item.lastMessage
            ? [
                {
                  id: item.lastMessage.id,
                  content: item.lastMessage.content,
                  senderId: item.lastMessage.senderId,
                  createdAt: new Date(item.lastMessage.createdAt),
                  status: 'sent',
                },
              ]
            : existed?.messages ?? [];

          return {
            id: item.id,
            participants: [currentUser, otherParticipant],
            messages,
            unreadCount: existed?.unreadCount ?? 0,
          };
        });

        set({ conversations: nextConversations });
      },

      openConversationWithUser: async (user) => {
        const { currentUser, conversations } = get();
        if (!currentUser) return;
        if (!getAccessToken()) return;

        const existedConversation = conversations.find((conversation) =>
          conversation.participants.some((participant) => participant.id === user.id),
        );

        if (existedConversation) {
          set({ activeConversationId: existedConversation.id });
          await get().loadMessages(existedConversation.id);
          return;
        }

        const created = await createPrivateConversationApi(user.id);
        const newConversation: Conversation = {
          id: created.id,
          participants: [currentUser, user],
          messages: [],
          unreadCount: 0,
        };

        set({
          conversations: [newConversation, ...conversations],
          activeConversationId: newConversation.id,
        });

        await get().loadMessages(newConversation.id);
      },

      loadMessages: async (conversationId) => {
        const { conversations } = get();
        if (!getAccessToken()) return;
        const res = await fetchConversationMessagesApi(conversationId);

        const messages: Message[] = [...res.items]
          .reverse()
          .map((item) => ({
            id: item.id,
            content: item.content,
            senderId: item.senderId,
            createdAt: new Date(item.createdAt),
            status: 'sent' as const,
          }));

        set({
          conversations: conversations.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  messages,
                }
              : conversation,
          ),
        });
      },

      sendMessage: async (content) => {
        const { activeConversationId, currentUser, conversations } = get();
        if (!activeConversationId || !currentUser) return;
        if (!getAccessToken()) return;

        const sent = await sendMessageApi({
          conversationId: activeConversationId,
          content,
        });

        const newMessage: Message = {
          id: sent.id,
          content: sent.content,
          senderId: sent.senderId,
          createdAt: new Date(sent.createdAt),
          status: 'sent',
        };

        set({
          conversations: conversations.map((conv) => {
            if (conv.id !== activeConversationId) return conv;
            const alreadyExists = conv.messages.some((m) => m.id === newMessage.id);
            if (alreadyExists) return conv;
            return {
              ...conv,
              messages: [...conv.messages, newMessage],
            };
          }),
        });
      },

      removeConversation: async (conversationId) => {
        if (!getAccessToken()) return;

        await deleteConversationApi(conversationId);

        const { activeConversationId, conversations } = get();
        const nextConversations = conversations.filter(
          (conversation) => conversation.id !== conversationId,
        );

        set({
          conversations: nextConversations,
          activeConversationId:
            activeConversationId === conversationId ? null : activeConversationId,
        });
      },

      receiveMessage: (incoming) => {
        const { conversations, currentUser } = get();

        const mappedMessage: Message = {
          id: incoming.id,
          content: incoming.content,
          senderId: incoming.senderId,
          createdAt: new Date(incoming.createdAt),
          status: 'sent',
        };

        const targetConversation = conversations.find(
          (c) => c.id === incoming.conversationId,
        );

        if (!targetConversation) {
          if (!currentUser) return;
          const placeholderUser: User = {
            id: incoming.senderId,
            name: 'Người dùng',
            avatar: `https://i.pravatar.cc/150?u=${incoming.senderId}`,
          };

          set({
            conversations: [
              {
                id: incoming.conversationId,
                participants: [currentUser, placeholderUser],
                messages: [mappedMessage],
                unreadCount: 0,
              },
              ...conversations,
            ],
          });
          return;
        }

        set({
          conversations: conversations.map((conversation) => {
            if (conversation.id !== incoming.conversationId) return conversation;
            const alreadyExists = conversation.messages.some(
              (msg) => msg.id === mappedMessage.id,
            );
            if (alreadyExists) return conversation;

            return {
              ...conversation,
              messages: [...conversation.messages, mappedMessage],
            };
          }),
        });
      },

      setCurrentUser: (user) => set({ currentUser: user }),
      logout: () =>
        set({ currentUser: null, activeConversationId: null, conversations: [] }),
      setHydrated: () => set({ hydrated: true }),

      getActiveConversation: () => {
        const { activeConversationId, conversations } = get();
        return conversations.find((c) => c.id === activeConversationId);
      },
    }),
    {
      name: 'chat-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
      partialize: (state) => ({
        currentUser: state.currentUser,
        activeConversationId: state.activeConversationId,
      }),
    },
  ),
);
