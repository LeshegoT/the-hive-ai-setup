let { logger } = require('./logger');

const handle_errors = (fn) => (req, res, next) =>{  
  Promise.resolve(fn(req, res, next)).catch((error) => {
    logger.error(error);
    next(error);
  })};

module.exports = { handle_errors };
