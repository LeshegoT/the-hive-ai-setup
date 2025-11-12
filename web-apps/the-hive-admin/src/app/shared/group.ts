export type DateTotal = {
  asAtEndOf: Date;
  numberOfItems: number;
}

export type GroupAndDateTotal<T extends DateTotal> = {
  subGroups: GroupAndDateTotal<T>[];
  dateTotals: DateTotal[];
  groupKey: keyof T;
  groupName: T[keyof T];
  pathToGroup: GroupPath<T>;
}

type GroupPath<T> = Array<{groupKey: keyof T, groupName: T[keyof T]}>;


/**
 * Builds a nested grouping of records based on a specified grouping order and sorting rules.
 *
 * This is a wrapper function that prepares input and initiates the recursive grouping.
 *
 * @param items - The flat list of records to group.
 * @param groupingOrder - Ordered list of keys to group by (from outermost to innermost).
 * @param sortOrders - Optional array defining sorting rules for keys.
 * @param excludedGroupNames - Optional list of values to exclude from all grouping levels.
 * @returns An array of hierarchical groups with nested subtotals.
 */
export function buildGroupedSummary<T extends DateTotal>(
  items: T[],
  groupingOrder: (keyof T)[],
  sortOrders: KeyValueSortOrder<T>[] = [],
  excludedGroupNames: T[keyof T][] = []
): GroupAndDateTotal<T>[] {
  const filteredItems = filterOutValuesFromAllKeys(items, excludedGroupNames);
  const sortedItems = sortByMultipleKeyOrders(filteredItems, sortOrders);

  const firstGroupingCategory = groupingOrder.length > 0 ? groupingOrder[0] : undefined;
  return extractUniqueValuesForKey(firstGroupingCategory, sortedItems)
    .flatMap(category =>
      // `groupingOrder` must be cloned as this list is mutated in each recursive step.
      groupItemsByHierarchy(sortedItems, structuredClone(groupingOrder), category, [], [])
    );
}

/**
 * Recursively groups records into nested groups and calculates date-based subtotals at each level.
 *
 * @param allRecords - The full list of records to process.
 * @param groupingOrder - Remaining keys to group by. This array is mutated in-place.
 * @param groupName - The current value to group records by.
 * @param pathToGroup - Accumulator for the current group path.
 * @param groupedItems - Accumulator for recursive grouping results.
 * @returns Updated list of hierarchical groups.
 */
function groupItemsByHierarchy<T extends DateTotal>(
  allRecords: T[],
  groupingOrder: (keyof T)[],
  groupName: T[keyof T],
  pathToGroup: GroupPath<T>,
  groupedItems: GroupAndDateTotal<T>[],
): GroupAndDateTotal<T>[] {
  const currentlyGroupingBy: (keyof T) = groupingOrder.shift();

  const pathToCurrentGroup: GroupPath<T> = [...pathToGroup, { groupKey: currentlyGroupingBy, groupName: groupName }];

  const recordsForGroup = allRecords.filter(record =>
    pathToCurrentGroup.every(({groupKey, groupName}) => record[groupKey] === groupName)
  );

  const totalsForDatesInGroup = recordsForGroup.reduce(accumulateDateTotal, []);

  let uniqueValuesForNextGroupingKey;
  if (groupingOrder.length > 0) {
    uniqueValuesForNextGroupingKey = extractUniqueValuesForKey(groupingOrder[0], recordsForGroup);
  } else {
    uniqueValuesForNextGroupingKey = []
  }

  const subGroups: GroupAndDateTotal<T>[] = uniqueValuesForNextGroupingKey.flatMap(
    groupName => groupItemsByHierarchy(recordsForGroup, structuredClone(groupingOrder), groupName, pathToCurrentGroup, [])
  );

  groupedItems.push({
    subGroups: subGroups,
    dateTotals: totalsForDatesInGroup,
    groupKey: currentlyGroupingBy,
    groupName: groupName,
    pathToGroup: pathToCurrentGroup
  });

  return groupedItems;
}

function accumulateDateTotal<T extends DateTotal>(dateTotals: DateTotal[], item: T): DateTotal[] {
  const foundDateTotal = dateTotals.find(dateTotal => dateTotal.asAtEndOf.getTime() === item.asAtEndOf.getTime());

  if (foundDateTotal) {
    foundDateTotal.numberOfItems += item.numberOfItems;
  } else {
    dateTotals.push({
      asAtEndOf: item.asAtEndOf,
      numberOfItems: item.numberOfItems
    });
  }

  return dateTotals
}

function extractUniqueValuesForKey<T>(groupingKey: keyof T, flatRecords: T[]): T[keyof T][] {
  return Array.from(new Set(flatRecords.map(item => item[groupingKey])));
}

function filterOutValuesFromAllKeys<T extends object>(list: T[], valuesToExclude: T[keyof T][]): T[] {
  return list.filter(item =>
    Object.values(item).every(value => !valuesToExclude.includes(value))
  );
}

export type KeyValueSortOrder<T extends object> = {
  key: Readonly<keyof T>;
  sortOrder: ReadonlyArray<T[keyof T]>;
};

/**
 * Sorts an array of objects by multiple keys in a prioritized and hierarchical manner.
 * Each key is associated with a custom value ordering.
 *
 * @template T - The type of objects in the data array.
 *
 * @param data - The array of objects to sort.
 * @param sortOrders - An array of key/order pairs defining the sort priority and value ordering.
 *
 * @returns A new array sorted according to the specified key orderings.
 */
export function sortByMultipleKeyOrders<T extends object>(
  data: T[],
  sortOrders: KeyValueSortOrder<T>[]
): T[] {
  return structuredClone(data).sort((objectA, objectB) => {
    for (const { key, sortOrder } of sortOrders) {
      const valueA = objectA[key];
      const valueB = objectB[key];
      const indexOfA = sortOrder.indexOf(valueA);
      const indexOfB = sortOrder.indexOf(valueB);
      if (indexOfA !== indexOfB) {
        return indexOfA - indexOfB;
      } else {
        // We should only return on the first non-equal value to be able to sort hierarchically.
        continue;
      }
    }
    return 0;
  });
}

