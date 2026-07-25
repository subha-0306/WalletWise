const express = require('express');
const router = express.Router();
const {
  getBudgets,
  upsertBudget,
  deleteBudget,
} = require('../controllers/budgetController');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { upsertBudgetSchema } = require('../validation/planningSchemas');

router.use(authenticateToken);

router.get('/', getBudgets);
router.post('/', validate(upsertBudgetSchema), upsertBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
