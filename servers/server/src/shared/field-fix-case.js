function listToCamelCase(words) {
  return words.map((word) => toCamelCase(word));
}

function toCamelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function formatKeysToCamelCase(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  } else if (Array.isArray(obj)) {
    return obj.map(formatKeysToCamelCase);
  } else {
    return Object.entries(obj).reduce((newObj, [key, value]) => {
      newObj[toCamelCase(key)] = formatKeysToCamelCase(value);
      return newObj;
    }, {});
  }
}

module.exports = {
  formatKeysToCamelCase,
  listToCamelCase,
  toCamelCase,
};
