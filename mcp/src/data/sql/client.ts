import * as mssql from "mssql";

import { loadConfig, type AppConfig } from "../../config/env";

const DEFAULT_POOL_MAX_CONNECTIONS = 10;
const DEFAULT_POOL_MIN_CONNECTIONS = 1;
const DEFAULT_POOL_IDLE_TIMEOUT_MS = 60_000;

type SqlConfig = AppConfig["sql"];

let connectionPool: mssql.ConnectionPool | null = null;

export type SqlQueryInputs = Record<string, unknown>;

export async function timedQuery<T = Record<string, unknown>>(
  command: string,
  name: string,
  inputs: SqlQueryInputs = {}
): Promise<mssql.IResult<T>> {
  const pool = await getConnectionPool();
  const request = pool.request();
  const config = loadConfig().sql;

  const requestWithTimeout = request as mssql.Request & { timeout?: number; requestTimeout?: number };
  requestWithTimeout.timeout = config.timeouts.requestMs;
  requestWithTimeout.requestTimeout = config.timeouts.requestMs;

  for (const [key, value] of Object.entries(inputs)) {
    request.input(key, value as never);
  }

  try {
    return await request.query<T>(command);
  } catch (error) {
    throw augmentSqlError(error, name);
  }
}

async function getConnectionPool(): Promise<mssql.ConnectionPool> {
  if (connectionPool && connectionPool.connected) {
    return connectionPool;
  }

  const config = loadConfig().sql;
  const sqlConfig = buildConnectionConfig(config);

  connectionPool = await new mssql.ConnectionPool(sqlConfig).connect();
  return connectionPool;
}

function buildConnectionConfig(config: SqlConfig): mssql.config {
  return {
    user: config.user,
    password: config.password,
    server: config.server,
    database: config.database,
    options: {
      encrypt: true,
      port: config.port,
      trustServerCertificate: config.trustServerCertificate
    },
    connectionTimeout: config.timeouts.connectionMs,
    requestTimeout: config.timeouts.requestMs,
    pool: {
      max: DEFAULT_POOL_MAX_CONNECTIONS,
      min: DEFAULT_POOL_MIN_CONNECTIONS,
      idleTimeoutMillis: DEFAULT_POOL_IDLE_TIMEOUT_MS
    }
  } satisfies mssql.config;
}

function augmentSqlError(error: unknown, queryName: string): Error {
  if (error instanceof Error) {
    error.message = `${error.message} (during query: ${queryName})`;
    return error;
  }

  return new Error(`SQL query failed for ${queryName}: ${String(error)}`);
}
