const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const email = require('../shared/email');
const {
  specialisation_guides,
  cancel_guide_request,
  create_guide_request,
  accept_guide_request,
  reject_guide_request,
} = require('../queries/guide.queries');
const { buildRelativeURL } = require('../shared/url');

router.get(
  '/guides',
  handle_errors(async (req, res) => {
    const guides = await specialisation_guides(
      req.query.specialisationId,
      'active'
    );
    res.json(guides);
  })
);

router.post(
  '/cancelGuideRequest',
  handle_errors(async (req, res) => {
    await cancel_guide_request(req.body.requestId);

    res.status(204).send();
  })
);

router.post(
  '/createGuideRequest',
  handle_errors(async (req, res) => {
    const request = req.body;
    await create_guide_request(request);
    const msg = `You have a new guide request: ${request.justification}`;
    const url = buildRelativeURL('hive', 'heroes');
    await email.send(
      request.heroUpn,
      request.guideUpn,
      'Guide Request',
      '',
      msg,
      url,
      { callToAction: 'View your requests in the hive' }
    );
    res.status(204).send();
  })
);

router.post(
  '/acceptGuideRequest',
  handle_errors(async (req, res) => {
    const request = req.body;
    await accept_guide_request(request);
    const msg = `Your guide request to ${request.guideUserPrincipleName} has been accepted.`;
    const url = buildRelativeURL('hive', 'guide-request');
    await email.send(
      request.guideUserPrincipleName,
      request.heroUserPrincipleName,
      'Guide Request Accepted',
      '',
      msg,
      url,
      { callToAction: 'Visit the hive' }
    );
    res.status(204).send();
  })
);

router.post(
  '/rejectGuideRequest',
  handle_errors(async (req, res) => {
    const request = req.body;
    await reject_guide_request(request.guideRequestId);
    const msg = `Your guide request to ${request.guideUserPrincipleName} has been rejected.`;
    const url = buildRelativeURL('hive', 'guide-request');
    await email.send(
      request.guideUserPrincipleName,
      request.heroUserPrincipleName,
      'Guide Request Rejected',
      '',
      msg,
      url,
      { callToAction: 'Choose a different guide' }
    );
    res.status(204).send();
  })
);

module.exports = router;
