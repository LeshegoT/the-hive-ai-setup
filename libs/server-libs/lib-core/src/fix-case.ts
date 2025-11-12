type SpecialValueToCamel<SV extends string, S extends string> = 
   S extends `${SV}${infer R}` ?
     `${Lowercase<SV>}${R}`
     : S;
type CharToCamel<C extends string, S extends string> = 
    S extends `${infer T}${C}${infer U}` ? 
        `${T}${Capitalize<CharToCamel<C,U>>}`
    :   S extends `${C}${infer U}` ? 
        `${Capitalize<CharToCamel<C,U>>}`
      : S extends `${infer U}${C}` ?
        `${Capitalize<CharToCamel<C,U>>}`
      : S;
type CamelCasedKey<T> =  Uncapitalize<
    SpecialValueToCamel<'UPN',
    SpecialValueToCamel<'BBD',
    SpecialValueToCamel<'URL',
        CharToCamel<'-',
        CharToCamel<'_',
        CharToCamel<' ',string & T>>>
    >>>
>;

type CamelCasedKeysKeys<T> = {
  [K in keyof T as CamelCasedKey<K>]: T[K];
}

const camelCaseExceptions: { [key: string]: string } = {
  'uRL': 'url',
  'uPN': 'upn',
  'bBD': 'bbd'
};

export const fixObjectPropertyCase = <T extends object>(obj: T): CamelCasedKeysKeys<T> => {
    const entries = Object.entries(obj);
    const mappedEntries = entries.map(
        ([k, v]) => [
            convertKeyToCamelCase(k),
            v
        ]
    );

    return Object.fromEntries(mappedEntries);
};

export const fixCase = <T extends object>(values: T[]): CamelCasedKeysKeys<T>[] => {
    return values.map(fixObjectPropertyCase);
}

/** 
 * Converts a given key string to a camelized version.
 * - Splits the input key using a regular expression: /\s+|_+|-+/
 *    - Regex matches one or more spaces (\s+), underscores (_+), or hyphens (-+).
 *    - Words separated by these are split into individual components.
 * - Filters out empty strings
 * - Maps over the array of words:
 *    - First word is transformed to have its first character in lowercase.
 *    - Subsequent words are transformed to have their first character in uppercase.
 * - Joins transformed words back into a single string.
 * - Checks for specific abbreviations
 * 
 * @param {string} string - The string to be converted to camel case.
 * @returns {CamelCasedKey<typeof key>}
 */
function convertKeyToCamelCase(key: string) : CamelCasedKey<typeof key> {
  let result = key
    .split(/\s+|_+|-+/)
    .filter((word) => word.length > 0)
    .map((word, index) =>
      index === 0
        ? `${word.substr(0, 1).toLowerCase()}${word.substr(1)}`
        : `${word.substr(0, 1).toUpperCase()}${word.substr(1)}`
    )
    .join('');

  for (const [key, value] of Object.entries(camelCaseExceptions)) {
    result = result.replace(key, value);
  }
  return result as CamelCasedKey<typeof key>;
}