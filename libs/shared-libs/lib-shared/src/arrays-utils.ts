export function checkIfArraysEqual<T>(comparator: (item1: T, item2: T) => boolean, array1?: T[], array2?: T[]): boolean {
  if (!array1 && !array2) {
    return true;
  } else if (!array1 || !array2) {
    return false;
  } else if (array1.length !== array2.length) {
    return false;
  } else {
    return array1.every(item1 => array2.some(item2 => comparator(item1, item2)));
  }
}
