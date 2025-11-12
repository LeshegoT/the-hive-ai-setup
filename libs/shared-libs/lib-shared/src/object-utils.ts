export const removeProperty = <T,K extends keyof T>(input:T, key:K): Omit<T,K> => {
  const clone = { ...input }
  delete clone[key]
  return clone;
}

export function includeInObjectWhenSet<T>(key: string, value: T): { [key: string]: T } {
  return value ? { [key]: value } : {};
}

export function includeArrayJoinedByCommaInObject<T>(name: string, elements: T[]): { [key: string]: string } {
  return elements && elements.length > 0 ? { [name]: elements.join(',') } : {};
}