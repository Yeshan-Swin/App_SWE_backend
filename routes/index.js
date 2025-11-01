const express = require('express');

const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const groupRoutes = require('./groupRoutes');
const scheduleRoutes = require('./scheduleRoutes');
const deploymentRoutes = require('./deploymentRoutes');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    message: 'Group Study Scheduler API',
    version: '1.0.0',
    docs: '/docs',
  });
});

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/', userRoutes);
router.use('/groups', groupRoutes);
router.use('/schedule', scheduleRoutes);
router.use('/deployments', deploymentRoutes);

module.exports = router;
