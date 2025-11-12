let sql = require('mssql');
let { logger } = require('../core/logger');

let trustSelfSignedCert = false;

if (process.env.NODE_ENV === 'local') {
  trustSelfSignedCert = true;
}

let connections = 0;

let beforeConnect = (conn) => {
  conn.once('connect', (err) => {
    err ? logger.error(err) : logger.debug('mssql connected %d', ++connections);
  });
  conn.once('end', (err) => {
    err ? logger.error(err) : logger.debug('mssql disconnected %d', --connections);
  });
};

let config = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: trustSelfSignedCert,
  },
  connectionTimeout: 15000,
  requestTimeout: 15000,
  pool: {
    max: 20,
    min: 1,
    idleTimeoutMillis: 60000,
  },
  beforeConnect,
};

let _connectionPool;

let connectionPool = async () => {
  if (!_connectionPool || !_connectionPool.connected) {
    logger.debug('Creating connection pool');
    _connectionPool = await new sql.ConnectionPool(config).connect();
  }

  return _connectionPool;
};

let timed_query = (request) => async (command, name) => {
  let start = process.hrtime();

  let response = await request.query(command);

  let duration = process.hrtime(start);

  let params = '(none)';

  if (request._paramMap) {
    if (Object.keys(request._paramMap).length > 0) {
      params = '{';
      for (key of Object.keys(request._paramMap)) {
        params = params + `\n\t${key}: ${request._paramMap[key]},`;
      }
      params = params + '\n}';
    }
  } else {
    params = '{\n\tCould not find input params\n}';
  }

  // Poor formatting is deliberate.
  logger.debug(`Executed SQL command in ${duration} ms.
                (
                name: ${name || ''},
                params: ${params},
                rows: ${response?.recordsets[0]?.length}
                command:
                ${command}
                )`);


  return response;
};

let input = (req) => {
  return (param, value) => {
    req._paramMap[param] = value;
    return req._origInput(param, value);
  };
};

let db = async () => {
  let pool = await connectionPool();

  let request = await pool.request();

  request.timed_query = timed_query(request);
  request._paramMap = {};
  request._origInput = request.input;
  request.input = input(request);

  return request;
};

let transaction = async () => {
  let pool = await connectionPool();
  let tx = await pool.transaction();

  tx.timed_request = async () => {
    let request = await tx.request();
    request.timed_query = timed_query(request);
    request._paramMap = {};
    request._origInput = request.input;
    request.input = input(request);

    return request;
  };

  return tx;
};

let withTransaction = async (executable) => {
  if (executable == undefined) {
    throw new Error('Code required to execute in a transaction');
  } else {
    let tx = await transaction();
    try {
      await tx.begin();
      let result = await executable(tx);
      await tx.commit();
      return result;
    } catch (error) {
      await tx.rollback();
      return Promise.reject(error);
    }
  }
};

module.exports = {
  db,
  transaction,
  withTransaction,
};
