const User = require('../models/User');
const Password = require('../models/Password');
const { hashPassword, verifyPassword } = require('../utils/password');
const { createAccessToken } = require('../utils/token');

async function signup(req, res) {
  const { email, password, name, timezone = 'UTC', avatar_url: avatarUrl } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ detail: 'Email, password and name are required' });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ detail: 'Email already registered' });
  }

  const user = await User.create({
    email: email.toLowerCase(),
    name,
    timezone,
    avatarUrl,
  });

  const hashedPassword = hashPassword(password);
  await Password.create({
    userId: user.id,
    hashedPassword,
  });

  const accessToken = createAccessToken({ user_id: user.id });

  return res.status(201).json({
    access_token: accessToken,
    token_type: 'bearer',
    user: user.toJSON(),
  });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ detail: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ detail: 'Invalid credentials' });
  }

  const passwordDoc = await Password.findOne({ userId: user.id });
  if (!passwordDoc || !verifyPassword(password, passwordDoc.hashedPassword)) {
    return res.status(401).json({ detail: 'Invalid credentials' });
  }

  const accessToken = createAccessToken({ user_id: user.id });

  return res.json({
    access_token: accessToken,
    token_type: 'bearer',
    user: user.toJSON(),
  });
}

async function getMe(req, res) {
  return res.json(req.user);
}

module.exports = {
  signup,
  login,
  getMe,
};
