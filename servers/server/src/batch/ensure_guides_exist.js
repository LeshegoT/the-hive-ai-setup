const router = require('express').Router();

const { handle_errors } = require('@the-hive/lib-core');
const { insert_message_no_tx } = require('../queries/message.queries');
const { userExists } = require('../shared/active-directory-profile');
const { send } = require('../shared/email');
const { post } = require('../shared/graph-api');
const {
  all_active_guides,
  initiate_delete_guide,
  guide_quests,
  unassign_guide_from_quest,
} = require('../queries/guide.queries');
const { buildRelativeURL } = require('../shared/url');
const { withTransaction } = require('../shared/db');

module.exports = router.post(
  '/ensure-guides-exist',
  handle_errors(async (req, res) => {
    await withTransaction(async (tx) => {
      const guides = await all_active_guides(tx);
      const unprocessedGuides = [];
      for (const guide of guides) {
        try {
          const exists = await userExists(guide.userPrincipleName);
          if (!exists) {
            await initiate_delete_guide(tx, guide.userPrincipleName);
            await unassignGuideFromQuests(tx, guide.userPrincipleName);
          }
        } catch (error) {
          unprocessedGuides.push({
            Guide: `${guide.userPrincipleName}`,
            Error: error,
          });
        }
      }

      if (unprocessedGuides.length) {
        const mailContent = JSON.stringify(unprocessedGuides);
        const body = {
          message: {
            subject: 'Failed to delete the following guides',
            toRecipients: [
              {
                emailAddress: {
                  address: 'atcteam@bbd.co.za',
                },
              },
            ],
            ccRecipients: [],
            body: {
              content: mailContent,
              contentType: 'text',
            },
          },
        };
        await post('/users/the-hive@bbd.co.za/sendMail', body);
      }
    });
    res.send('Successful');
  })
);

// TODO: RE - unassign and insert message should be in the same transaction
// Trello ticket link: https://trello.com/c/hZFQm1uy
const unassignGuideFromQuests = async (tx, guideUPN) => {
  const messageTypeId = 1; //Quest message
  const createdBy = 'System';
  const messageText = `Unfortunately, your current quest guide (${guideUPN}) is not able to continue guiding you. As such, they have been un-assigned as your quest Guide. 
        If possible, get in touch with your guide about how to proceed.
        To get a new guide, please use the 'request a guide' feature on The Hive or contact ATC for further assistance. `;

  const questsGuided = await guide_quests(tx, guideUPN);

  for (const quest of questsGuided) {
    const { questId, status, heroUserPrincipleName } = quest;
    if (status !== 'completed') {
      await unassign_guide_from_quest(tx, questId);
      const url = buildRelativeURL('hive', 'guide-request');

      await send(
        'the-hive@bbd.co.za',
        heroUserPrincipleName,
        'Your guide on the hive',
        '',
        messageText,
        url,
        { callToAction: 'Choose a different guide', includeATCTeam: true }
      );

      await insert_message_no_tx(
        messageTypeId,
        heroUserPrincipleName,
        createdBy,
        messageText
      );
    }
  }
};
