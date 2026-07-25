const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const issue = error.issues[0];
      return res.status(400).json({
        error: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid request payload',
        details: error.issues,
      });
    }
    return res.status(400).json({ error: 'Validation error' });
  }
};

module.exports = { validate };
