const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const format = require('../../shared/format');
const {
  all_levelups,
  level_up_users_count,
  single_levelup,
  activities_for_level_up,
  level_up_users,
  level_up_courses,
  level_up_activity,
  add_attendees,
  consolidated_level_up_activity_attendance,
} = require('../../queries/level-up.queries');
const {
  SyndicateFormationDetails,
  GetSubmittedIdeas,
} = require('../../queries/syndicates.queries');
const {
  getAttendeeDetails,
  getFacilitatorDetails,
} = require('../../shared/level-up-details');
const {
  levelUpFacilitators,
} = require('../../queries/level-up-facilitator.queries');
const { generateCsv } = require('../../shared/generate-csv');

router.get(
  '/allLevelUps',
  handle_errors(async (req, res) => {
    const levelUps = await all_levelups();
    const users = await level_up_users_count();

    const combinedData = levelUps.map((levelUp) => {
      const userLevelUp = users.find((u) => u.levelUpId === levelUp.levelUpId);
      const userCount = userLevelUp ? userLevelUp.userCount : 0;

      return {
        ...levelUp,
        userCount,
      };
    });

    res.json(combinedData);
  })
);

router.get(
  '/levelUp/:id',
  handle_errors(async (req, res) => {
    const { id } = req.params;

    const levelUp = await single_levelup(id);
    const activities = await activities_for_level_up(id);
    const users = await level_up_users(id);
    const courses = await level_up_courses(id);
    const facilitators = await levelUpFacilitators(id);
    const formation = (await SyndicateFormationDetails(id)) || {};
    const ideas = await GetSubmittedIdeas(
      formation.syndicateFormationId,
      res.locals.upn
    );

    res.json({
      levelUp,
      activities,
      users,
      courses,
      facilitators,
      formation: { ...formation, ideas },
    });
  })
);

router.get(
  '/levelUpActivity/:activityId',
  handle_errors(async (req, res) => {
    const { activityId } = req.params;

    const levelUpActivity = await level_up_activity(activityId);

    res.json(levelUpActivity);
  })
);

router.get(
  '/levelUpActivityAttendees/:activityId',
  handle_errors(async (req, res) => {
    const { activityId } = req.params;

    const attendeeDetails = await getAttendeeDetails(activityId);

    res.json(attendeeDetails);
  })
);

router.get(
  '/levelUpActivityAttendeesSheet/:activityId',
  handle_errors(async (req, res) => {
    const { activityId } = req.params;

    const activityDetails = await level_up_activity(activityId);
    const attendeeDetails = await getAttendeeDetails(activityId);
    const facilitatorDetails = await getFacilitatorDetails(
      activityDetails.levelUpId
    );

    const headers = [
      'BBD Email',
      'BBD User Name',
      'Display Name',
      'Job Title',
      'Office',
      'Department',
    ];

    const data = [];
    for (const attendee of attendeeDetails) {
      data.push([
        attendee.userPrincipleName,
        attendee.bbdUserName,
        attendee.displayName,
        attendee.jobTitle,
        attendee.office,
        attendee.department,
      ]);
    }
    const title = `${activityDetails.levelUpName.split(' ').join('-')}-${
      activityDetails.activityName
    }`;
    const date = format
      .formatDateOnly(activityDetails.activityDate)
      .split('/')
      .join('-');
    const time = format
      .formatTime(activityDetails.activityDate)
      .replace(':', 'h');

    const facilitatorNames = facilitatorDetails.map((f) =>
      f.displayName ? ` ${f.displayName}` : ` ${f.userPrincipleName}`
    );

    const info = [
      title,
      'Activity Date: ' + date,
      'Start Time: ' + time,
      'Duration (Minutes): ' + activityDetails.durationInMinutes,
      'Facilitator(s): ' + facilitatorNames,
    ];
    const fileName = `${title}-${date}-${time}.csv`;
    const csv = generateCsv(headers, data, info);

    const response = { csv: csv, fileName: fileName };

    res.json(response);
  })
);

router.get(
  '/levelUpConsolidatedAttendance/:levelUpId',
  handle_errors(async (req, res) => {
    const { levelUpId } = req.params;

    const users = await level_up_users(levelUpId);
    const levelUpDetails = await single_levelup(levelUpId);
    const activities = await activities_for_level_up(levelUpId);
    const attendeeDetails = await consolidated_level_up_activity_attendance(
      levelUpId
    );
    const facilitatorDetails = await levelUpFacilitators(levelUpId);

    const getFormattedDate = (dateToFormat) =>
      format.formatDateOnly(dateToFormat).split('/').join('-');

    const startDate = getFormattedDate(levelUpDetails.startDate);
    const title = `${levelUpDetails.name.split(' ').join('-')}-${startDate}`;
    const facilitatorNames = facilitatorDetails.map((f) =>
      f.displayName ? ` ${f.displayName}` : ` ${f.userPrincipleName}`
    );

    const headers = [
      'BBD Email',
      'BBD User Name',
      'Display Name',
      'Job Title',
      'Office',
      'Department',
      ...activities.map(
        (a) => `${a.levelUpActivityType} - ${getFormattedDate(a.activityDate)}`
      ),
    ];

    const data = [];
    for (const user of users) {
      const userActivities = attendeeDetails.filter(
        (a) =>
          !!a.userPrincipleName &&
          a.userPrincipleName.toLowerCase() === user.upn.toLowerCase()
      );
      const newRow = [
        user.upn,
        user.bbdUserName,
        user.displayName,
        user.jobTitle,
        user.office,
        user.department,
      ];
      for (let index = 0; index < activities.length; index++) {
        const attended = userActivities.find(
          (ua) => ua.levelUpActivityId == activities[index].levelUpActivityId
        )
          ? true
          : false;
        newRow[newRow.length] = attended;
      }
      data.push(newRow);
    }

    const info = [
      'LevelUp: ' + title,
      'Start Date: ' + startDate,
      'Facilitator(s): ' + facilitatorNames,
    ];
    const fileName = `${title}-${startDate}.csv`;
    const csv = generateCsv(headers, data, info);

    const response = { csv: csv, fileName: fileName };

    res.json(response);
  })
);

router.post(
  '/addAttendees',
  handle_errors(async (req, res) => {
    const { upns, activityId } = req.body;
    await add_attendees(upns, activityId);

    const attendeeDetails = await getAttendeeDetails(activityId);

    res.json(attendeeDetails);
  })
);

module.exports = router;
