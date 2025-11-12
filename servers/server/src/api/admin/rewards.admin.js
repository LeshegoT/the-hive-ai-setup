const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  award_bucks,
  insert_reward_reason,
} = require('../../queries/rewards.queries');
const { withTransaction } = require('../../shared/db');

router.post(
  '/awardBucks',
  handle_errors(async (req, res) => {
    const { upn, amount, awardedBy, reasonId } = req.body;
    await withTransaction((tx) =>
      award_bucks(tx, amount, upn, awardedBy, reasonId)
    );
    res.status(200).send();
  })
);

router.post(
  '/awardBucksNewReason',
  handle_errors(async (req, res) => {
    const { upn, amount, awardedBy, newReason } = req.body;
    await withTransaction((tx) =>
      awardBucksWithNewReason(tx, upn, amount, awardedBy, newReason)
    );
    res.status(200).send();
  })
);

const awardBucksWithNewReason = async (
  tx,
  upn,
  amount,
  awardedBy,
  newReason
) => {
  const reasonId = await insert_reward_reason(tx, newReason);
  await award_bucks(tx, amount, upn, awardedBy, reasonId);
};

module.exports = router;
