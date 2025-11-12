const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

function determineSettingValue(settingValue) {
  if (!settingValue || settingValue == '0') {
    return false;
  } else if (settingValue == '1') {
    return true;
  } else {
    return settingValue;
  }
}

const user_settings = async (upn) => {
  const query = `
      select *
      from UserSettings s
      where s.UserPrincipleName = @UPN
    `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(query, 'user_settings');

  const settings = fixCase(result.recordset).map((setting) => ({
    ...setting,
    value: determineSettingValue(setting.value),
  }));

  return settings;
};

const saveSetting = async (tx, upn, setting) => {
  const query = `     
      IF EXISTS (
        SELECT 1
        FROM UserSettings
        WHERE LOWER(UserPrincipleName) = LOWER(@UPN)
          AND UserSettingsTypeId = @UserSettingsTypeId
      )
      BEGIN
        UPDATE UserSettings
        SET
          Value = @Value
        WHERE LOWER(UserPrincipleName) = LOWER(@UPN)
          AND UserSettingsTypeId = @UserSettingsTypeId
      END
      ELSE
      BEGIN
        INSERT INTO UserSettings (
          UserPrincipleName,  
          Value,
          UserSettingsTypeId
        )
        VALUES (
          LOWER(@UPN),
          @Value,
          @UserSettingsTypeId
        )
      END;
    `;

  const request = await tx.timed_request();
  await request
    .input('UPN', upn)
    .input('Value', setting.value)
    .input('UserSettingsTypeId', setting.settingTypeId)
    .timed_query(query, 'saveSetting');
};

const getSettingType = async (userSettingsTypeId) => {
  const connection = await db();
  const query = `
    SELECT CanUserView, CanUserEdit
    FROM UserSettingsType
    WHERE UserSettingsTypeId = @UserSettingsTypeId
  `;

  const result = await connection
    .input('UserSettingsTypeId', userSettingsTypeId)
    .timed_query(query, 'getSettingType');
  return fixCase(result.recordset)[0];
};

const getAllPreferences = async (upn) => {
  const connection = await db();

  const settingsQuery = `
    SELECT
      ust.UserSettingsTypeId,
      us.Value,
      ust.TypeDescription,
      ust.SettingsDataType,
      ust.LookupTableName,
      ust.CanUserEdit
    FROM
      UserSettingsType AS ust
    LEFT JOIN
      UserSettings AS us ON us.UserSettingsTypeId = ust.UserSettingsTypeId
      AND us.UserPrincipleName = LOWER(@UPN)
    WHERE
      ust.CanUserView = 1;
  `;

  const invitationPreferencesQuery = `
    SELECT
      ueip.UserPrincipleName,
      o.OfficeName,
      cec.EventCategory
    FROM
      UserEventInvitationPreferences AS ueip
    INNER JOIN
      Offices AS o ON ueip.OfficeId = o.OfficeId
    INNER JOIN
      CalendarEventCategory AS cec ON ueip.EventCategoryId = cec.CalendarEventCategoryId
    WHERE
      ueip.UserPrincipleName = LOWER(@UPN);
  `;

  const settingsResult = await connection
    .input('UPN', upn)
    .timed_query(settingsQuery, 'getAllPreferences');

  const invitationPreferencesResult = await connection
    .input('@UPN', upn)
    .timed_query(invitationPreferencesQuery, 'getAllPreferences');

  return {
    preferences: fixCase(settingsResult.recordset),
    invitationPreferences: fixCase(invitationPreferencesResult.recordset),
  };
};

const invitationPreferenceOptions = async () => {
  const connection = await db();

  const query = `
    SELECT 
        CalendarEventCategoryId AS EventCategoryId, 
        EventCategory 
    FROM CalendarEventCategory;
    SELECT 
        OfficeId, 
        OfficeName
    FROM Offices;
  `;
  const result = await connection.timed_query(
    query,
    'invitationPreferenceOptions'
  );
  return {
    categories: fixCase(result.recordsets[0]),
    offices: fixCase(result.recordsets[1])
  };
};

const saveInvitationPreference = async (tx, upn, officeId, eventCategoryId) => {
  const connection = await tx.timed_request();

  const checkQuery = `
    SELECT COUNT(*) AS count
    FROM UserEventInvitationPreferences
    WHERE UserPrincipleName = LOWER(@UPN)
    AND OfficeId = @OfficeId
    AND EventCategoryId = @EventCategoryId;
  `;

  const checkResult = await connection
    .input('UPN', upn)
    .input('OfficeId', officeId)
    .input('EventCategoryId', eventCategoryId)
    .timed_query(checkQuery, 'saveInvitationPreference');

  if (checkResult && checkResult.recordset[0].count) {
    const deleteQuery = `
      DELETE FROM UserEventInvitationPreferences
      WHERE UserPrincipleName = LOWER(@UPN_Delete)
      AND OfficeId = @OfficeId_Delete
      AND EventCategoryId = @EventCategoryId_Delete;
    `;

    await connection
      .input('UPN_Delete', upn)
      .input('OfficeId_Delete', officeId)
      .input('EventCategoryId_Delete', eventCategoryId)
      .timed_query(deleteQuery, 'saveInvitationPreference');
  } else {
    const insertQuery = `
      INSERT INTO UserEventInvitationPreferences (
        UserPrincipleName,
        OfficeId,
        EventCategoryId
      )
      VALUES (
        LOWER(@UPN_Insert),
        @OfficeId_Insert,
        @EventCategoryId
      );
    `;

    await connection
      .input('UPN_Insert', upn)
      .input('OfficeId_Insert', officeId)
      .input('EventCategoryId_Insert', eventCategoryId)
      .timed_query(insertQuery, 'saveInvitationPreference');
  }
};

const saveInvitationPreferences = async (tx, upn, invitationPreferences) => {
  for (const { officeId, eventCategoryId } of invitationPreferences) {
    const connection = await tx.timed_request();
    const checkQuery = `
    SELECT COUNT(*) AS count
    FROM UserEventInvitationPreferences
    WHERE UserPrincipleName = LOWER(@UPN)
    AND OfficeId = @OfficeId
    AND EventCategoryId = @EventCategoryId;
  `;

    const checkResult = await connection
      .input('UPN', upn)
      .input('OfficeId', officeId)
      .input('EventCategoryId', eventCategoryId)
      .timed_query(checkQuery, 'saveInvitationPreference');

    if (checkResult && checkResult.recordset[0].count) {
      const deleteQuery = `
        DELETE FROM UserEventInvitationPreferences
        WHERE UserPrincipleName = LOWER(@UPN_Delete)
        AND OfficeId = @OfficeId_Delete
        AND EventCategoryId = @EventCategoryId_Delete;
      `;

      await connection
        .input('UPN_Delete', upn)
        .input('OfficeId_Delete', officeId)
        .input('EventCategoryId_Delete', eventCategoryId)
        .timed_query(deleteQuery, 'saveInvitationPreference');
    } else {
      const insertQuery = `
        INSERT INTO UserEventInvitationPreferences (
          UserPrincipleName,
          OfficeId,
          EventCategoryId
        )
        VALUES (
          LOWER(@UPN_Insert),
          @OfficeId_Insert,
          @EventCategoryId
        );
      `;

      await connection
        .input('UPN_Insert', upn)
        .input('OfficeId_Insert', officeId)
        .input('EventCategoryId_Insert', eventCategoryId)
        .timed_query(insertQuery, 'saveInvitationPreference');
    }
  }
};

const getAllOffices = async () => {
  const query = `
    SELECT 
        OfficeId, 
        OfficeName
    FROM Offices
  `;
  const connection = await db();
  const result = await connection.timed_query(query, 'getAllOffices');
  return fixCase(result.recordset);
};

const getAllEventCategories = async () => {
  const query = `
    SELECT 
      CalendarEventCategoryId AS EventCategoryId,
      EventCategory
    FROM CalendarEventCategory
  `;
  const connection = await db();
  const result = await connection.timed_query(query, 'getAllEventCategories');
  return fixCase(result.recordset);
};

module.exports = {
  user_settings,
  saveSetting,
  getAllPreferences,
  invitationPreferenceOptions,
  saveInvitationPreference,
  saveInvitationPreferences,
  getSettingType,
  getAllOffices,
  getAllEventCategories,
};
