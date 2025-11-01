const { signup, login } = require('../controllers/authController');
const User = require('../models/User');
const Password = require('../models/Password');
const passwordUtils = require('../utils/password');
const tokenUtils = require('../utils/token');

jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../models/Password', () => ({
  create: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock('../utils/password', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
}));

jest.mock('../utils/token', () => ({
  createAccessToken: jest.fn(),
}));

const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe('authController.signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new user when email is unused', async () => {
    const req = {
      body: {
        email: 'test@example.com',
        password: 'Secret123',
        name: 'Tester',
        timezone: 'UTC',
      },
    };
    const res = createRes();

    User.findOne.mockResolvedValue(null);
    const userDoc = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Tester',
      timezone: 'UTC',
      toJSON: () => ({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Tester',
        timezone: 'UTC',
        avatar_url: null,
        created_at: '2025-01-01T00:00:00.000Z',
      }),
    };
    User.create.mockResolvedValue(userDoc);
    passwordUtils.hashPassword.mockReturnValue('hashed');
    Password.create.mockResolvedValue({});
    tokenUtils.createAccessToken.mockReturnValue('token-abc');

    await signup(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(User.create).toHaveBeenCalledWith({
      email: 'test@example.com',
      name: 'Tester',
      timezone: 'UTC',
      avatarUrl: undefined,
    });
    expect(Password.create).toHaveBeenCalledWith({
      userId: 'user-123',
      hashedPassword: 'hashed',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      access_token: 'token-abc',
      token_type: 'bearer',
      user: userDoc.toJSON(),
    });
  });

  it('rejects duplicate email addresses', async () => {
    const req = {
      body: {
        email: 'duplicate@example.com',
        password: 'Secret123',
        name: 'Tester',
      },
    };
    const res = createRes();

    User.findOne.mockResolvedValue({ id: 'existing' });

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      detail: 'Email already registered',
    });
    expect(User.create).not.toHaveBeenCalled();
  });
});

describe('authController.login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs in a user with valid credentials', async () => {
    const req = {
      body: {
        email: 'test@example.com',
        password: 'Secret123',
      },
    };
    const res = createRes();

    const userDoc = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Tester',
      toJSON: () => ({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Tester',
        timezone: 'UTC',
        avatar_url: null,
        created_at: '2025-01-01T00:00:00.000Z',
      }),
    };

    User.findOne.mockResolvedValue(userDoc);
    Password.findOne.mockResolvedValue({ hashedPassword: 'hashed' });
    passwordUtils.verifyPassword.mockReturnValue(true);
    tokenUtils.createAccessToken.mockReturnValue('token-abc');

    await login(req, res);

    expect(passwordUtils.verifyPassword).toHaveBeenCalledWith(
      'Secret123',
      'hashed'
    );
    expect(res.json).toHaveBeenCalledWith({
      access_token: 'token-abc',
      token_type: 'bearer',
      user: userDoc.toJSON(),
    });
  });

  it('returns invalid credentials when user not found', async () => {
    const req = {
      body: {
        email: 'missing@example.com',
        password: 'Secret123',
      },
    };
    const res = createRes();

    User.findOne.mockResolvedValue(null);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      detail: 'Invalid credentials',
    });
  });
});
