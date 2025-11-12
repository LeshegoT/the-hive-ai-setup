const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { allHeroMessages } = require('../../queries/message.queries');

module.exports = router.get(
  '/allHeroMessages',
  handle_errors(async (req, res) => {
    const messages = await allHeroMessages(req.query.upn);

    res.json(messages);
  })
);
