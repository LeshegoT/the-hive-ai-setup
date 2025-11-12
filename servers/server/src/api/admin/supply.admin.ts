import { SqlTransaction } from "@the-hive/lib-db";
import { handle_errors } from "@the-hive/lib-core";
import { isError } from "@the-hive/lib-shared";
import { UsersLogic } from "@the-hive/lib-skills-logic";
import { OnSupplyRole, StaffOnSupply } from "@the-hive/lib-skills-shared";
import { withTransaction } from "../../shared/db";
import { client } from "../../shared/skills-db-connection";
const router = require("express").Router();
const { db } = require("../../shared/db");
const userLogic = new UsersLogic(db, client);

router.get(
  "/supply/staff-on-supply-summary",
  handle_errors(async (req, res) => {
    try {
      const staffOnSupplySummary = await userLogic.getStaffOnSupplySummary();
      res.status(200).json(staffOnSupplySummary);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.post(
  "/supply/staff-on-supply",
  handle_errors(async (req, res) => {
    try {
      const upn = req.body.upn;
      const onSupplyAsOf = req.body.onSupplyAsOf;
      const staffOnSupplyResponse = await userLogic.addStaffToSupply(upn, res.locals.upn, onSupplyAsOf);
      if (isError(staffOnSupplyResponse)) {
        res.status(400).json(staffOnSupplyResponse);
      } else {
        res.status(200).json(staffOnSupplyResponse);
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.patch(
  "/supply/staff-on-supply/:upn",
  handle_errors(async (req, res) => {
    try {
      const upn = req.params.upn;
      const staffMember: StaffOnSupply = req.body;
      const staffOnSupplyResponse = await userLogic.updateStaffOnSupply(upn, staffMember.onSupplyAsOf);
      if (isError(staffOnSupplyResponse)) {
        res.status(400).json(staffOnSupplyResponse);
      } else {
        res.status(200).send();
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.get(
  "/supply/staff-on-supply",
  handle_errors(async (req, res) => {
    try {
      const staffSummary = await userLogic.getStaffOnSupply();
      res.status(200).json(staffSummary);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.get(
  "/supply/staff-on-supply/:upn",
  handle_errors(async (req, res) => {
    try {
      const upn = req.params.upn;
      const staffOnSupply = await userLogic.retrieveStaffOnSupplyByUpn(upn);
      res.status(200).json(staffOnSupply || {});
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.delete(
  "/supply/staff-on-supply/:upn",
  handle_errors(async (req, res) => {
    const upn = req.params.upn;
    try {
      await withTransaction(async (tx: SqlTransaction) => {
        await userLogic.removeStaffFromSupply(tx, upn, res.locals.upn);
        res.status(200).send();
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.get(
  "/supply/on-supply-roles",
  handle_errors(async (req, res) => {
    try {
      const onSupplyRoles = await userLogic.retrieveOnSupplyRoles();
      res.status(200).json(onSupplyRoles);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.post(
  "/supply/staff-on-supply-role/:upn",
  handle_errors(async (req, res) => {
    try {
      const staffOnSupplyRole: OnSupplyRole = req.body;
      const staffUpn = req.params.upn;
      const addedBy = res.locals.upn;
      const updateStaffOnSupplyRoleResponse = await userLogic.updateStaffOnSupplyRole(staffUpn, staffOnSupplyRole, addedBy);
      if (isError(updateStaffOnSupplyRoleResponse)) {
        res.status(400).json(updateStaffOnSupplyRoleResponse);
      } else {
        if (updateStaffOnSupplyRoleResponse) {
          res.status(201).send();
        } else {
          res.status(400).json({
            message: "Failed to update staff on supply role"
          })
        }
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

module.exports = router;
