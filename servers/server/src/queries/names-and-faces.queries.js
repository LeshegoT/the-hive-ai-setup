const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const getFilteredBBDUsers = async (page, size, filter) => {
  const {
    searchString,
    unit,
    office,
    employmentFrom,
    employmentTo,
    groupMembersUpn,
  } = filter;

  const q = `
    SELECT
      overallCount = COUNT(*) OVER(),
      st.staffId,
      st.DisplayName,
      st.UserPrincipleName,
      st.JobTitle,
      st.OfficeAbbreviation as Office,
      st.Department as Unit,
      u.Description as UnitDescription,
      st.EmploymentDate
    FROM
      DecoratedStaff st
      INNER JOIN Unit u on st.Department = u.UnitName
    WHERE
      st.StaffStatus='active'
      AND (@SearchString IS NULL OR LOWER(st.DisplayName) LIKE '%' + LOWER(@SearchString) + '%')
      AND (@EndDate IS NULL OR @EndDate >= st.EmploymentDate)
      AND (@StartDate IS NULL OR @StartDate <= st.EmploymentDate)
      AND (@Department IS NULL OR st.Department = @Department)
      AND (@Office IS NULL OR st.Office = @Office)
      AND (@GroupMembersUpn IS NULL OR st.UserPrincipleName IN (
        SELECT value
        FROM STRING_SPLIT(@GroupMembersUpn,',')
      ))
    ORDER BY
      st.StaffId
    OFFSET
      ( ((cast(@Page as int)) - 1) * (cast(@Size as int))) ROWS
    FETCH NEXT
      (cast(@Size as int)) ROWS ONLY
  `;

  const connection = await db();
  const results = await connection
    .input('SearchString', searchString)
    .input('GroupMembersUpn', groupMembersUpn?.join(','))
    .input('Department', unit)
    .input('Office', office)
    .input('StartDate', employmentFrom)
    .input('EndDate', employmentTo)
    .input('Page', page)
    .input('Size', size)
    .timed_query(q, 'getBBDUsers');

  if (results.recordset.length > 0) {
    return fixCase(results.recordset);
  } else {
    throw new Error(`Couldn't find any users that match your filter criteria`);
  }
};

const getAllOffices = async () => {
  const q = `select  OfficeName as Office from Offices`;

  const connection = await db();
  const result = await connection.timed_query(q, 'getAllOffices');
  return fixCase(result.recordset);
};

module.exports = {
  getFilteredBBDUsers,
  getAllOffices,
};
