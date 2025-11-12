const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const all_applications = async () => {
  const q = `
    SELECT 
      ApplicationId, Name, IdNumber, Email, Phone, University, Degree, ApplicationDate, [Status], CV as Cv, Transcript 
    FROM VacWorkApplications
  `;

  const request = await db();
  const results = await request.timed_query(q, 'all_applications');
  const parts = fixCase(results.recordset);

  return parts;
};

module.exports = {
  all_applications,
};
