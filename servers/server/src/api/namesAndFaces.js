const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  getFilteredBBDUsers,
  getAllOffices,
} = require('../queries/names-and-faces.queries');
const {
  getActiveDirectoryGroupMembers,
} = require('../shared/active-directory-profile');
const queryGenerator = require('../queries/generate.queries');

router.get(
  '/names-and-faces',
  handle_errors(async (req, res) => {
    try {
      const allowedProperties = new Set([
        'searchString',
        'unit',
        'group',
        'office',
        'employmentDate',
        'page',
        'size',
      ]);
      const requestedProperties = new Set(Object.getOwnPropertyNames(req.query));
      const invalidProperties = Array.from(requestedProperties).filter(
        (property) => !allowedProperties.has(property)
      );

      if (invalidProperties.length > 0) {
        res
          .status(400)
          .json({
            message: `Request has invalid Property: ${invalidProperties}`,
          });
      } else {
        const { page = 1, size = 10, employmentDate, group } = req.query;

        let employmentFrom, employmentTo;
        if (employmentDate) {
          ({ employmentFrom, employmentTo } = JSON.parse(employmentDate));
        }

        let groupMembersUpn;
        if (group) {
          try {
            const groupMembers = await getActiveDirectoryGroupMembers(group);
            groupMembersUpn = groupMembers.map(
              (groupMember) => groupMember.userPrincipalName
            );
          } catch (error) {
            throw new Error(`${group} is not valid group`,{cause: error});
          }
        }

        const filter = {
          searchString: req.query.searchString,
          unit: req.query.unit,
          office: req.query.office,
          employmentFrom,
          employmentTo,
          groupMembersUpn,
        };

        const bbdUsers = await getFilteredBBDUsers(page, size, filter);
        const overallUserCount = bbdUsers[0].overallCount;
        const response = {
          pageInfo: {
            page: parseInt(page),
            pageSize: parseInt(size),
            resultSetSize: overallUserCount,
            totalPages: Math.ceil(overallUserCount / size),
          },
          data: bbdUsers,
        };
        res.status(200).send(response);
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  })
);

router.get(
  '/units',
  handle_errors(async (req, res) => {
    try {
      const tableDef = await queryGenerator.describeTable('Unit');
      const result = await queryGenerator.select('Unit', tableDef);
      const units = Array.from(result, (response) => ({
        unit: response.unitName,
        description: response.description,
      }));
      res.status(200).send({ units });
    } catch (error) {
      res.status(500).send(error.message);
    }
  })
);

router.get(
  '/offices',
  handle_errors(async (req, res) => {
    try {
      const response = await getAllOffices();
      const offices = Array.from(response, (response) => response.office);
      res.status(200).json({ offices });
    } catch (error) {
      res.status(500).send(error.message);
    }
  })
);

module.exports = router;
