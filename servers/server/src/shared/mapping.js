/**
 * Module containing database related utility functions
 * @module shared/mapping
 */

/**
 * Type of functions that extract keys from objects for grouping
 * @callback keyExtractor
 * @param {*} element the element to extract a key for
 * @returns {*} the key for the mapping
 */

/**
 * Type for function to extract hashes from keys of objects for grouping
 * @callback keyHasher
 * @param {*} key the already extracted key
 * @returns {number|string} the repeateable hash of that key
 */

/**
 * Group an array by a property (key) which has been calculated from the elements
 * of the array.
 *
 * The object that is created does not inherit any prototypal properties because
 * it is created as `Object.create(null)` rather than any other type of constructed
 * object.
 *
 * When returnArray is true an object like `{"key1":[...], "key2":[...]}`
 * will be converted into an array like `[ { key1: [...] }, { key2: [...] } ]`
 *
 * @param {any[]} array the array to group
 * @param {keyExtractor} keyExtractor a function to extract the keys for the grouping
 * @param {boolean}[returnArray=false] return an array of objects rather than an keyed object, defaults to false
 * @returns {object} an object with properties mapped to arrays of grouped values
 *
 * @see groupIterableBy
 * @see groupIterableByObject
 * @see convertObjectToArrayByKeys
 */
function groupBy(array, keyExtractor, returnArray = false) {
  const groupedObject = array.reduce((accumulator, element) => {
    const key = keyExtractor(element);
    accumulator[key] = accumulator[key] || [];
    accumulator[key].push(element);
    return accumulator;
  }, Object.create(null));
  if (returnArray) {
    return convertObjectToArrayByKeys(groupedObject);
  } else {
    return groupedObject;
  }
}

/**
 * Convert an object to a array by it's keys.
 *
 * Use this method sparingly, since it is easier to use the object with keys rather
 * than the wierd objects in an array that all only have one property.
 *
 * An object like `{"key1":[...], "key2":{...}}`
 * will be converted into an array like `[ { key1: [...] }, { key2: {...} } ]`
 *
 * @param {object} object the object to create the array from
 * @returns {any[]} an array of objects.
 */
function convertObjectToArrayByKeys(object) {
  return Object.keys(object).map((key) => ({ [key]: object[key] }));
}

/**
 * Group elements of an iterable into distinct arrays based on the some mapping
 * over the elements.
 *
 * The grouping that is returned is based on extracting a key from each element,
 * and thus allows for grouping by any values, that are '===' (i.e. you can't really
 * group by objects like {foo:'a', bar:'b'}, but you can map over numbers and
 * booleans rather than strings, for instance).
 *
 * @param {Iterable<*>} iterable the iterable to group
 * @param {keyExtractor} keyExtractor a function to extract the keys for the grouping
 * @returns {Map} a map with keys mapped to arrays of grouped values
 *
 * @see groupBy
 */
function groupIterableBy(iterable, keyExtractor) {
  const result = new Map();
  for (const element of iterable) {
    const key = keyExtractor(element);
    if (result.has(key)) {
      result.get(key).push(element);
    } else {
      result.set(key, [element]);
    }
  }
  return result;
}

/**
 * Group elements of an iterable into distinct arrays based on the some mapping
 * over the elements.
 *
 * The grouping that is returned is based on extracting a key from each element,
 * and thus allows for grouping by any values. The values will be 'hashed' for use
 * dueint equality checks.
 *
 * This function is not as performant ad the general groupIterableBy function in
 * this module and should be used only when a more 'primitive' type cannot
 * be used as the grouping key.
 *
 * @param {Iterable<*>} iterable the iterable to groupBy
 * @param {keyExtractor} keyExtractor a function to extract the keys for the grouping
 * @param {keyHasher} keyHasher a function that will return a hash to user for
 *   equality comparisons.
 * @returns {Map} a map with properties mapped to arrays of grouped values
 *
 * @see groupBy
 */
function groupIterableByObject(
  iterable,
  keyExtractor,
  keyHasher = (k) => JSON.stringify(k)
) {
  const result = new Map();
  const keysMap = new Map();
  for (const element of iterable) {
    let key = keyExtractor(element);
    const keyHash = keyHasher(key);
    if (keysMap.has(keyHash)) {
      key = keysMap.get(keyHash);
    } else {
      keysMap.set(keyHash, key);
    }
    if (result.has(key)) {
      result.get(key).push(element);
    } else {
      result.set(key, [element]);
    }
  }
  return result;
}

module.exports = {
  groupBy,
  groupIterableBy,
  groupIterableByObject,
  convertObjectToArrayByKeys,
};
