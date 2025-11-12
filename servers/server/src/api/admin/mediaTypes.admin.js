const router = require('express').Router();
const apiGenerator = require('../../shared/standard-api');

apiGenerator.createStandardApiRoutes(
  router,
  '/content-media-type',
  'ContentMediaType'
);

module.exports = router;
