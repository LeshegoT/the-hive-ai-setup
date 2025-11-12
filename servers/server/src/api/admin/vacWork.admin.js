const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { all_applications } = require('../../queries/vac-work.queries');
const { 
  BlobServiceClient, 
  BlobSASPermissions, 
  generateBlobSASQueryParameters 
} = require('@azure/storage-blob');
const CONTAINER_NAME = 'vac-work-applications';
router.get(
  '/vacWorkApplications',
  handle_errors(async (req, res) => {
    const applications = await all_applications();
    res.json(applications);
  })
);

router.get(
  '/vacWorkAttachment/:id',
  handle_errors(async (req, res) => {
    const id = req.params.id;
    if (!id) {
      res.status(400).send('Attachment id is required');
      return;
    }
    const url = getFileWithSAS(CONTAINER_NAME, id);
    res.send({ url });
  })
);

const getFileWithSAS = (containerName, bn) => {
  const blobName = `${process.env.NODE_ENV}/${bn}`;
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (!connectionString) {
    throw new Error('Azure storage connection string not set');
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(blobName);

  // Create a SAS token that expires in an hour
  // Set start time to five minutes ago to avoid clock skew.
  const startDate = new Date();
  startDate.setMinutes(startDate.getMinutes() - 5);
  const expiryDate = new Date(startDate);
  expiryDate.setMinutes(startDate.getMinutes() + 7); //make Download available for next two min only

  const sasToken = generateBlobSASQueryParameters(
   {
      containerName,
      blobName: blobName,
      permissions: BlobSASPermissions.parse('r'),
      startsOn: startDate,
      expiresOn: expiryDate,
    },
    blobServiceClient.credential
  ).toString();
   const fileUrl = `${blobClient.url}?${sasToken}`
  return fileUrl;
};

module.exports = router;
