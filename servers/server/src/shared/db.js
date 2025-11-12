/**
 *
 * Module containing database related utility functions
 * @module shared/db
 *
 * @requires mssql
 * @requires module:core/logger
 */

/**
 * The MS-SQL module
 */
const { logger } = require('@the-hive/lib-core');
const appinsights = require('applicationinsights');
const { isLocal } = require('@the-hive/lib-core');
const dbShared = require('@the-hive/lib-db');

module.exports = new dbShared.Database(
  logger,
  appinsights.defaultClient,
  isLocal()
);
