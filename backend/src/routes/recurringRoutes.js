const express = require('express');
const router = express.Router();
const {
  getRecurring,
  createRecurring,
  patchRecurring,
  deleteRecurring,
} = require('../controllers/recurringController');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createRecurringSchema, patchRecurringSchema } = require('../validation/planningSchemas');

router.use(authenticateToken);

router.get('/', getRecurring);
router.post('/', validate(createRecurringSchema), createRecurring);
router.patch('/:id', validate(patchRecurringSchema), patchRecurring);
router.delete('/:id', deleteRecurring);

module.exports = router;
