const groupItems = (items, key, groupedKey) => {
  const working = items.reduce((group, current) => {
    const item = group[current[key]] || {
      ...current,
      [`${groupedKey}s`]: [],
    };

    if (current[groupedKey]) {
      item[`${groupedKey}s`] = [...item[`${groupedKey}s`], current[groupedKey]];
    }

    group[current[key]] = item;

    return group;
  }, {});

  return Object.values(working);
};

module.exports = { groupItems };
