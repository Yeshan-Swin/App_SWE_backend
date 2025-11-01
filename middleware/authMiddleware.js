const { verifyAccessToken } = require('../utils/token');
const User = require('../models/User');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ detail: 'Not authenticated' });
    }

    const token = header.split(' ')[1];
    const payload = verifyAccessToken(token);
    const userId = payload?.user_id;

    if (!userId) {
      return res.status(401).json({ detail: 'Invalid token' });
    }

    const userDoc = await User.findOne({ id: userId });
    if (!userDoc) {
      return res.status(401).json({ detail: 'User not found' });
    }

    req.user = userDoc.toJSON();
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ detail: 'Token expired' });
    }
    return res.status(401).json({ detail: 'Invalid token' });
  }
}

module.exports = {
  requireAuth,
};
