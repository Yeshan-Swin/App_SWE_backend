const express = require('express');
const {
  suggestTimes,
  createEvent,
} = require('../controllers/scheduleController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.post('/suggest', suggestTimes);
router.post('/create', createEvent);

module.exports = router;
