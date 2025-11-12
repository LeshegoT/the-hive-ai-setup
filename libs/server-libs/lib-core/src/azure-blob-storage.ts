/**
 * Module exposing helper functions for interacting with azure blob storage
 */

import { BlobServiceClient, BlockBlobClient, ContainerClient } from '@azure/storage-blob';
import os from 'os';
import { parseIfSetElseDefault } from './environment-utils';


type Folder = {
  name: string;
  nameInFolder: string;
  items?: FolderListing;
};

type Blob = {
  name: string;
  nameInFolder: string;
};

type FolderListing = {
  folders: Folder[];
  blobs: Blob[];
};

export async function uploadRaw(data: Buffer, containerName: string, blobName: string): Promise<void> {
  const blockBlobClient = getBlockBlobClient(containerName, blobName);
  await blockBlobClient.uploadData(data);
}

/**
 * Delete a blob and its snapshots (if they exist).
 *
 * @param containerName the Azure storage container name
 * @param blobName the full path/name of the blob
 *
 * @returns true if the blob exists and was deleted, false otherwise.
 */
export async function deleteBlob(containerName: string, blobName: string): Promise<boolean> {
  const blockBlobClient = getBlockBlobClient(containerName, blobName);
  const response = await blockBlobClient.deleteIfExists({
    deleteSnapshots: 'include',
  });

  return response.succeeded;
}

/**
 * List the content of a particular folder (prefix) in an azure storage container,
 * possibly recursively.
 *
 * @param containerName containerName the Azure storage container name
 * @param folderName the prefix/folder name to check
 * @param recurse flag to indicate whether sub-directories should
 *  be recursively listed (default false).
 */
export async function listFolder(containerName: string, folderName: string, recurse = false): Promise<FolderListing> {
  const containerClient = getContainerClient(containerName);

  const folders: Folder[] = [];
  const blobs: Blob[] = [];
  for await (const item of containerClient.listBlobsByHierarchy('/', { prefix: `${folderName}` })) {
    if (item.kind === 'prefix') {
      folders.push({ name: item.name, nameInFolder: item.name.replace(folderName, '') });
    } else {
      blobs.push({ name: item.name, nameInFolder: item.name.replace(folderName, '') });
    }
  }

  if (recurse) {
    const promises: Promise<void>[] = [];
    // TODO: RE - this wierd usage of forEach, custom rolled promises in an array and modifying the folder objects need to be fixed.
    folders.forEach((folder) =>
      promises.push(
        new Promise((resolve, reject) => {
          listFolder(containerName, folder.name)
            .then((items) => (folder.items = items))
            .then(() => resolve())
            .catch(reject);
        })
      )
    );

    await Promise.all(promises);
  }

  return { folders, blobs };
}

export async function downloadBlob(containerName: string, blobName: string): Promise<string> {
  const blockBlobClient = getBlockBlobClient(containerName, blobName);

  const filePath = os.tmpdir() + '/hive-users-temp.csv';
  await blockBlobClient.downloadToFile(filePath, 0);
  return filePath;
}

export async function fetchBlobData(containerName: string, blobName: string): Promise<string> {
  const blockBlobClient = getBlockBlobClient(containerName, blobName);
  const downloadBlockBlobResponse = await blockBlobClient.download(0);

  return streamToString(downloadBlockBlobResponse.readableStreamBody);
}

export function fetchBinaryBlobData(containerName: string, blobName: string): Promise<Buffer> {
  return getBlockBlobClient(containerName, blobName).downloadToBuffer();
}

function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => {
      chunks.push(data.toString());
    });

    readableStream.on('end', () => {
      resolve(chunks.join(''));
    });

    readableStream.on('error', reject);
  });
}

function getBlockBlobClient(containerName: string, blobName: string): BlockBlobClient {
  return getContainerClient(containerName).getBlockBlobClient(blobName);
}

function getContainerClient(containerName: string): ContainerClient {
  const connectionString = parseIfSetElseDefault("AZURE_STORAGE_CONNECTION_STRING", "");
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  return blobServiceClient.getContainerClient(containerName);
}
