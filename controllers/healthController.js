const mongoose = require('mongoose');

async function healthCheck(_req, res) {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not initialized');
    }

    await db.command({ ping: 1 });
    return res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0',
    });
  } catch (err) {
    return res.status(503).json({
      detail: `Service unhealthy: ${err.message}`,
    });
  }
}

module.exports = {
  healthCheck,
};
