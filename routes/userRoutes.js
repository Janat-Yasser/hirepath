const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('user'));

router.get('/dashboard', userController.dashboard);
router.get('/profile', userController.profileForm);
router.put('/profile', userController.updateProfile);

module.exports = router;
