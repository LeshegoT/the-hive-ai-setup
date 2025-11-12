const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const getPaginatedContractStaff = async (
  pageNumber,
  pageSize,
  selectedUnitsText,
  selectedEntities,
  searchText,
  onlyContractorsWithNoContracts
) => {
  const query = `
        WITH LatestContractRecommendation AS (
            SELECT
                cr.StaffId,
                cr.HrRep
            FROM
                ContractRecommendationsActiveStatusLatestContractDates cr
            WHERE
                cr.Status != 'Archived'
        ), SelectedUnits AS (
            SELECT value as unit 
            FROM STRING_SPLIT(@SelectedUnitsText, ',')
        )
        SELECT 
            swad.StaffId, 
            swad.UserPrincipleName AS upn, 
            swad.DisplayName, 
            swad.EmploymentDate, 
            swad.JobTitle,
            swad.entityDescription AS entity,
            swad.Department, 
            swad.Office, 
            swad.StaffType,
            swad.Manager AS reviewer,
            lcr.HrRep,
            CAST(
                CASE 
                    WHEN lcr.StaffId IS NOT NULL THEN 1
                    ELSE 0
                END 
            AS BIT) AS HasActiveContractRecommendation,
            COUNT(swad.StaffId) OVER() AS resultSetSize
        FROM StaffWithActiveDepartment swad
        LEFT JOIN LatestContractRecommendation lcr
        ON swad.StaffId = lcr.StaffId
        WHERE LOWER(swad.StaffType) = 'contract'
            AND (@SearchText IS NULL OR (swad.UserPrincipleName LIKE '%' + @SearchText + '%' OR
                swad.DisplayName LIKE '%' + @SearchText + '%'))
            AND (@SelectedUnitsText IS NULL OR swad.Department IN (SELECT Unit FROM SelectedUnits))
            AND (@OnlyContractorsWithNoContracts IS NULL
                OR @OnlyContractorsWithNoContracts = 0
                OR NOT EXISTS (SELECT 1 FROM Contracts WHERE StaffId = swad.StaffId))
            AND (@selectedEntities IS NULL OR swad.CompanyEntityId IN (SELECT VALUE FROM STRING_SPLIT(@selectedEntities, ',')))
            ORDER BY EmploymentDate
            OFFSET (@PageNumber * @PageSize) 
            ROWS FETCH NEXT @PageSize ROWS ONLY
    `;

  const connection = await db();
  const results = await connection
    .input('SelectedUnitsText', selectedUnitsText)
    .input('SelectedEntities', selectedEntities)
    .input('SearchText', searchText)
    .input('PageNumber', pageNumber)
    .input('PageSize', pageSize)
    .input('OnlyContractorsWithNoContracts', onlyContractorsWithNoContracts)
    .timed_query(query, 'getContractStaff');
  return fixCase(results.recordset);
};

module.exports = {
  getPaginatedContractStaff,
};
