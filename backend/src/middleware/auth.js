const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'super_secret_access_key_walletwise_2026', (err, user) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired access token' });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
