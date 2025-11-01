const express = require('express');
const {
  getGroups,
  createGroup,
  getGroup,
  inviteToGroup,
} = require('../controllers/groupController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', getGroups);
router.post('/', createGroup);
router.get('/:groupId', getGroup);
router.post('/:groupId/invite', inviteToGroup);

module.exports = router;
