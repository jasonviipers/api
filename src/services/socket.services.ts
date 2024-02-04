import { Server as httpServer } from 'http';
import { Server as SocketIoServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { LoggerUtils } from '../utils/logger.utils';
import 'dotenv/config';

export default class SocketServer {
    protected httpServer: httpServer;
    protected io: SocketIoServer;

    constructor(httpServer: httpServer) {
        this.httpServer = httpServer;
        this.io = new SocketIoServer(this.httpServer, {
            cors: {
                origin: process.env.CORS_ORIGIN,
                methods: ['GET', 'POST'],
            },
        });
    }

    public initialize(): void {
        this.io.on('connection', (socket: Socket) => {
            LoggerUtils.info(`Socket connected: ${socket.id}`);
            socket.on('disconnect', () => {
                LoggerUtils.info(`Socket disconnected: ${socket.id}`);
            });

            socket.on('message', (message: string) => {
                LoggerUtils.info(`Message received: ${message}`);
                this.io.emit('message', `${socket.id.substr(0, 2)} said ${message}`);
            });
        });
    }
}
