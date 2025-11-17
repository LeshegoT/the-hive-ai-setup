import { existsSync } from "node:fs";

import { config as loadDotenv } from "dotenv";
import { z } from "zod";

const DEFAULT_SQL_PORT = 1433;
const DEFAULT_DB_CONNECTION_TIMEOUT_MS = 15_000;
const DEFAULT_DB_REQUEST_TIMEOUT_MS = 30_000;

const RAW_ENV_SCHEMA = z.object({
  SQL_USER: z.string().min(1, { message: "SQL_USER is required" }),
  SQL_PASSWORD: z.string().min(1, { message: "SQL_PASSWORD is required" }),
  SQL_SERVER: z.string().min(1, { message: "SQL_SERVER is required" }),
  SQL_DATABASE: z.string().min(1, { message: "SQL_DATABASE is required" }),
  SQL_PORT: z.string().optional(),
  SQL_TRUST_SELF_SIGNED: z.string().optional(),
  DB_CONNECTION_TIMEOUT_MS: z.string().optional(),
  DB_REQUEST_TIMEOUT_MS: z.string().optional()
});

const ENV_SCHEMA = RAW_ENV_SCHEMA.transform((raw) => ({
  sql: {
    user: raw.SQL_USER,
    password: raw.SQL_PASSWORD,
    server: raw.SQL_SERVER,
    database: raw.SQL_DATABASE,
    port: parseInteger(raw.SQL_PORT, DEFAULT_SQL_PORT),
    trustServerCertificate: normalizeBoolean(raw.SQL_TRUST_SELF_SIGNED),
    timeouts: {
      connectionMs: parseInteger(raw.DB_CONNECTION_TIMEOUT_MS, DEFAULT_DB_CONNECTION_TIMEOUT_MS),
      requestMs: parseInteger(raw.DB_REQUEST_TIMEOUT_MS, DEFAULT_DB_REQUEST_TIMEOUT_MS)
    }
  }
}));

export type AppConfig = z.infer<typeof ENV_SCHEMA>;
export const REQUIRED_ENV_VARS: ReadonlyArray<keyof z.input<typeof RAW_ENV_SCHEMA>> = [
  "SQL_USER",
  "SQL_PASSWORD",
  "SQL_SERVER",
  "SQL_DATABASE"
];

let memoizedConfig: AppConfig | null = null;
let envFilesLoaded = false;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const shouldMemoize = env === process.env;

  if (shouldMemoize && memoizedConfig) {
    return memoizedConfig;
  }

  if (shouldMemoize) {
    loadEnvFiles();
  }

  const parseResult = ENV_SCHEMA.safeParse(env);
  if (!parseResult.success) {
    const flattened = parseResult.error.flatten();
    const fieldErrors = Object.values(flattened.fieldErrors).flat();
    const messages = [...flattened.formErrors, ...fieldErrors].filter(Boolean);
    throw new Error(messages.join("; "));
  }

  if (shouldMemoize) {
    memoizedConfig = parseResult.data;
  }

  return parseResult.data;
}

export function resetConfigCache(): void {
  memoizedConfig = null;
}

function loadEnvFiles(): void {
  if (envFilesLoaded) {
    return;
  }

  loadDotenv();

  const localSecretPath = "local.secret.env";
  if (existsSync(localSecretPath)) {
    loadDotenv({ path: localSecretPath, override: true });
  }

  envFilesLoaded = true;
}

function parseInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid integer value provided: ${value}`);
  }

  return parsed;
}

function normalizeBoolean(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return value.toLowerCase() === "true";
}
