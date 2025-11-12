const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { send } = require('../../shared/email');

const {
  all_guides,
  update_guide_status,
} = require('../../queries/guide.queries');
const {
  getAllNewGuideRequests,
  changeGuideRequest,
  getGuideSpecialisation,
  addGuideSpecialisation,
  updateGuideSpecialisation,
  getRequestStatusTypes,
} = require('../../queries/guide-request.queries');
const { withTransaction } = require('../../shared/db');
const { prepareGuideApplicationEmailContent } = require('../../shared/guide');

router.get(
  '/allGuides',
  handle_errors(async (req, res) => {
    const guides = await all_guides();

    res.json(guides);
  })
);

router.get(
  '/new-guide-request',
  handle_errors(async (_req, res) => {
    const allNewGuideRequests = await getAllNewGuideRequests();
    res.json(allNewGuideRequests);
  })
);

router.patch(
  '/new-guide-request/:newGuideRequestId',
  handle_errors(async (req, res) => {
    try {
      const newGuideRequestId = req.params.newGuideRequestId;
      const { upn, specialisationId, requestStatusType, requestStatusReason } =
        req.body;

      await withTransaction(async (tx) => {
        await changeGuideRequest(
          tx,
          newGuideRequestId,
          requestStatusType.toUpperCase()
        );

        if (requestStatusType.toUpperCase() === 'ACCEPTED') {
          const guideSpecialisation = await getGuideSpecialisation(
            upn,
            specialisationId
          );

          if (guideSpecialisation !== undefined) {
            await updateGuideSpecialisation(
              tx,
              upn,
              specialisationId,
              'active'
            );
          } else {
            await addGuideSpecialisation(tx, upn, specialisationId);
          }
        } else {
          //Do nothing. GuideSpecialisation is only added or updated when a NewGuideRequest is accepted
        }

        const emailData = await prepareGuideApplicationEmailContent(
          upn,
          specialisationId,
          requestStatusType.toUpperCase(),
          requestStatusReason
        );
        const { from, to, subject, context, message, url, callToAction } =
          emailData;
        await send(from, to, subject, context, message, url, { callToAction });
      });
      res.status(204).json();
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  })
);

router.get(
  '/request-status-type',
  handle_errors(async (_req, res) => {
    const guideApplicationStatuses = await getRequestStatusTypes();
    res.json(guideApplicationStatuses);
  })
);

router.patch(
  '/guide/:userPrincipleName',
  handle_errors(async (req, res) => {
    const guideUserPrincipleName = req.params.userPrincipleName;
    const { guideStatus } = req.body;

    await withTransaction(async (tx) => {
      await update_guide_status(tx, guideUserPrincipleName, guideStatus);
    });
    res.status(204).json();
  })
);

module.exports = router;
