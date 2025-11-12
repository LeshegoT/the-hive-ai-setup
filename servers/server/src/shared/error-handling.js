const { isProduction } = require('@the-hive/lib-core');

function buildErrorObject(error) {
  if (error instanceof Error) {
    if (isProduction()) {
      // we should not include information, such as stack traces for production environments
      return {
        name: error.name,
        message: error.message,
      };
    } else {
      // we can include information, such as stack traces for non-production environments
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
  } else {
    // if the developer does not follow the rules and throws strings
    return error;
  }
}

module.exports = { buildErrorObject };
