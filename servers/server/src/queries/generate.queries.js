/**
 * Module expsoing queries to allow automatic generation of simple queries for
 * CRUD operations.
 *
 * @module queries/generate-queries
 * @see {@link module:shared/standard-api}
 */

const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');
const { cache } = require('@the-hive/lib-core');

/**
 * Retrieve a table description from the cache (or initialize from the database if not yet cached)
 *
 * See the `GetTableDetail` specialized proc
 *
 * @param {string} tableName the name of the table to describe
 * @returns {TableDescription} a table description for the table (array of table columns)
 */
const describeTable = async (tableName) =>
  cache(`Table-${tableName}-Description`,
    () => db()
            .then(connection => connection.input('TABLE_NAME', tableName).timed_query('exec GetTableDetail @TABLE_NAME', 'describe_table'))
            .then(results => results.recordset)
  );


/**
 * Modifies a TableDescription of a lookup table by adding a preferred name for each column
 *
 * This method can only be used for TableDescriptions with two columns where one column is an identity column
 *
 * @param {TableDescription} tableDescription the TableDescription to modify
 * @param {string} preferredIdColumnName the preferred name of the identity column
 * @param {string} preferredColumnName the preferred name of the non-identity column
 * @returns {TableDescription} the new table description with the preferred column names for each column
 */
const modifyColumnsForLookup = (tableDescription, preferredIdColumnName, preferredColumnName) => {
  let newTableDescription;
  if (preferredIdColumnName && preferredColumnName && tableDescription.length == 2) {
    newTableDescription = tableDescription.map(column => {
      const newColumn = {...column};
      newColumn.preferredColumnName = newColumn.colIsIdentity ? preferredIdColumnName : preferredColumnName;
      return newColumn
    })
  }
  else if (!preferredIdColumnName){
    throw new Error('No value was supplied for the preferred identity column name');
  }
  else if (!preferredColumnName){
    throw new Error('No value was supplied for the preferred column name');
  }
  else if (tableDescription.length != 2){
    throw new Error('The lookup table that is being modified must consist of exactly two columns');
  }
  return newTableDescription;
};

/**
 * Build a raw select statement for the table, querying all columns, without any
 * where clause.
 *
 * @param {string} tableName the name of the table
 * @param {TableDescription} tableDescription description of the table to query
 * @returns {string} a raw select statement for all coiumns in the table
 */
const buildSelect = (tableName, tableDescription) => {
  const columnNames = tableDescription.map(col => {
    return col.preferredColumnName ? `${col.columnName} AS ${col.preferredColumnName}`: col.columnName;
  }).join(',');
  return `SELECT \n\t${columnNames}\nFROM ${tableName}`;
};

/**
 * Build a raw select statement for the table, querying all columns, including a
 * where clause to limit the query based on the primary key (id column)
 *
 * @param {string} tableName the name of the table
 * @param {TableDescription} tableDescription description of the table to query
 * @returns {QueryByIDResult} queryDetails a raw select statement for all coiumns in the table including
 * `@table.idColumn` variable in the where clause
 *
 * @throws (Error) when the table has a compound primary key (more than one column
 * in the primary key)
 */

const buildSelectById = (tableName, tableDescription) => {
  const columnNames = tableDescription.map(col => {
    return col.preferredColumnName ? `${col.columnName} AS ${col.preferredColumnName}`: col.columnName;
  }).join(',');
  const idColumns = tableDescription.filter(col => col.colIsIdentity);
  const idColumnFragment = idColumns.map(col => `${col.columnName}=@${col.columnName}`).join(',');
  const query = `SELECT \n\t${columnNames}\nFROM ${tableName}\nWHERE\n\t${idColumnFragment}`;
  const idColumnNames = idColumns.map(col => col.columnName);
  if(idColumnNames.length!==1){
    throw new Error(`Database table ${tableName} has too many identity columns ${idColumnNames}`);
  }
  return { query, idColumnName: idColumnNames[0]}
}

const buildInsert = (tableName, tableDescription) => {
  const columnNames = tableDescription.filter(col => !col.colIsIdentity)
    .map(col => col.columnName)
    .join(',\n\t');
  const variableNames = tableDescription.filter(col => !col.colIsIdentity)
    .map(col => "@"+col.columnName)
    .join(',\n\t');
  return `INSERT INTO ${tableName} (\n\t${columnNames}\n) values (\n\t${variableNames}\n); select @@IDENTITY as newId;`
}

const buildInsertWithId = (tableName, tableDescription) => {
  const columnNames = tableDescription.map(col => col.columnName)
    .join(',\n\t');
  const variableNames = tableDescription.map(col => "@"+col.columnName)
    .join(',\n\t');
  return `INSERT INTO ${tableName} (\n\t${columnNames}\n) values (\n\t${variableNames}\n); select @@IDENTITY as newId;`
}

const buildUpdate = (tableName, tableDescription) => {
  const setForColumns = tableDescription.filter(col => !col.colIsIdentity)
    .map(col => `${col.columnName}=@${col.columnName}`)
    .join(',\n\t');
  const idColumnFragment = tableDescription.filter(col => col.colIsIdentity)
    .map(col => `${col.columnName}=@${col.columnName}`).join(',');

  return `UPDATE ${tableName} \nSET\n\t${setForColumns}\nWHERE\n\t${idColumnFragment}`;
}

const select = async (tableName, tableDescription) => {
    const query = buildSelect(tableName, tableDescription);
    const connection = await db();
    const results = await connection
      .timed_query(query, `get-${tableName}`);
    return fixCase(results.recordset);
}

const selectById = async (tableName, tableDescription, id) => {
  const {query, idColumnName} = buildSelectById(tableName, tableDescription);
  const connection = await db();
  const results = await connection
    .input(idColumnName,id)
    .timed_query(query, `getById-${tableName}`);
  return fixCase(results.recordset);
}

const insert = async (tx, tableName, tableDescription, newValue) => {
  const insertStatement = buildInsert(tableName, tableDescription);
  let connection = await tx.timed_request();
  for (const column of tableDescription.filter(col => !col.colIsIdentity)){
    connection = connection.input(column.columnName, newValue[camelize(column.columnName)]);
  }

  const results = await connection
    .query(insertStatement, `insert-${tableName}`);
  return results.recordset[0].newId;
}

const insertWithId = async (tx, tableName, tableDescription, newValue) => {
  const insertStatement = buildInsertWithId(tableName, tableDescription);
  let connection = await tx.timed_request();
  for (const column of tableDescription){
    connection = connection.input(column.columnName, newValue[camelize(column.columnName)]);
  }

  const results = await connection
    .query(insertStatement, `insert-with-id-${tableName}`);
  return results.recordset[0].newId;
}

const update = async (tx, tableName, tableDescription, id, newValue) => {
  const updateStatement = buildUpdate(tableName, tableDescription);

  let connection = await tx.timed_request();
  for (const column of tableDescription.filter(col => !col.colIsIdentity)) {
    connection = connection.input(col.columnName, newValue[camelize(column.columnName)]);
  }

  for (const column of tableDescription.filter(col => col.colIsIdentity)) {
    connection = connection.input(column.columnName, id);
  }

  const results = await connection
    .query(updateStatement, `update-${tableName}`);
  return results.recordset;
}

const patch = async (tx, tableName, tableDescription, id, newValue) => {
  const filteredDescription = tableDescription.filter(col => newValue[camelize(col.columnName)] || col.colIsIdentity);
  const patchStatement = buildUpdate(tableName, filteredDescription);

  let connection = await tx.timed_request();
  for (const column of filteredDescription.filter(col => !col.colIsIdentity)) {
    connection = connection.input(column.columnName, newValue[camelize(column.columnName)]);
  }

  for (const column of filteredDescription.filter(col => col.colIsIdentity)) {
    connection = connection.input(column.columnName, id);
  }

  const results = await connection
    .query(patchStatement, `patch-${tableName}`);
  return results.recordset;
}

function camelize(str) {
  const result = str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
    if (+match === 0) return "";
    return index == 0 ? match.toLowerCase() : match.toUpperCase();
  });
  // special case for abbreviations
  if (result.includes('uRL')) {
    return result.replace('uRL', 'url');
  } else if (result.includes('uPN')) {
    return result.replace('uPN', 'upn');
  } else {
    return result;
  }
}

module.exports = {
  camelize,
  describeTable,
  buildInsert,
  buildInsertWithId,
  buildUpdate,
  buildSelect,
  buildSelectById,
  select,
  selectById,
  insert,
  insertWithId,
  update,
  patch,
  modifyColumnsForLookup
}
