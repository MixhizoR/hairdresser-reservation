const http = require('http');
const app = require('./app');
const db = require('./services/db.service');
const socketModule = require('./socket');
const { PORT } = require('./config/env');

const server = http.createServer(app);

// Initialize Socket.io
socketModule.init(server);

// ─── Start ───
async function main() {
    await db.connect();
    server.listen(PORT, () => console.log(`🚀 Sunucu ${PORT} portunda çalışıyor.`));
}

main();
