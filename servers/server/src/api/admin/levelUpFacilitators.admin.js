const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  assign_facilitators,
  remove_facilitator,
} = require('../../queries/level-up-facilitator.queries');
const { getFacilitatorDetails } = require('../../shared/level-up-details');

router.get(
  '/levelUp/:id/facilitators',
  handle_errors(async (req, res) => {
    const levelUpId = req.params['id'];

    const facilitatorDetails = await getFacilitatorDetails(levelUpId);

    res.json(facilitatorDetails);
  })
);

router.post(
  '/levelUp/:levelUpId/facilitators',
  handle_errors(async (req, res) => {
    const { levelUpId } = req.params;
    const { upns } = req.body;
    await assign_facilitators(upns, levelUpId);
    res.status(204).send();
  })
);

router.delete(
  '/levelUp/:levelUpId/facilitator/:upn',
  handle_errors(async (req, res) => {
    const { upn, levelUpId } = req.params;
    await remove_facilitator(upn, levelUpId);
    res.status(204).send();
  })
);

module.exports = router;
