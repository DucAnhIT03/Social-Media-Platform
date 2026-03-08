export interface User {
    id: string;
    name: string;
    avatar: string;
}

export interface Message {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
    status: 'sending' | 'sent' | 'seen';
}

export interface Conversation {
    id: string;
    participants: User[];
    messages: Message[];
    unreadCount: number;
}

export type CallType = 'incoming' | 'outgoing' | 'missed';

export interface Call {
    id: string;
    participant: User;
    type: CallType;
    date: Date;
    duration?: string; // e.g. "5m 23s"
}
