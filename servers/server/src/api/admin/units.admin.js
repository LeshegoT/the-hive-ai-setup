const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { deleteUnit } = require('../../queries/unit.queries');
const { withTransaction } = require('../../shared/db');
const { createStandardApiRoutes } = require('../../shared/standard-api');

createStandardApiRoutes(router, '/unit', 'Unit');

router.delete(
  '/unit/:id',
  handle_errors(async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await withTransaction(async (tx) => await deleteUnit(tx, id));
      res.status(200).send();
    } catch (error) {
      res.status(500).json({ errorMessage: error.message });
    }
  })
);

module.exports = router;
