const express = require('express');
const router = express.Router();
const authController = require('../controller/auth');
const { loginLimiter, signupLimiter } = require('../middlewares/rateLimit');
const { validateLogin, validateSignup } = require('../middlewares/validate');

// Authentication routes
router.post('/signup', signupLimiter, validateSignup, authController.signup);
router.post('/login', loginLimiter, validateLogin, authController.login);
router.get('/me', authController.getCurrentUser);
router.post('/logout', authController.logout);
router.put('/update-profile', authController.updateProfile); // New route

module.exports = router;