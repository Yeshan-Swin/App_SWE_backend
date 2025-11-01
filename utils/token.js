const jwt = require('jsonwebtoken');

const JWT_ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRY_DAYS = 7;

function requireSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

function createAccessToken(payload) {
  const secret = requireSecret();
  return jwt.sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
    },
    secret,
    {
      algorithm: JWT_ALGORITHM,
    }
  );
}

function verifyAccessToken(token) {
  const secret = requireSecret();
  return jwt.verify(token, secret, { algorithms: [JWT_ALGORITHM] });
}

module.exports = {
  createAccessToken,
  verifyAccessToken,
};
