const { selectById, describeTable } = require('../queries/generate.queries');

class ValidationError extends Error {
  constructor(message) {
    super(message);
  }
}

function validateDate(dateString, fieldName) {
  const parsedDate = new Date(Date.parse(dateString));
  if (!parsedDate || isNaN(parsedDate) || !(parsedDate instanceof Date)) {
    throw new ValidationError(
      `Could not parse '${fieldName}' as date and time, input was '${dateString}' but expecting an ISO formatted date`
    );
  } else {
    return parsedDate;
  }
}

function validateExists(value, fieldName) {
  if (!value) {
    throw new ValidationError(`Invalid emissing input: '${fieldName}'.`);
  } else {
    return value;
  }
}

async function validateIdExists(id, tableName, fieldName) {
  const tableDescription = await describeTable(tableName);
  const result = await selectById(tableName, tableDescription, id);
  if (result.length != 1) {
    throw new ValidationError(`ID specified by ${fieldName} does not exist`);
  }
  return result[0];
}

function validateLoggedInUser(requestUser, requestFieldUser, fieldName) {
  if (requestUser.toLowerCase() !== requestFieldUser.toLowerCase()) {
    throw new ValidationError(
      `User specified in '${fieldName}' does not match logged in user`
    );
  } else {
    return requestUser;
  }
}

const validateMissions = (missions) => {
  if (missions.length >= 1) {
    return missions.filter((mission) => !mission.deleted);
  }

  throw new ValidationError('Atleast one mission is required to create a quest');
}

module.exports = {
  ValidationError,
  validateDate,
  validateExists,
  validateIdExists,
  validateLoggedInUser,
  validateMissions,
};
