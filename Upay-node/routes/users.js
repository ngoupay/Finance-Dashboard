const express = require('express');
const UserController = require('../controllers/user');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.post('/signup', checkAuth, UserController.signup);
router.post('/login', UserController.login);
router.post('/edit', checkAuth, UserController.updateUser);
router.post('/resetPassword', checkAuth, UserController.resetPassword);
router.delete('/:id', checkAuth, UserController.deleteUser);
router.get('', UserController.getUser);

module.exports = router;
