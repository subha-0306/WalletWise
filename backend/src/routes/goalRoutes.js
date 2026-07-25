const express = require('express');
const router = express.Router();
const {
  getGoals,
  createGoal,
  contributeGoal,
  deleteGoal,
} = require('../controllers/goalController');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createGoalSchema, contributeGoalSchema } = require('../validation/planningSchemas');

router.use(authenticateToken);

router.get('/', getGoals);
router.post('/', validate(createGoalSchema), createGoal);
router.post('/:id/contribute', validate(contributeGoalSchema), contributeGoal);
router.delete('/:id', deleteGoal);

module.exports = router;
