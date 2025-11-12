function camelize(str) {
  let result = str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
    if (+match === 0) return '';
    return index == 0 ? match.toLowerCase() : match.toUpperCase();
  });
  // special case for abbreviations
  if (result.includes('uRL')) {
    result = result.replace('uRL', 'url');
  }
  if (result.includes('uPN')) {
    result = result.replace('uPN', 'upn');
  }
  if (result.includes('bBD')) {
    result = result.replace('bBD', 'bbd');
  }
  if (/^aD[A-Z]/.test(result)) {
    result = result.replace('aD', 'ad');
  }
  return result;
}

module.exports = (recordset) => {
  return recordset.map((row) =>
    Object.keys(row).reduce((result, key) => {
      const newKey = camelize(key);

      return {
        ...result,
        [newKey]: row[key],
      };
    }, {})
  );
};
