const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { withTransaction } = require('../../shared/db');
const {
  addSite,
  updateSite,
  removeSite,
} = require('../../queries/content-tagging/site.queries');

router.post(
  '/site',
  handle_errors(async (req, res) => {
    const { name, baseURL } = req.body;
    res.json({
      siteId: await withTransaction((tx) => addSite(tx, name, baseURL)),
    });
  })
);

router.put(
  '/site/:siteId',
  handle_errors(async (req, res) => {
    const site = req.body;
    site.siteId = req.params.siteId;
    res.json({
      contentId: await withTransaction((tx) => updateSite(tx, site)),
    });
  })
);

router.delete(
  '/site/:siteId',
  handle_errors(async (req, res) => {
    res.json({
      siteId: await withTransaction((tx) => removeSite(tx, req.params.siteId)),
    });
  })
);

module.exports = router;
