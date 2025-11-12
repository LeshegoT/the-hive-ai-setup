/**
 * Module expsoing standard API endpoints to allow automatic generation of simple
 * endpoiints for CRUD operations.
 *
 * @module shared/standard-api
 * @requires express
 * @see {@link module:queries/generate-queries}
 *
 */

const { withTransaction } = require('../shared/db');
const queryGenerator = require('../queries/generate.queries');
const { handle_errors } = require('@the-hive/lib-core');

/**
 * Register standard API routes to the router based on the table description
 * @see {@link module:queries/generate-queries~describeTable}
 *
 * @param {external:express.Router} router the express router to register the routes on
 * @param {string} routeName the name of the route to add
 * @param {string} tableName the table for which we are registering the routes
 *
 */
async function createStandardApiRoutes(router, routeName, tableName) {
  const tableDef = await queryGenerator.describeTable(tableName);

  router.get(
    `${routeName}`,
    handle_errors(async (req, res) => {
      const result = await queryGenerator.select(tableName, tableDef);
      res.json(result);
    })
  );

  router.get(
    `${routeName}/:id`,
    handle_errors(async (req, res) => {
      const id = parseInt(req.params.id);
      const result = await queryGenerator.selectById(tableName, tableDef, id);
      res.json(result);
    })
  );

  router.post(
    routeName,
    handle_errors(async (req, res) => {
      const newItem = req.body;
      const newId = await withTransaction((tx) =>
        queryGenerator.insert(tx, tableName, tableDef, newItem)
      );
      res.json({ newId });
    })
  );

  router.put(
    `${routeName}/:id`,
    handle_errors(async (req, res) => {
      const id = parseInt(req.params.id);
      const toUpdate = req.body;
      await withTransaction((tx) =>
        queryGenerator.update(tx, tableName, tableDef, id, toUpdate)
      );
      res.json(toUpdate);
    })
  );

  router.patch(
    `${routeName}/:id`,
    handle_errors(async (req, res) => {
      const id = parseInt(req.params.id);
      const toPatch = req.body;
      await withTransaction((tx) =>
        queryGenerator.patch(tx, tableName, tableDef, id, toPatch)
      );
      res.json(toPatch);
    })
  );
}

module.exports = {
  createStandardApiRoutes,
};
