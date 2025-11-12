import { handle_errors } from '@the-hive/lib-core';
import { Router } from 'express';

import { all_sections } from '../queries/section.queries';

import { BlobServiceClient } from '@azure/storage-blob';
import { completed_section } from '../queries/complete-section.queries';

const router = Router();
 
const {
  get_interaction_type,
  insert_user_interaction
} = require('../queries/user-interactions.queries');
const {
  insert_user_sections,
  check_section_completed,
  delete_user_sections,
  check_section_previously_completed
} = require('../queries/section.queries');
const { scorePoints } = require('../shared/scorePoints');
const { user_sections } = require('../queries/user.queries');

const { withTransaction } = require('../shared/db');

router.get(
  '/sections',
  handle_errors(async (req, res) => {
    const sections = await all_sections();

    const filePaths = await fetchFilePaths();

    for (const section of sections) {
      section.fileExists = !!filePaths.find(name => name === section.pathToMarkdown.replace('\\', '/'));
    }

    res.json(sections);
  })
);

router.get(
  '/suggestedSections',
  handle_errors(async (req, res) => {
    const sections = await all_sections();

    const filePaths = await fetchFilePaths();

    const suggested = []

    for (const filePath of filePaths.filter(fp => fp.indexOf('/') > 0)) {
      const hasNoSection = !sections.find(section => filePath === section.pathToMarkdown.replace('\\', '/'));

      if (hasNoSection) {
        suggested.push({
          filePath: filePath,
          folderName: filePath.substring(0, filePath.indexOf('/')),
          code: filePath.substring(filePath.lastIndexOf('/') + 1).toLowerCase().replaceAll(' ', '').replace('.md', '')
        })
      }
    }

    res.json(suggested);
  })
);

router.get(
  '/userSections',
  handle_errors(async (req, res) => {
    const upn = req.query.upn;

    const userSections = await user_sections(upn);

    res.json(userSections);
  })
);

router.post(
  '/completeSection',
  handle_errors(async (req, res) => {
    const { sectionId, upn } = req.body;
    await withTransaction((tx) =>
      completeSection(tx, sectionId, upn, 'section')
    );

    const sections = await completed_section(req.body.sectionId, req.body.upn);
    res.json(sections);
  })
);

const completeSection = async (tx, sectionId, upn, typeCode) => {
  const section = await check_section_completed(tx, sectionId, upn);

  if (!section) {
    const typeID = await get_interaction_type(tx, typeCode);

    const userInteractionID = await insert_user_interaction(tx, upn, typeID);

    await insert_user_sections(tx, sectionId, upn, userInteractionID);

    if (!(await check_section_previously_completed(tx, sectionId, upn))) {
      await scorePoints(tx, upn, typeCode, userInteractionID);
    }
  }
};

router.delete(
  '/unreadSection',
  handle_errors(async (req, res) => {
    const { sectionId, upn } = req.body;
    await withTransaction((tx) =>
      unreadSection(tx, sectionId, upn)
    );

    const sections = await completed_section(req.body.sectionId, req.body.upn);
    res.json(sections);
  })
);

const unreadSection = async (tx, sectionId, upn,) => {
  await delete_user_sections(tx, sectionId, upn);
};



async function fetchFilePaths() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient('courses');
  const filePaths = [];
  for await (const blob of containerClient.listBlobsFlat()) {
    if (
       blob.name.indexOf('/') > 0 &&
       blob.name.includes('.md')
    ) {
      filePaths.push(blob.name);
    }
  }
  return filePaths;
}

module.exports = router;
