import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getRealtimeSocket(token: string): Socket {
  if (socket) return socket;

  const baseUrl =
    process.env.NEXT_PUBLIC_REALTIME_URL || 'http://localhost:3005';

  socket = io(`${baseUrl}/realtime`, {
    transports: ['websocket'],
    auth: { token },
  });

  return socket;
}

