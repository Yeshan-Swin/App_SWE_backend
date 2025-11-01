const express = require('express');
const { getMe } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', requireAuth, getMe);

module.exports = router;
