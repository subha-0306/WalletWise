const express = require('express');
const router = express.Router();
const {
  getLoans,
  createLoan,
  settleLoan,
  deleteLoan,
} = require('../controllers/loanController');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createLoanSchema, settleLoanSchema } = require('../validation/loanSchemas');

router.use(authenticateToken);

router.get('/', getLoans);
router.post('/', validate(createLoanSchema), createLoan);
router.patch('/:id/settle', validate(settleLoanSchema), settleLoan);
router.delete('/:id', deleteLoan);

module.exports = router;
