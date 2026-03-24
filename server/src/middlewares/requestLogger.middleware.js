const { log } = require('../config/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    log('info', 'HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${Date.now() - start}ms`,
      ip: req.ip
    });
  });
  next();
};

module.exports = { requestLogger };
