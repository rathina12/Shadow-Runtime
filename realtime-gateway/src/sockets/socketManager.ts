import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { config } from '../config/env';

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected to Shadow Runtime Socket.IO [ID: ${socket.id}]`);

    socket.on('join_room', (room: string) => {
      socket.join(room);
      console.log(`Socket [${socket.id}] joined room: ${room}`);
    });

    socket.on('leave_room', (room: string) => {
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });

  return io;
}

export function broadcastTrace(trace: any): void {
  if (io) {
    io.emit('trace_event', trace);
  }
}

export function broadcastMetrics(metrics: any): void {
  if (io) {
    io.emit('metrics_tick', metrics);
  }
}

export function broadcastServiceHealth(healthUpdate: any): void {
  if (io) {
    io.emit('service_health_update', healthUpdate);
  }
}

export function broadcastChaosEvent(chaosEvent: any): void {
  if (io) {
    io.emit('chaos_event', chaosEvent);
  }
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}
