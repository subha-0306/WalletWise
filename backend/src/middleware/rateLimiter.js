const rateLimit = require('express-rate-limit');

const isProd = process.env.NODE_ENV === 'production';

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 10 : 100, // 100 in development, 10 in production
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

module.exports = { loginRateLimiter };
