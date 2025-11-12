import { BlobServiceClient } from '@azure/storage-blob';
import { cache, handle_errors } from '@the-hive/lib-core';
import type { Request, Response } from 'express';
import { Router } from 'express';

const router = Router();

router.get(
  '/icons',
  handle_errors(async (req: Request<unknown>, res: Response<unknown> ) => {
    const icons = await cache('icon-cache',retrieveIconsFromStorage);
    res.json(icons);
  })
);

async function retrieveIconsFromStorage() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient =
    blobServiceClient.getContainerClient('static-content');
  const returnList = [];
  for await (const blob of containerClient.listBlobsFlat()) {
    if (blob.name.includes('images/logos')) {
      const holder = 'static-content/' + blob.name;
      const holderName = blob.name.slice(
        blob.name.lastIndexOf('/') + 1,
        blob.name.lastIndexOf('.')
      );
      const icon = {
        name: holderName,
        path: holder,
      };
      returnList.push(icon);
    }
  }
  return returnList;
}

module.exports = router;
