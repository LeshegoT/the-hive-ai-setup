import { logger } from './logger';

export type ExpiringValue<T> = T & {
  /**
   *  the date at which the value should be considered expired
   */
  expiry: Date;
}

/**
 * Cache to hold promises and values for expiring values.
 * Values must be promises (or resolved objects) that have an expiry property of type Date to be
 * checked at the time of the access of the cached object.
 */
// eslint-disable-next-line
const expiringCache: Map<string,Promise<ExpiringValue<any>>|ExpiringValue<any>> = new Map();

/**
 * Call the function to calculate a value and cache it until it expires, returning
 * the cached value immediately if it exists an is not expired.
 *
 * This function is mostly intended to be used where `calculate` is a function
 * that will return a promise, but direct values are also supported.
 *
 * While the calculation promise is pending, the same promise will be returned
 * from this function, otherwise when the calculation promise has resolved, the
 * promise in the cache is replaced with the actual value and that value is
 * returned directly.
 *
 * @param {string} name the name of the value to be stored/retrieved from the cache
 * @param {() => Promise<ExpiringValue<T>> | ExpiringValue<T>} calculate a function to calculate the value to be cached
 * @returns {Promise<ExpiringValue<T>>} a promise (pending or resolved) of the cache value or undefined if the calculate function eventually returns undefined or null
 */

export async function cacheUntilExpiry<T>(name: string,calculate: () => Promise<ExpiringValue<T>> | ExpiringValue<T>): Promise<ExpiringValue<T>|undefined> {

  if(expiringCache.has(name)){
    const currentCachedValue = expiringCache.get(name);
    logger.info(`Cached value for ${name} is , %s`, JSON.stringify({ currentCachedValue }));
    if (currentCachedValue!==undefined && currentCachedValue!==null) {
      if (currentCachedValue instanceof Promise) {
        logger.info(`Cached value for ${name} cache still pending , %s`, JSON.stringify({ currentCachedValue }));
        // if the cached value is not a promise, it will be re-wrapped due to the async nature of this function
        return currentCachedValue;
      } else if (currentCachedValue.expiry && currentCachedValue.expiry < new Date()) {
        // remove cached value if it exists and it is old
        logger.info(`Cached value for ${name} has expired, %s, removing from cache and re-calculating`,JSON.stringify({ currentCachedValue }));
        expiringCache.delete(name);
        return cacheUntilExpiry(name, calculate);
      } else {
        logger.info(`Cached value for ${name} cache still valid, %s`, JSON.stringify({ currentCachedValue }));
        // if the cached value is not a promise, it will be re-wrapped due to the async nature of this function
        return currentCachedValue;
      }
  } else {
    // we cached a null or undefined value, standardize on undefined
    logger.info(`Cached value for ${name} is undefined`);
    return undefined;
  }
 } else {
    const calculationPromise = execAsync(calculate);
    // internally wait for the promise to resolve so cache can check that the value can be cached for expiry
    calculationPromise.then(result => {
      if (! result.expiry || result.expiry < new Date()){
        logger.error(`Promise for ${name} cache has resolved, but has no expiry information, or is already expired, %s`, JSON.stringify({ result }));
        expiringCache.delete(name);
      } else {
        logger.info(`Promise for ${name} cache has resolved, replacing promise with value %s`, JSON.stringify({ result }));
        expiringCache.set(name, result);
      }
    })
    expiringCache.set(name, calculationPromise);
    return expiringCache.get(name);
  }
}

/**
 * Cache to hold promises and values for a non-expiring cache.
 * Values must be promises (or resolved objects)
 */
const nonExpiringCache: Map<string, Promise<any> | any> = new Map(); // eslint-disable-line


/**
 * Execute function asynchronously, even if the function itself is not async.
 *
 * `execAsync(f)` is different from `Promise.resolve(f())`, the latter will execute `f()` and then wrap the result.
 *
 * `execAsync` will wrap the function call in a new async lambda and invoke it immediately.
 *
 * Since JS engines avoid wrapping promises in promises, if `func` parameter is already an async function, the result will be identical
 * to the case where we return the invocation of `func()` directly.
* @param {() => Promise<any> | any} func a function (synch or async) that will be executed asynchronously and the result wrapped in a promise.
*/
function execAsync<T>(func: () => Promise<T> | T): Promise<T> {
  return (async () => func())()
}

/**
 * Cache to hold promises and values for a non-expiring cache.
 * Values must be promises (or resolved objects)
 * @param {() => Promise<any> | any} initializer a function (synch or async) that returns the value to be cached.
 * @type {Map<string,Promise<any>|any>}
 */
export function cache<T>(name: string, initializer: () => Promise<T> | T): Promise<T>|T {
  if (!nonExpiringCache.has(name)) {
    logger.info(`Initializing cache for ${name} at ${new Date()}`);
    const valueToCache = execAsync(initializer)
      .then((res) => {
        logger.info(`Initialization done for cache ${name} at ${new Date()}`);
        return res;
      });
    nonExpiringCache.set(name, valueToCache);
  }
  return nonExpiringCache.get(name);
}

/**
* Function to simply wrap a value in an expiring value
*
* @param {T} value the value that needs to be augmented with an expiry
* @param {Date} expiry the date at which the value should be considered expired
* @returns the new value with the expiry date
*/
export function makeExpiringValue<T>(value: T, expiry: Date): ExpiringValue<T>{
  return Object.assign(value, {expiry});
}
