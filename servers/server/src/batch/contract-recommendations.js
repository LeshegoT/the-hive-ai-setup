const router = require('express').Router();
const { withTransaction } = require('../shared/db');
const { handle_errors } = require('@the-hive/lib-core');
const {
  createContractRecommendation,
  contractHasActiveContractRecommendation,
  markContractAsUnscheduled,
  getContractById
} = require('../queries/contracts.queries');

router.post(
  '/contract-recommendations',
  handle_errors(async (req, res) => {
    const {hrRep, contractId} = req.body;
    await withTransaction(async (tx) => {
      const contract = await getContractById(contractId);
      const existingRecommendation = await contractHasActiveContractRecommendation(
        contractId
      );
      if (!existingRecommendation && contract) {
        await createContractRecommendation(tx, contractId, hrRep, contract.scheduledBy);
        res.status(201).send();
      } else if(!contract) {
        res.status(404).send(`Contract with contractId ${contractId} was not found. Verify the contractId and try again.`);
      } else {
        await markContractAsUnscheduled(tx, contractId);
        res.status(409).send(
          `Contract with contractId ${contractId} already has an active recommendation. Please verify and try again.`
        );
      }
    });
  })
);

module.exports = router;
