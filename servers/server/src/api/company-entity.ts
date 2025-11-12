/** @format */
import { getCompanyEntities } from "../queries/company-entity.queries";
import express from "express";
import { handle_errors } from "@the-hive/lib-core";
const router = express.Router();
router.get(
  "/company-entities",
  handle_errors(async (_req, res) => {
    try {
      const companyEntities = await getCompanyEntities();
      res.status(200).json(companyEntities);
    } catch (error) {
      res.status(500).json({ message: "Internal server error", detail: error.message });
    }
  }),
);
module.exports = router;
