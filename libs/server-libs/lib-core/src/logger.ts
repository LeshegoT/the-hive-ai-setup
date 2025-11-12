/**
 *
 * Module containing logging related functions
 * @module core/logging
 * @requires module:core/env
 * @requires pino
 */

import pino from 'pino';
import 'pino-http';
import './env';
import { parseIfSetElseDefault } from './environment-utils';

const logLevel = parseIfSetElseDefault("LOG_LEVEL", "warn");

console.log(`Setting log level to ${logLevel}`);

const options = {
  level: logLevel,
};

/**
 * Logger to use for logging (levels set up as per the environment)
 */
export const logger = pino(options);

export const logging_middleware = require('pino-http')({
  logger,
});

