const AppError = require('../utils/app-error');

module.exports = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    return next(new AppError('Request validation failed', 400, 'VALIDATION_ERROR', result.error.flatten()));
  }

  if (source === 'query') req.validatedQuery = result.data;
  else req[source] = result.data;
  return next();
};
