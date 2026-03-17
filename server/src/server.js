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
    // 0.0.0.0 ile tüm network interface'lerinden dinle (diğer cihazlar erişebilsin)
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Sunucu ${PORT} portunda çalışıyor.`);
        console.log(`📱 Yerel erişim: http://localhost:${PORT}`);
        console.log(`🌐 Ağ erişimi: http://0.0.0.0:${PORT}`);
    });
}

main();
