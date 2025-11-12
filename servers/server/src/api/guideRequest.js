const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  guide_requests,
  getNewGuideRequestById,
  create_guide_request,
  changeGuideRequest,
  updateGuideSpecialisation,
} = require('../queries/guide-request.queries');
const { withTransaction } = require('../shared/db');

router.post(
  '/newGuideRequest/:guideRequestId/status',
  handle_errors(async (req, res) => {
    const newGuideRequestId = req.params.guideRequestId;
    const { newStatus } = req.body;

    await withTransaction(async (tx) => {
      await changeGuideRequest(tx, newGuideRequestId, newStatus.toUpperCase());

      const newGuideRequest = await getNewGuideRequestById(newGuideRequestId);

      if (newGuideRequest !== undefined) {
        await updateGuideSpecialisation(
          tx,
          newGuideRequest.upn,
          newGuideRequest.specialisationId,
          'deleted'
        );
      } else {
        //Cannot update GuideSpecialisation because there is no NewGuideRequest
      }
    });
    res.status(204).send();
  })
);

router.post(
  '/newGuideRequest',
  handle_errors(async (req, res) => {
    const request = req.body;
    await create_guide_request(request);

    res.status(204).send();
  })
);

router.get(
  '/newGuideRequests',
  handle_errors(async (req, res) => {
    res.json(await guide_requests(req.query.upn));
  })
);

module.exports = router;
