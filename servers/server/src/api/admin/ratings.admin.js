const router = require('express').Router();
const apiGenerator = require('../../shared/standard-api');

apiGenerator.createStandardApiRoutes(
  router,
  '/rating-value',
  'ContentRatingValue'
);

module.exports = router;
