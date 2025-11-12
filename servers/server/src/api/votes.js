const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { withTransaction } = require('../shared/db');
const { award_bucks } = require('../queries/rewards.queries');
const {
  voting_options,
  user_votes,
  vote,
  voting_event,
  active_voting_events,
  get_vote_reward,
  get_voting_option_details
} = require('../queries/voting.queries');

router.get(
  '/votingEvent',
  handle_errors(async (req, res) => {
    const { eventId } = req.query;
    const event = await voting_event(eventId);

    res.json(event);
  })
);

router.get(
  '/votingOptions',
  handle_errors(async (req, res) => {
    const { eventId } = req.query;
    const options = await voting_options(eventId);

    res.json(options);
  })
);

router.get(
  '/activeVotingEvents',
  handle_errors(async (req, res) => {
    const activeEvents = await active_voting_events();

    res.json(activeEvents);
  })
);

router.get(
  '/userVotes',
  handle_errors(async (req, res) => {
    const { upn } = res.locals;
    const { eventId } = req.query;

    const options = await user_votes(eventId, upn);

    res.json(options);
  })
);

router.post(
  '/vote',
  handle_errors(async (req, res) => {
    const { votingOption, rating, eventId } = req.body;
    const { upn } = res.locals;

    const details = await get_voting_option_details(votingOption);
    const reward = await get_vote_reward(eventId);
    const rewarded = await withTransaction((tx) =>
      submitVote(tx, votingOption, upn, rating, reward, details)
    );

    if (rewarded) {
      return res.send({ reward });
    }
    return res.send({ reward: 0 });
  })
);

const submitVote = async (tx, votingOption, upn, rating, reward, details) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  const shouldAward = await vote(tx, votingOption, upn, rating);

  if (reward && shouldAward) {
    await award_bucks(tx, reward, upn, 'system', 1);
    return true;
  }
  return false;
};

module.exports = router;
