const express = require('express');
const router = express.Router();
const { getWalletSummary } = require('../controllers/walletController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/summary', getWalletSummary);

module.exports = router;
