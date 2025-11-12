const apiGenerator = require('../../shared/standard-api');
const router = require('express').Router();

apiGenerator.createStandardApiRoutes(router, '/voting-events', 'VotingEvents');
apiGenerator.createStandardApiRoutes(
  router,
  '/voting-options',
  'VotingOptions'
);

module.exports = router;
