const express = require('express');
const router = express.Router();
const { register, login, refresh, logout } = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validation/authSchemas');
const { loginRateLimiter } = require('../middleware/rateLimiter');

router.post('/register', validate(registerSchema), register);
router.post('/login', loginRateLimiter, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;
