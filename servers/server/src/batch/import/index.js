/**
 * Express router providing batch related api routes
 * @module routers/batch
 * @requires express
 */


const express = require('express');
const { parseIfSetElseDefault, isProduction } = require('@the-hive/lib-core');
const { RestError } = require('@azure/storage-blob');
const fs = require('fs');
const fixCase = require('../../shared/fix-case');
const { parseCsv } = require('../../shared/parse-csv');
const { downloadBlobToFile } = require('../../shared/download-blob');
const { handle_errors } = require('@the-hive/lib-core');
const queue = require('../../shared/queue');
const { logger } = require('@the-hive/lib-core');


const {
  getBatchTypeLookup,
  createNewBatch,
  batchRawDataImportComplete,
  insertRecord,
  getBatchDetail
} = require('../../queries/batch/batch.queries');

const DEBUG = parseIfSetElseDefault("DEBUG", false) && !isProduction();
const CONTAINER_NAME = 'migrated-data';
const BATCH_QUEUE_NAME = 'process-batch-queue';

const router = express.Router();

async function getBatchTypeFileMapping(importFileName){
  const batchTypeLookup = await getBatchTypeLookup();

  const foundMapping = batchTypeLookup.data.find(fileMapping => fileMapping.importFileName === importFileName );
  logger.debug("Mapping %s for batch import file  %s from %s", JSON.stringify(foundMapping), importFileName, JSON.stringify(batchTypeLookup));
  return foundMapping;
}


async function queueNextBatch(batchId){ // eslint-disable-line @typescript-eslint/no-unused-vars
  const batchDetails = await getBatchDetail(batchId);
  if (batchDetails && batchDetails[0] && batchDetails[0].nextId!==null){
    await queue.enqueue(BATCH_QUEUE_NAME, batchDetails[0]);
  } else {
    logger.debug(`Received request to queue the next batch rows, but no batch-details found for batchId: '${batchId}'`);
  }
}

async function readAndParseFile(fileMapping){
  let csvFile;
  try {
    csvFile = await downloadBlobToFile(CONTAINER_NAME, fileMapping.importFileName);
    const data = fs.readFileSync(csvFile, {encoding: fileMapping.encoding});
    const {result: csvData, errors} = parseCsv(data, fileMapping.delimiter);
    return {records: fixCase(csvData), errors};
  } finally {
    try {
      if(csvFile){
        fs.rmSync(csvFile);
      } else {
        // csv file never successfylly downloaded, no need to clean up
      }
    } catch (error) {
      // we will not fail the job if we cannot clean up the file.
      logger.error('Could not clean up file, %s', error.message);
    }
  }
}

router.post(
  '/:filename',
  handle_errors(async (req, res) => {
    const filename = req.params.filename;
    logger.info("Request to import file '%s' received", filename);

    const batchTypeLookup = (await getBatchTypeFileMapping(filename));
    if (batchTypeLookup){
      try{
        const newBatchId = await createNewBatch(batchTypeLookup);
        const {records, errors} = await readAndParseFile(batchTypeLookup);
        for( const row of records ){
          await insertRecord(newBatchId, row, batchTypeLookup.batchTableName);
        }
        await batchRawDataImportComplete(newBatchId);

        res.json({ message: "initiated batch", filename, newBatchId, errors });
      } catch (error) {
        logger.error(error)
        if (error instanceof RestError){
          res.status(404).json({
            message:`File with name ${filename} not found or file could not be loaded.`,
            details: {
              errorCode: error.details.errorCode,
              date: error.details.date,
              message: error.details.message,
              code: error.details.code,
            }
          });
        } else{
          if (DEBUG) {
            res.status(500).json({ message: "something went wrong",error});
          } else {
            res.status(500).json({message: "something went wrong"});
          }
        }
      }
    } else {
      const errorDetail = { message: "bad import request", error: `${filename} is not a valid import file` };
      if (DEBUG){
        logger.info(JSON.stringify((await getBatchTypeLookup())))
        errorDetail.availableBatchTypes = [...(await getBatchTypeLookup()).lookupByIdMap];
      }
      res.json(errorDetail).status(400);
    }
  }));

module.exports = router;
