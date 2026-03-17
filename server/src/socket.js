let io;

module.exports = {
    init: (httpServer) => {
        const { Server } = require('socket.io');
        const jwt = require('jsonwebtoken');
        const { ALLOWED_ORIGIN, JWT_SECRET } = require('./config/env');

        io = new Server(httpServer, {
            cors: { 
                origin: [ALLOWED_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
                methods: ['GET', 'POST'], 
                credentials: true 
            }
        });

        io.use((socket, next) => {
            const token = socket.handshake.auth?.token;
            if (token) {
                try { socket.admin = jwt.verify(token, JWT_SECRET); } catch { }
            }
            next();
        });

        io.on('connection', (socket) => {
            socket.on('disconnect', () => { });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
};
