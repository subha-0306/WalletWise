const express = require('express');
const router = express.Router();
const { getReportSummary } = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/summary', getReportSummary);

module.exports = router;
