/**
 *
 * Module importing .env file
 * @module core/env
 * @requires dotenv
 */

import dotenv from 'dotenv';
import { parseIfSetElseDefault } from './environment-utils';

const options = {
  path: `env/${parseIfSetElseDefault("NODE_ENV", "")}.env`,
};

const secrets = {
  path: `env/${parseIfSetElseDefault("NODE_ENV", "")}.secret.env`,
};

dotenv.config(secrets);
dotenv.config(options);
