const router = require('express').Router();
const { handle_errors, logger} = require('@the-hive/lib-core');
const { describeTable, select, camelize } = require('../queries/generate.queries');

const {
  saveSetting,
  getAllPreferences,
  invitationPreferenceOptions,
  saveInvitationPreference,
  saveInvitationPreferences,
  getSettingType,
  getAllEventCategories,
  getAllOffices,
} = require('../queries/setting.queries');
const { withTransaction } = require('../shared/db');

module.exports = router.patch(
  '/setting',
  handle_errors(async (req, res) => {
    const upn = res.locals.upn;

    const setting = req.body;

    const settingType = await getSettingType(setting.settingTypeId);
    if (!settingType) {
      return res.status(400).json({ message: 'Invalid setting!' });
    }

    if (!settingType.canUserView || !settingType.canUserEdit) {
      return res.status(403).json({ message: 'Request Forbidden!' });
    }

    await withTransaction((tx) => saveSetting(tx, upn, req.body));
    res.status(200).json({ success: true });
  })
);

module.exports = router.get(
  '/settings',
  handle_errors(async (req, res) => {
    const upn = res.locals.upn;

    const preferences = await getAllPreferences(upn);

    res.json(preferences);
  })
);

module.exports = router.post(
  '/settings/invitation-preference',
  handle_errors(async (req, res) => {
    const upn = res.locals.upn;
    await withTransaction((tx) =>
      saveInvitationPreference(
        tx,
        upn,
        req.body.officeId,
        req.body.eventCategoryId
      )
    );
    res.status(200).json({ success: true });
  })
);

module.exports = router.patch(
  '/settings/invitation-preferences',
  handle_errors(async (req, res) => {
    if (
      Array.isArray(req.body) &&
      req.body.some((item) => item.officeId && item.eventCategoryId)
    ) {
      const upn = res.locals.upn;
      await withTransaction((tx) =>
        saveInvitationPreferences(tx, upn, req.body)
      );
      res.status(200).json({ success: true });
    } else if (
      req.body.some((item) => !item.officeId || !item.eventCategoryId)
    ) {
      res.status(400).json({
        message: `The Invitation preference is missing some necessary information.
      Please make sure each invitation preference includes all required details`,
      });
    } else {
      res
        .status(400)
        .json({ message: 'No invitation preferences have been received.' });
    }
  })
);

module.exports = router.get(
  '/settings/invitation-preference',
  handle_errors(async (req, res) => {
    const invitationOptions = await invitationPreferenceOptions();
    res.json(invitationOptions);
  })
);

module.exports = router.get(
  '/lookup-tables',
  handle_errors(async (req, res) => {
    try {
      const tableName = req.query.tableName;
      const tableDescription = await describeTable(tableName);
      const lookupTableData = await select(tableName, tableDescription);
      res.json({
        lookupTableData: lookupTableData,
        tableDescription: tableDescription.map((description) => {
          return { columnName: camelize(description.columnName), isIdentity: description.colIsIdentity };
        })
      });
    } catch (error) {
      logger.error({message:`Error retrieveing lookup table '${tableName}'`, error})
      res.status(400).json({ error: 'Something went wrong' });
    }
  })
);

module.exports = router.get(
  '/event-categories',
  handle_errors(async (_req, res) => {
    const invitationOptions = await getAllEventCategories();
    res.json(invitationOptions);
  })
);

module.exports = router.get(
  '/offices',
  handle_errors(async (_req, res) => {
    const invitationOptions = await getAllOffices();
    res.json(invitationOptions);
  })
);
