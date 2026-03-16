const fs = require('fs');
const path = require('path');

const getSounds = (req, res) => {
    const soundsDir = path.join(__dirname, '..', '..', '..', 'client', 'public', 'sounds');
    try {
        const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.webm'];
        const files = fs.readdirSync(soundsDir).filter(f =>
            audioExtensions.includes(path.extname(f).toLowerCase()) && !f.startsWith('.')
        );
        res.json({ files });
    } catch {
        res.json({ files: [] });
    }
};

module.exports = {
    getSounds
};
