import { handle_errors } from '@the-hive/lib-core';
import express from 'express';
import {ContractsDashboardLogic, isValidationError, validateAndParseReviewsDashboardQueryParams} from "@the-hive/lib-reviews-logic";
import { getCompanyEntities } from '../../queries/company-entity.queries';
const { db } = require('../../shared/db');

const contractsDashboardLogic = new ContractsDashboardLogic(db);
const router = express.Router();

router.get(
  '/contracts/recommendations/status-summary',handle_errors(async (req, res) => {
    try {
      const filtersOrError = await validateAndParseReviewsDashboardQueryParams(req, getCompanyEntities, ['asAtEndOf', 'periodLength', 'numberOfPeriods', ...(req.query.companyEntities ? ['companyEntities'] : [])]);
      if (isValidationError(filtersOrError)) {
        res.status(400).json(filtersOrError);
      } else {
        const contractRecommendationsSummary = await contractsDashboardLogic.getContractsStatusSummary(filtersOrError);
        res.status(200).json(contractRecommendationsSummary);
      }
    } catch(error) {
      res.status(500).json({ message: error.message });
    }
  })
);

router.get(
  '/contracts/recommendations/status-unchanged',
  handle_errors(async (req, res) => {
    try {
      const filtersOrError = await validateAndParseReviewsDashboardQueryParams(req, getCompanyEntities, ['asAtEndOf', 'periodLength', 'lateness', 'status', ...(req.query.companyEntities ? ['companyEntities'] : [])]);
      if (isValidationError(filtersOrError)) {
        res.status(400).json(filtersOrError);
      } else {
        const contractRecommendationsSummary = await contractsDashboardLogic.getContractsWithUnchangedStatus(filtersOrError);
        res.status(200).json(contractRecommendationsSummary);
      }
    } catch(error) {
      res.status(500).json({ message: error.message });
    }
  })
);
router.get(
  '/contracts/recommendations/unchanged-status-summary',
  handle_errors(async (req, res) => {
    try {
      const filtersOrError = await validateAndParseReviewsDashboardQueryParams(req, getCompanyEntities, ['asAtEndOf', 'periodLength', 'lateness', 'status', ...(req.query.companyEntities ? ['companyEntities'] : [])]);
      if (isValidationError(filtersOrError)) {
        res.status(400).json(filtersOrError);
      } else {
        const contractRecommendationsSummary = await contractsDashboardLogic.getContractsWithUnchangedStatusSummary(filtersOrError);
        res.status(200).json(contractRecommendationsSummary);
      }
    } catch(error) {
      res.status(500).json({ message: error.message });
    }
  })
);

router.get('/contracts/dashboard/recommendations',
  handle_errors(async (req, res) => {
    try {
      const filtersOrError = await validateAndParseReviewsDashboardQueryParams(req, getCompanyEntities, ['asAtEndOf', ...(req.query.companyEntities ? ['companyEntities'] : [])]);
      if (isValidationError(filtersOrError)) {
        res.status(400).json(filtersOrError);
      } else {
        const contractRecommendationsSummary = await contractsDashboardLogic.getFilteredContractRecommendations(filtersOrError);
        res.status(200).json(contractRecommendationsSummary);
      }
    } catch(error) {
      res.status(500).json({ message: error.message });
    }
  })
);

module.exports = router;