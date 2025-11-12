const { get } = require('../shared/graph-api');
const { logger } = require('@the-hive/lib-core');
const {
  getActiveStaffRecord,
  createUserDepartment,
  getActiveStaffRecordWithoutDepartment,
} = require('../queries/reporting.queries');

const updateStaffManagerDepartment = async (
  tx,
  latestStaffRecord,
  newlyCreatedStaffId = null
) => {
  try {
    const employeeManager = await get(
      `/users/${latestStaffRecord.userPrincipalName}/manager`,
      false
    );

    if (
      employeeManager.userPrincipalName &&
      latestStaffRecord.userPrincipalName
    ) {
      latestStaffRecord.manager =
        employeeManager.userPrincipalName.toLowerCase();

      let currentlyActiveStaff = await getActiveStaffRecord(latestStaffRecord);

      if (!currentlyActiveStaff && !newlyCreatedStaffId) {
        currentlyActiveStaff = await getActiveStaffRecordWithoutDepartment(
          latestStaffRecord
        );
      }

      if (
        newlyCreatedStaffId ||
        !currentlyActiveStaff.manager ||
        currentlyActiveStaff.manager.toLowerCase() !=
          latestStaffRecord.manager.toLowerCase() ||
        currentlyActiveStaff.department.toLowerCase() !=
          latestStaffRecord.department.toLowerCase()
      ) {
        const staffId = currentlyActiveStaff
          ? currentlyActiveStaff.staffId
          : newlyCreatedStaffId;
        await createUserDepartment(tx, latestStaffRecord, staffId);
      }
    } else {
      // Could not retrieve a manager upn for the employee therefore no update takes place
    }
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

module.exports = { updateStaffManagerDepartment };
