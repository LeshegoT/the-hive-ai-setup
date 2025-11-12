const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { withTransaction } = require('../shared/db');
const {
  update_point_values,
  get_upns_from_points,
  get_upns_from_sections,
  get_points_records,
  create_interaction_for_record,
  update_points_with_uiid,
  get_self_directed_interaction_records,
  get_user_section_records,
  update_section_with_uiid,
  update_missions_with_uiid,
  get_upns_from_courses,
  get_course_records,
  update_course_with_uiid,
  insert_new_points_record,
} = require('../queries/points-conversion.queries');
const { points_types } = require('../queries/point.queries');

router.put(
  '/updatePoints',
  handle_errors(async (req, res) => {
    await updatePoints();
    res.status(204).send();
  })
);

router.post(
  '/convertPoints',
  handle_errors(async (req, res) => {
    await conversion();
    res.status(204).send();
  })
);

router.post(
  '/convertSections',
  handle_errors(async (req, res) => {
    await convertSections();
    res.status(204).send();
  })
);

router.post(
  '/convertMissions',
  handle_errors(async (req, res) => {
    await convertMissions();
    res.status(204).send();
  })
);

router.post(
  '/convertCourses',
  handle_errors(async (req, res) => {
    await convertCourses();
    res.status(204).send();
  })
);

const updatePoints = async () => {
  const pointTypes = await points_types();

  for (const type of pointTypes) {
    const { pointTypeId, points } = type;

    await update_point_values(pointTypeId, points);
  }
};

const conversion = async () => {
  const upns = await get_upns_from_points();
  const pointTypes = await points_types();

  for (const upn of upns) {
    //Convert Points
    console.log(`Converting Points records for ${upn.userPrincipleName}`);
    const pointsRecords = await get_points_records(upn.userPrincipleName);
    console.log(`Found ${pointsRecords.length} records`);
    let count = 0;
    for (const record of pointsRecords) {
      const { pointId, pointTypeId, createdDate } = record;
      const typeId = getInteractionTypeFromPointType(
        pointTypeId,
        pointTypes,
      );
      count++;
      await withTransaction((tx) =>
        conversionOfPoints(
          tx,
          typeId,
          upn.userPrincipleName,
          createdDate,
          pointId,
        )
      ).catch((err) => {
        console.log(err);
      });
    }
    console.log(`Converted ${count} records`);
  }
};

const conversionOfPoints = async (
  tx,
  typeId,
  upn,
  createdDate,
  pointId
) => {
  const interaction = await create_interaction_for_record(
    tx,
    typeId,
    upn,
    createdDate
  );
  await update_points_with_uiid(tx, pointId, interaction.uiid);
};

const convertSections = async () => {
  const upns = await get_upns_from_sections();

  for (upn of upns) {
    const userSections = await get_user_section_records(upn.userPrincipleName);
    console.log(`Converting Sections for ${upn.userPrincipleName}`);
    console.log(`Found ${userSections.length} records`);
    let count = 0;
    for (section of userSections) {
      count++;
      await withTransaction((tx) =>
        conversionUserSections(
          tx,
          section.userSectionsId,
          upn.userPrincipleName,
          section.dateCompleted
        )
      ).catch((err) => {
        console.log(err);
      });
    }
    console.log(`Converted ${count} records`);
  }
};

const conversionUserSections = async (tx, sectionId, upn, date) => {
  const interaction = await create_interaction_for_record(tx, 4, upn, date);
  await update_section_with_uiid(tx, sectionId, interaction.uiid);
  await insert_new_points_record(tx, upn, 17, date, 20, interaction.uiid);
};

const convertMissions = async () => {
  const interactions = await get_self_directed_interaction_records();

  for (interaction of interactions) {
    await withTransaction((tx) =>
      update_missions_with_uiid(
        tx,
        interaction.interactionTypeID,
        interaction.userInteractionID
      )
    );
  }
};

const convertCourses = async () => {
  const upns = await get_upns_from_courses();

  for (upn of upns) {
    const courseRecords = await get_course_records(upn.userPrincipleName);
    console.log(`Converting Course records for ${upn.userPrincipleName}`);
    console.log(`Found ${courseRecords.length} records`);

    let count = 0;

    for (record of courseRecords) {
      count++;
      await withTransaction((tx) =>
        courseConversions(
          tx,
          upn.userPrincipleName,
          record.dateCompleted,
          record.courseId
        )
      ).catch((err) => {
        console.log(err);
      });
    }

    console.log(`Converted ${count} records`);
  }
};

const courseConversions = async (tx, upn, date, courseId) => {
  const interaction = await create_interaction_for_record(tx, 7, upn, date);
  await update_course_with_uiid(tx, courseId, interaction.uiid);
  await insert_new_points_record(tx, upn, 16, date, 300, interaction.uiid);
};

// Utils
const getInteractionTypeFromPointType = (
  pointTypeId,
  pointTypes,
  interactionTypes
) => {
  const code = pointTypes.find((type) => type.pointTypeId == pointTypeId).code;
  const interactionTypeId = interactionTypes.find(
    (type) => type.interactionCode === code
  ).interactionTypeID;
  return interactionTypeId;
};

module.exports = router;
