const log = (level, message, meta = {}) => {
    const entry = { ts: new Date().toISOString(), level, message, ...meta };
    if (level === 'error') console.error(JSON.stringify(entry));
    else console.log(JSON.stringify(entry));
};

module.exports = {
    log,
};
