/**
 * Module exposing utlity functions for working with node environment variables.
 *
 * @module shared/environment-utils
 */

/**
 * Check whether the current environment is considered a production environment.
 */
export const isProduction = (): boolean => {
  return parseIfSetElseDefault('PRODUCTION', false);
};

/**
 * Check whether the current environment is considered a local environment
 */
export const isLocal = (): boolean => {
  return getEnvironmentName() === 'local';
};

/**
 * Retrieve allowed external emails from the environment and parse into an array
 */
export const allowedExternalEmails = (): Array<string> => {
  return parseIfSetElseDefault<string[]>('ALLOWED_EXTERNAL_EMAILS', []).map((email: string) => email.toLocaleLowerCase());
};

/**
 * Get a string replresentation of the environment name
 *
 * For use when creating emails and other string where we need to know which
 * enviromnent it came from.
 */
export const getEnvironmentName = (showProd = false): string => {
  if (isProduction()) {
    return showProd ? parseIfSetElseDefault("NODE_ENV", "") : '';
  } else {
    return parseIfSetElseDefault("NODE_ENV", "");
  }
};

/**
 * Prepend a string replresentation of the environment name to the supplied message
 *
 * For use when creating emails and other string where we need to know which
 * enviromnent it came from.
 */
export const prependEnvironment = (message: string, showProd = false): string => {
  const envName = getEnvironmentName(showProd)?.toUpperCase();
  return envName === '' ? message : `[${envName}] ${message}`;
};

/**
 * Parse the value of an environment variable if it is set.
 *
 * If the value is not set on the environment, or parsing fails, return the
 * default value.
 *
 */
export const parseIfSetElseDefault = <T>(name: string, defaultValue: T): T  => {
  const envValue = process.env[name];

  if (envValue === undefined) {
    return defaultValue;
  }

  try {
    return JSON.parse(envValue);
  }
  /* eslint-disable */
  catch (err) {
    // we are ignoring the error and assuming the value does not need JSON parsing (i.e. is a string, number, etc)
    return envValue as T;
  }
  /* eslint-enable */
};

/**
 * Returns BBD domains from the environment
 * @returns {Array<string>} BBD domains
 */
export const bbdDomains: string[] = parseIfSetElseDefault('BBD_DOMAINS', ['bbd.co.za', 'bbdsoftware.com', 'ilion.co.za']);


/**
 * Get the base URL for the specified app from the environment.
 *
 * The value of the environment variable BASE_SERVER_URL is returned for all apps
 * except "admin", in which case the value of the ADMIN_REDIRECT_URI envionment
 * variable will be returned.
 *
 * If the appropriate environment variable is not set, then a default value of
 * "https://the-hive.bbd.co.za/" will be returned.
 *
 * The returned URL will always include a trailing '/'
 *
 */
export const getBaseURL = (app: string): string => {
  const envVarName = app === 'admin' ? 'ADMIN_REDIRECT_URI' : 'BASE_SERVER_URL';
  const returnValue = process.env[envVarName] ?? 'https://the-hive.bbd.co.za/';
  if (!returnValue.endsWith('/')) {
    return returnValue + '/';
  } else {
    return returnValue;
  }
};
