const express = require('express');
const {
  createDeploymentRecord,
  getDeployments,
  getLatestDeployments,
} = require('../controllers/deploymentController');

const router = express.Router();

router.post('/', createDeploymentRecord);
router.get('/', getDeployments);
router.get('/latest', getLatestDeployments);

module.exports = router;
