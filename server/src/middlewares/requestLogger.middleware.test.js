const { requestLogger } = require('./requestLogger.middleware');
const { log } = require('../config/logger');

jest.mock('../config/logger', () => ({
  log: jest.fn()
}));

describe('requestLogger middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      path: '/test',
      ip: '127.0.0.1'
    };
    res = {
      statusCode: 200,
      on: jest.fn((event, cb) => {
        if (event === 'finish') {
          res.finishCallback = cb;
        }
      })
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next and register finish listener', () => {
    requestLogger(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('should log request details on finish', () => {
    requestLogger(req, res, next);
    res.finishCallback();
    expect(log).toHaveBeenCalledWith('info', 'HTTP Request', expect.objectContaining({
      method: 'GET',
      path: '/test',
      status: 200,
      ip: '127.0.0.1',
      duration: expect.stringMatching(/^\d+ms$/)
    }));
  });
});
