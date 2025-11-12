const { withTransaction, db } = require('../../shared/db');
const fixCase = require('../../shared/fix-case');
const { cache, Lookup, logger } = require('@the-hive/lib-core');
const { describeTable , select, insert, patch, insertWithId,camelize} = require('../generate.queries');

const IMPORT_STATUS_TABLE_NAME = "ImportStatus";
const IMPORT_BATCH_TYPE_TABLE_NAME = "ImportBatchType";
const IMPORT_BATCH_TABLE_NAME = "ImportBatch";
const IMPORT_BATACH_ROW_TABLE_NAME = "ImportBatchRow";

async function getBatchTypeLookup(){
  return cache('batch-type-lookup', async () => {
    const batchTypes = await select(IMPORT_BATCH_TYPE_TABLE_NAME, await describeTable(IMPORT_BATCH_TYPE_TABLE_NAME));
    return new Lookup(IMPORT_STATUS_TABLE_NAME, batchTypes, 'importBatchTypeId', 'typeDescription');
  });
}

async function getBatchStatusLookup(){
  return cache('batch-status-lookup', async () => {
    const importStatusValues = await select(IMPORT_STATUS_TABLE_NAME, await describeTable(IMPORT_STATUS_TABLE_NAME));
    return new Lookup(IMPORT_STATUS_TABLE_NAME, importStatusValues.filter(status => status.isBatchLevel), 'importStatusId', 'statusDescription'); 
  });
}

async function getBatchRowStatusLookup(){
  return cache('batch-row-status-lookup', async () => {
    const importStatusValues = await select(IMPORT_STATUS_TABLE_NAME, await describeTable(IMPORT_STATUS_TABLE_NAME));
    return new Lookup(IMPORT_STATUS_TABLE_NAME, importStatusValues.filter(status => !(status.isBatchLevel)), 'importStatusId', 'statusDescription');
  });
}

/**
 * Find the batch status based on a status description
 * @param {string} statusDescription 
 * @returns  the batch status object that matched the description
 * @throws an error when a batch status with the specified status description could not be found.
 */
async function findBatchStatus(statusDescription){
  const detailLookup = await getBatchStatusLookup();
  const batchStatus = detailLookup.getByDescription(statusDescription);
  if (!batchStatus) {
    throw new Error(`Status ID with description '${statusDescription}' for batches could not be retrieved`);
  }
  return batchStatus;
}

/**
 * Find the batch row status based on a status description
 * @param {string} statusDescription 
 * @returns the batch row status object that matched the description
 * @throws an error when a batch row status with the specified status could not be found.
 */
async function findBatchRowStatus(statusDescription) {
  const detailLookup = await getBatchRowStatusLookup();
  const newBatchStatus = detailLookup.getByDescription(statusDescription);
  if (!newBatchStatus) {
    throw new Error(`Status ID with description '${statusDescription}' for batch rows could not be found`);
  }
  return newBatchStatus;
}

/**
 * Find the batch row status based on a status description
 * @param {string} statusDescription 
 * @returns the batch row status object that matched the description
 * @throws an error when a batch row status with the specified status could not be found.
 */
async function findBatchDetailForBatchTypeId(batchTypeId) {
  const batchTypeLookup = (await getBatchTypeLookup());
  return batchTypeLookup.getById(batchTypeId);
}

async function getBatchDetail(batchId, {tx}){
  const query = `
    SELECT ImportBatchId,
      ImportBatchTypeId,
      NextId
    FROM BatchSummary
      where ImportBatchId=@BATCH_ID`;
    const connection = await (tx ? tx.timed_request() : db());
    const results = await connection.input('BATCH_ID', batchId).timed_query(query, 'batch-detail');
    return fixCase(results.recordset);
}

async function insertRecord(batchId, row, tableName){
  const pendingStatus = (await findBatchRowStatus('row-pending-import'));
  const specificBatchTable = await describeTable(tableName);
  const batchRowTable = await describeTable(IMPORT_BATACH_ROW_TABLE_NAME);

  return withTransaction(async (tx) => {
    const newId = await insert(tx, IMPORT_BATACH_ROW_TABLE_NAME, batchRowTable, {
      importBatchId: batchId,
      originalLineNumber: row.originalLineNumber,
      loadedAt: new Date(),
      importStatusId: pendingStatus.importStatusId
    });
    const pkColum = camelize(`${tableName}Id`)
    row[pkColum]=newId;
    logger.debug("Inserted row", newId, row);
    await insertWithId(tx, tableName, specificBatchTable, row);
  });
}

async function createNewBatch(batchType) {
  const newBatchStatus = await findBatchStatus('batch-new');

  const sqlInsert = `insert into ImportBatch 
                          (ImportBatchTypeId, ImportStatusId) 
                       values
                          (@TYPE, @STATUS);
                      select @@IDENTITY as newId;` ;
  const request = await db();
  const results = await request
    .input('TYPE', batchType.importBatchTypeId)
    .input('STATUS', newBatchStatus.importStatusId)
    .timed_query(sqlInsert, 'insert_batch_import');
  return results.recordset[0].newId;
}


async function updateBatchStatus(batchId, statusDescription){
  const batchStatus = await findBatchStatus(statusDescription);

  return withTransaction(async tx => patch(tx,
    IMPORT_BATCH_TABLE_NAME,
    await describeTable(IMPORT_BATCH_TABLE_NAME), batchId, { importStatusId: batchStatus.importStatusId }));
}

async function batchRawDataImportComplete(batchId) {
  return updateBatchStatus(batchId, 'batch-read-from-file');
}

async function batchStarted(batchId) {
  return updateBatchStatus(batchId, 'batch-processing-started');
}

async function batchCompleted(batchId) {
  return updateBatchStatus(batchId, 'batch-processing-completed');
}

async function batchAborted(batchId) {
  return updateBatchStatus(batchId, 'batch-processing-aborted');
}

async function getBatchDetailFull(batchId, {tx}) {
  const query = `
    SELECT ImportBatchId, 
      ImportBatchTypeId,
      TypeDescription, 
      ImportStatusId, 
      StatusDescription, 
      LoadedAt, 
      nextId, 
      pendingRecordCount, 
      inProgressRecordCount, 
      successRecordCount, 
      failedRecordCount
    FROM BatchSummary
      where ImportBatchId=@BATCH_ID`;
  const connection = await (tx ? tx.timed_request() : db());
  const results = await connection.input('BATCH_ID', batchId).timed_query(query, 'batch-detail-full');
  return fixCase(results.recordset);
}

module.exports = {
  findBatchDetailForBatchTypeId,
  findBatchStatus,
  findBatchRowStatus,
  getBatchTypeLookup,
  getBatchStatusLookup,
  getBatchRowStatusLookup,
  createNewBatch,
  batchRawDataImportComplete,
  batchStarted,
  batchCompleted,
  batchAborted,
  insertRecord,
  getBatchDetail,
  getBatchDetailFull,
};