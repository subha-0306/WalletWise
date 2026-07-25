const express = require('express');
const router = express.Router();
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createTransactionSchema, patchTransactionSchema } = require('../validation/transactionSchemas');

router.use(authenticateToken);

router.get('/', getTransactions);
router.post('/', validate(createTransactionSchema), createTransaction);
router.patch('/:id', validate(patchTransactionSchema), updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
