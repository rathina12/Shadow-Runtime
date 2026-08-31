import axios from 'axios';
import { io, Socket } from 'socket.io-client';

export const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:4000';
export const CORE_SERVICE_URL = process.env.NEXT_PUBLIC_CORE_URL || 'http://localhost:8080';

export const gatewayApi = axios.create({
  baseURL: GATEWAY_URL,
  timeout: 10000,
});

export const coreApi = axios.create({
  baseURL: CORE_SERVICE_URL,
  timeout: 10000,
});

// Attach JWT token automatically
export function setAuthToken(token: string | null) {
  if (token) {
    coreApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    gatewayApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete coreApi.defaults.headers.common['Authorization'];
    delete gatewayApi.defaults.headers.common['Authorization'];
  }
}

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(GATEWAY_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socketInstance;
}
