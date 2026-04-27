const express = require('express');
const ApprovalController = require('../controllers/approval');
const checkAuth = require('../middleware/check-auth');
const extractFile = require('../middleware/file');
const extractSalaryFiles = require('../middleware/file-salary');

const router = express.Router();

router.post('', extractFile, ApprovalController.createApproval);
router.put('', extractFile, ApprovalController.updateApproval);
router.post('/create/:id', extractFile, ApprovalController.createApproval2);
router.put('/update/:id', extractFile, ApprovalController.updateApproval2);
router.post('/salary', extractSalaryFiles, ApprovalController.createSalary);
router.post('/bill', extractFile, ApprovalController.createBill);
router.put('/bill/:id', extractFile, ApprovalController.updateBill);
router.post('/awardtable', extractFile, ApprovalController.createAward);
router.put('/awardtable/:id', extractFile, ApprovalController.updateAward);
router.get('', checkAuth, ApprovalController.getApproval);
router.get('/approvalStatusData', checkAuth, ApprovalController.getApprovalStatusData);
router.post('/approve', checkAuth, extractFile, ApprovalController.sendApproval);
router.post('/sendToUpdate', checkAuth, extractFile, ApprovalController.sendToUpdate);
router.post('/forward', extractFile, ApprovalController.forwardApproval);

router.post('/approve/central', checkAuth, extractFile, ApprovalController.sendToCentral);
router.post('/approve/audit', checkAuth, extractFile, ApprovalController.sendToAudit);//added
router.post('/approve/notify', checkAuth, extractFile, ApprovalController.notifyInitiator);
router.post('/approve/editable', checkAuth, extractFile, ApprovalController.returnEditable);
router.post('/approve/fundTransfer', checkAuth, ApprovalController.fundTransfer);
router.post('/confirmation/:status/:token', ApprovalController.confirmation);
router.get('/otp/send/:contact', ApprovalController.sendOTP);
router.get('/otp/verify/:id/:input', ApprovalController.verifyOTP);
router.delete('/:id/:approvalId/:claimId', checkAuth, ApprovalController.deleteApproval);
router.get('/getSingleApproval/:id/:claimId/:trackflag', ApprovalController.getSingleApproval);
router.get('/getAwardApproval/:id', ApprovalController.getAwardApproval);
router.get('/getBillApproval/:id', ApprovalController.getBillApproval);
router.get('/getUnutilizedamt/:id', ApprovalController.getUnutilizedamt);
router.get('/salary/:id', ApprovalController.getSalaryFromApprovalId);
router.put('/salary/:id', extractSalaryFiles, ApprovalController.updateSalary);

module.exports = router;