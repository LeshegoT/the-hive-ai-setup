const { BlobServiceClient } = require('@azure/storage-blob');

async function uploadFile(fileContent, fileName, containerName) {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  await blockBlobClient.upload(
    fileContent,
    fileContent.length ? fileContent.length : fileContent.size
  );
}

module.exports = { uploadFile };
