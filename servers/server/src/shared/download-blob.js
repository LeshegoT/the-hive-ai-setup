const { BlobServiceClient } = require('@azure/storage-blob');
const os = require('os');

/**
 * Fetch a blob from azure storage
 * 
 * @param {string} containerName 
 * @param {string} fileName 
 * @returns {BlobDownloadResponseParsed} the download response object, data returns in a Readable stream readableStreamBody
 */
async function downloadBlob(containerName, fileName) {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  const downloadBlockBlobResponse = await blockBlobClient.download();
  return downloadBlockBlobResponse;
}

/**
 * Fetch a blob from azure storage and save to a local temporary file
 * 
 * @param {string} containerName 
 * @param {string} fileName 
 * @returns {Promise<string>} the file path to the downloaded file
 */
async function downloadBlobToFile(containerName, fileName){
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);

  const filePath = os.tmpdir() + fileName;
  await blockBlobClient.downloadToFile(filePath, 0);
  return filePath;
}

module.exports = {downloadBlob, downloadBlobToFile};
