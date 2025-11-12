const { getBBDUserStaffDetails } = require('../queries/reporting.queries');
const { handle_errors } = require('@the-hive/lib-core');
const { getStaffId } = require('../queries/staff-overview.queries');
const { db } = require('../shared/db');
const { StaffLogic } = require('@the-hive/lib-staff-logic');
const router = require('express').Router();

const staffLogic = new StaffLogic(db);

router.get(
  '/userDetails',
  handle_errors(async (req, res) => {
    const person = await getBBDUserStaffDetails(res.locals.upn);

    const result = {
      upn: person.userPrincipleName,
      displayName: person.displayName,
      department: person.department,
      jobTitle: person.jobTitle,
      manager: person.manager,
      managerName: person.managerName,
      lastReview: person.lastReview,
      office: person.office,
      startDate: person.startDate,
      userName: person.userName,
      entity:person.entity,
      qualifications: [
        person.qualification1,
        person.qualification2,
        person.qualification3,
      ].filter((qualification) => qualification != null),
    };

    res.json(result);
  })
);

router.get(
  '/staff/me/id',
  handle_errors(async (req, res) => {
    const staffId = await getStaffId(res.locals.upn);
    if (!staffId) {
      res.status(404).send();
    } else {
      res.status(200).json(staffId);
    }
  })
);

router.get(
  "/staff/:staffId/displayName",
  handle_errors(async (req, res) => {
    try{
      const { staffId } = req.params;
      if(!staffId){
        res.status(400).json({ message: "StaffId is missing" });
      } else if(Number.isNaN(staffId)){
        res.status(400).json({ message: "StaffId should be a number" });
      } else{
        res.status(200).json(await staffLogic.retrieveStaffDisplayName(staffId));
      }
    } catch(error){
      res.status(500).json({ message: error.message });
    }
  })
)

module.exports = router;
