import { isNativeError } from "node:util/types";

export interface NormalizedError {
  name: string;
  message: string;
  stack?: string;
  cause?: NormalizedError;
  context?: Record<string, unknown>;
}

export interface NormalizeErrorOptions {
  includeStack?: boolean;
}

export function normalizeError(error: unknown, options: NormalizeErrorOptions = {}): NormalizedError {
  if (isNativeError(error)) {
    return normalizeNativeError(error, options);
  }

  if (typeof error === "string") {
    return { name: "Error", message: error };
  }

  if (typeof error === "object" && error) {
    const record = error as Record<string, unknown>;
    const message = typeof record.message === "string" ? record.message : JSON.stringify(record);
    const name = typeof record.name === "string" ? record.name : "Error";

    return {
      name,
      message,
      context: stripKeys(record, ["message", "name", "stack", "cause"])
    };
  }

  return { name: "Error", message: String(error) };
}

function normalizeNativeError(error: Error, options: NormalizeErrorOptions): NormalizedError {
  const { includeStack = false } = options;

  const contextSource = { ...(error as unknown as Record<string, unknown>) };

  const result: NormalizedError = {
    name: error.name,
    message: error.message,
    context: stripKeys(contextSource, ["message", "name", "stack", "cause"])
  };

  if (includeStack && error.stack) {
    result.stack = error.stack;
  }

  const cause = (error as { cause?: unknown }).cause;
  if (cause) {
    result.cause = normalizeError(cause, options);
  }

  return result;
}

function stripKeys(record: Record<string, unknown>, keys: ReadonlyArray<string>): Record<string, unknown> | undefined {
  const entries = Object.entries(record).filter(([key]) => !keys.includes(key));
  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
}
