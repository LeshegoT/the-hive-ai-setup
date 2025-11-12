const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  getAllBBDUsers,
  getBBDUserStaffDetails,
} = require('../../queries/reporting.queries');
const { managers } = require('../../queries/user.queries');

router.get(
  '/allBBDUsers',
  handle_errors(async (req, res) => {
    const people = await getAllBBDUsers(req.query.active === 'true');

    res.json(people);
  })
);

router.get(
  '/staff-info/:upn',
  handle_errors(async (req, res) => {
    const person = await getBBDUserStaffDetails(req.params.upn);

    const result = {
      userPrincipleName: person.userPrincipleName,
      displayName: person.displayName,
      department: person.department,
      jobTitle: person.jobTitle,
      manager: person.manager,
      managerDisplayName: person.managerName,
      lastReview: person.lastReview,
      office: person.office,
      startDate: person.startDate,
      userName: person.userName,
      qualifications: person.qualifications.map(
        (qualification) => `${qualification.name} (${qualification.year})`
      ),
      staffStatus: person.staffStatus
    };

    res.json(result);
  })
);

router.get(
  '/managers',
  handle_errors(async (req, res) => {
    const result = await managers();
    res.json(result);
  })
);

module.exports = router;
