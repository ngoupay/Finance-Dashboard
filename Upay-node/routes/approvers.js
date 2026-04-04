const express = require('express');
const ApproverController = require('../controllers/approver');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.post('/create', checkAuth, ApproverController.createApprover);
router.post('/edit', checkAuth, ApproverController.updateApprover);
router.delete('/:id', checkAuth, ApproverController.deleteApprover);
router.get('', checkAuth, ApproverController.getApprover);
router.get('/forward',ApproverController.getApprover);


module.exports = router;
