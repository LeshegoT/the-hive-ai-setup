export function camelizeColumnName(columnName: string): string {
  let result = columnName.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
    if (+match === 0) {
      return "";
    }
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });

  if (result.includes("uRL")) {
    result = result.replace("uRL", "url");
  }
  if (result.includes("uPN")) {
    result = result.replace("uPN", "upn");
  }
  if (result.includes("bBD")) {
    result = result.replace("bBD", "bbd");
  }
  if (/^aD[A-Z]/.test(result)) {
    result = result.replace("aD", "ad");
  }

  return result;
}

export function mapRecordsetKeysToCamelCase(
  recordset: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  return recordset.map((row) =>
    Object.keys(row).reduce<Record<string, unknown>>((result, key) => {
      const newKey = camelizeColumnName(key);
      return {
        ...result,
        [newKey]: row[key as keyof typeof row]
      };
    }, {})
  );
}

export function convertToIsoString(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return undefined;
}
