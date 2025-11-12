const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { get_reward_reasons, award_bucks } = require('../queries/rewards.queries');
const {
  get_easter_egg_record,
  get_code_claims,
  claim_easter_egg_code,
} = require('../queries/rewards.queries');
const { withTransaction } = require('../shared/db');
const { get_spend_balance } = require('../queries/store.queries');

router.get(
  '/reasons',
  handle_errors(async (req, res) => {
    const result = await get_reward_reasons();
    res.send(result);
  })
);

router.post(
  '/claimCode',
  handle_errors(async (req, res) => {
    const { guid, isEasterEggClaim } = req.body;
    const { upn } = res.locals;
    const code = await get_easter_egg_record(guid);
    if (!code)
      return res.status(401).json({
        message: `Invalid Token.`,
      });
    const claims = await get_code_claims(code.codeId);
    const codeValidity = checkCodeValidity(code, claims, upn, !!isEasterEggClaim);

    if (codeValidity.valid) {
      await withTransaction((tx) =>
        claimCode(tx, code.codeId, upn, code.bucksValue)
      );
      return res.status(200).json({
        awarded: code.bucksValue,
      });
    }

    return res.status(401).json({
      message: codeValidity.message,
    });
  })
);

const checkCodeValidity = (code, claims, upn, claimedAsEgg) => {
  const now = new Date();
  let message = null;
  if (claimedAsEgg) {
    if (now > code.expiry) {
      message = 'Code has expired';
    } else if (code.issuedTo !== upn) {
      message = 'Code has been issued to another user';
    }
  } else if (!code.canClaimManually) {
    message = 'Code cannot be claimed manually';
  }
  //common checks
  else if (now < code.activeStartDate || now > code.activeEndDate) {
    message = 'Code is not active';
  } else if (claims.filter((c) => areSameUPNs(c.claimedBy, upn)).length >= 1) {
    message = 'You have already claimed this token.';
  } else if (code.claimLimit <= claims.length) {
    message =
      'Too slow! Someone beat you to it. This token has already been claimed.';
  }

  return {
    valid: !message,
    message,
  };
};

const claimCode = async (tx, codeId, upn, amount) => {
  await claim_easter_egg_code(tx, codeId, upn);
  if (amount < 0) {
    const userBalance = await get_spend_balance(upn);
    if (userBalance.balance + amount < 0) {
      return;
    }
  }

  await award_bucks(tx, amount, upn, 'system', 4);
};

const areSameUPNs = (upn1, upn2) => upn1.toLowerCase() === upn2.toLowerCase();

module.exports = router;
