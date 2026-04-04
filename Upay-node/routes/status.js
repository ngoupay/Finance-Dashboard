const express = require('express');
const StatusController = require('../controllers/status');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.post('/create', checkAuth, StatusController.createStatus);
router.post('/edit', checkAuth, StatusController.updateStatus);
router.delete('/:id', checkAuth, StatusController.deleteStatus);
router.get('', StatusController.getStatus);


module.exports = router;
