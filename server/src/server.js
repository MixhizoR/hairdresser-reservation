const app = require('./app');
const db = require('./services/db.service');
const { PORT } = require('./config/env');

// ─── Start ───
async function main() {
    await db.connect();
    // 0.0.0.0 ile tüm network interface'lerinden dinle (diğer cihazlar erişebilsin)
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Sunucu ${PORT} portunda çalışıyor.`);
        console.log(`📱 Yerel erişim: http://localhost:${PORT}`);
        console.log(`🌐 Ağ erişimi: http://0.0.0.0:${PORT}`);
    });
}

main();
