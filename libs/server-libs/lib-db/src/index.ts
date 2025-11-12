import { parseIfSetElseDefault } from '@the-hive/lib-core';
import { TelemetryClient } from 'applicationinsights';
import { config as Config, Connection, ConnectionPool, IResult, Request, Transaction } from 'mssql';
import { Logger } from 'pino';

export interface SqlRequest extends Request {
  paramMap?: Record<string, unknown>;
  input: (name: string, value: unknown) => SqlRequest;
  origInput: (name: string, value: unknown) => SqlRequest;
  timed_query: (command: string, name: string) => Promise<IResult<object>>;
}

export interface SqlTransaction extends Transaction {
  timed_request: () => Promise<SqlRequest>;
}

export function isSqlTransaction(operation: (() => Promise<SqlRequest>)|SqlTransaction): operation is SqlTransaction {
  return (operation as SqlTransaction).timed_request !== undefined;
}

class RethrownError extends Error {
  constructor(errorMessage: string, public causedBy: Error) {
    super(errorMessage);
  }
}

type TransactionExecutable<T> = (tx: SqlTransaction) => Promise<T>;

export class Database {
  private readonly logger: Logger;
  public appInsightsClient: TelemetryClient;

  private connections = 0;

  /**
   * The configuration object for database connections
   */
  private readonly config: Config;

  constructor(newLogger: Logger, newAppInsightsClient: TelemetryClient, newTrustSelfSignedCert: boolean) {
    this.logger = newLogger;
    this.appInsightsClient = newAppInsightsClient;

    this.config = {
      user: parseIfSetElseDefault("SQL_USER", ""),
      password: parseIfSetElseDefault("SQL_PASSWORD", ""),
      server: parseIfSetElseDefault("SQL_SERVER", ""),
      database: parseIfSetElseDefault("SQL_DATABASE", ""),
      options: {
        port: parseIfSetElseDefault("SQL_PORT", 1433),
        encrypt: true,
        trustServerCertificate: newTrustSelfSignedCert,
      },
      connectionTimeout: parseInt(parseIfSetElseDefault("DB_CONNECTION_TIMEOUT", "15000")),
      requestTimeout: parseInt(parseIfSetElseDefault("DB_REQUEST_TIMEOUT", "30000")),
      pool: {
        max: 20,
        min: 1,
        idleTimeoutMillis: 60000,
      },
      beforeConnect: this.beforeConnect,
    };
  }

  private readonly beforeConnect = (conn: Connection) => {
    conn.once('connect', (err) => {
      if (err) {
        this.logger.error(err);
      } else {
        this.logger.debug('mssql connected %d', ++this.connections);
      }
    });
    conn.once('end', (err) => {
      if (err) {
        this.logger.error(err);
      } else {
        this.logger.debug('mssql disconnected %d', --this.connections);
      }
    });
  };

  /**
   * Internal variable to hold on to (cache) the existing (connected) connection pool
   */
  private _connectionPool: ConnectionPool;

  /**
   * Get the connection pool.
   *
   * Existing connection pool will be reused if they are still connected.
   */
  private readonly connectionPool = async () => {
    if (!this._connectionPool?.connected) {
      this.logger.debug('Creating connection pool');
      this._connectionPool = await new ConnectionPool(this.config).connect();
    }

    return this._connectionPool;
  }

  timed_query(request: SqlRequest) {
    return async (command: string, name: string) => {
      const start = process.hrtime();
      let response: IResult<object>;
      try {
        response = await request.query(command);
      } catch (error) {
        // This code wraps the internal errors for the tedious library
        // and allows the error stack to be properly set due to raising a new Error here.
        throw new RethrownError(`Error executing ${name}`, error);
      }
      const duration = process.hrtime(start)[0] * 1000 + process.hrtime(start)[1] / 1000000;

      let params = '(none)';

      if (request.paramMap) {
        if (Object.keys(request.paramMap).length > 0) {
          params = '{';
          for (const key of Object.keys(request.paramMap)) {
            params = params + `\n\t${key}: ${JSON.stringify(request.paramMap[key])},`;
          }
          params = params + '\n}';
        }
      } else {
        params = '{\n\tCould not find input params\n}';
      }

      // Poor formatting is deliberate.
      this.logger.debug(`Executed SQL command in ${duration} ms.
(
name: ${name || ''},
params: ${params},
rows: ${response?.recordsets[0]?.length}
command:
${command}
)`);

      this.appInsightsClient?.trackDependency({
        target: 'Database',
        name: name || command,
        data: command,
        duration: duration,
        resultCode: 0,
        success: true,
        dependencyTypeName: 'SQL',
      });

      return response;
    };
  }
  /**
   * Create a function allowing the request to track input parameters while
   * delegating to the original `input` function on the request.
   *
   */
  private readonly input = (req: SqlRequest) => {
    return (param: string, value: unknown) => {
      req.paramMap[param] = value;
      return req.origInput(param, value);
    };
  };

  /**
   * Get a new database request.
   *
   * The request is decorated with additional properties allowing tracking of query
   * time as well as parameters.
   *
   */
  public readonly db = async () => {
    const pool = await this.connectionPool();
    const request = pool.request() as SqlRequest;

    request.timed_query = this.timed_query(request);
    request.paramMap = {};
    request.origInput = request.input;
    request.input = this.input(request);

    return request;
  }

  /**
   * Get a new database transaction.
   *
   * The requests for this transaction are decorated with additional properties
   * allowing tracking of query time as well as parameters.
   */
  public readonly transaction = async () => {
    const pool = await this.connectionPool();
    const tx = pool.transaction() as SqlTransaction;

    tx.timed_request = async () => {
      const request = tx.request() as SqlRequest;
      request.timed_query = this.timed_query(request);
      request.paramMap = {};
      request.origInput = request.input;
      request.input = this.input(request);

      return request;
    };

    return tx;
  }

/**
   * Asynchronously execute code inside of a database transaction.
   *
   * This method provides a safe way to execute database operations within a transaction,
   * automatically handling transaction begin, commit, and rollback operations.
   *
   * @param executable - A function that takes a SqlTransaction and returns a Promise.
   *                    This function will be executed within the transaction context.
   *                    Any database operations should be performed using the provided transaction.
   *
   * @returns A Promise that resolves with the result of the executable function if the transaction succeeds,
   *          or rejects with the error if the transaction fails.
   *
   * @throws Will throw any error that occurs during the transaction execution or rollback.
   *
   * @example
   * ```typescript
   * let savedName = await db.withTransaction(async (tx) => {
   *   const request = await tx.timed_request();
   *   await request.query('INSERT INTO users (name) VALUES (@name)', { name: 'John' });
   *   await request.query('UPDATE user_count SET count = count + 1');
   *   return (await request.query('Select name from Users where name = @name', { name: 'John' })).recordset[0].name;
   * });
   * ```
   *
   * @important
   * - This function MUST be awaited when called, otherwise errors during database execution
   *   will not be properly propagated to API users.
   * - If an error occurs during execution, the transaction will be automatically rolled back.
   * - Any errors during rollback will be logged but the original error will still be thrown.
   */
  public readonly withTransaction = async <T>(executable: TransactionExecutable<T>): Promise<T> => {
    const tx = await this.transaction();
    try {
      await tx.begin();
      const result = await executable(tx);
      await tx.commit();
      return result;
    } catch (error) {
      try {
        await tx.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction', { rollbackError });
      }
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
