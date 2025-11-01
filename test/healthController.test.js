const { healthCheck } = require('../controllers/healthController');
const mongoose = require('mongoose');

jest.mock('mongoose', () => ({
  connection: {
    db: {
      command: jest.fn(),
    },
  },
}));

const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe('healthController.healthCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('responds healthy when database ping succeeds', async () => {
    const res = createRes();
    mongoose.connection.db.command.mockResolvedValue({ ok: 1 });

    await healthCheck({}, res);

    expect(mongoose.connection.db.command).toHaveBeenCalledWith({ ping: 1 });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'healthy',
        database: 'connected',
      })
    );
  });

  it('returns 503 when ping throws error', async () => {
    const res = createRes();
    mongoose.connection.db.command.mockRejectedValue(new Error('boom'));

    await healthCheck({}, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      detail: 'Service unhealthy: boom',
    });
  });
});
