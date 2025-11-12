const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const getCanonicalNameSearchResults = async (searchText, categoriesToInclude) => {
  const query = `
    WITH CanonicalNameData AS (
        SELECT c.CanonicalName, c.StandardizedName , cnc.CanonicalNameCategory
        FROM CanonicalNames c
        INNER JOIN CanonicalNameCategories cnc ON c.CanonicalNameCategoryId = cnc.CanonicalNameCategoryId
        WHERE LOWER(c.CanonicalName) LIKE '%' + LOWER(@SearchText) + '%'
          AND (@Categories IS NULL OR cnc.CanonicalNameCategory IN (SELECT value FROM STRING_SPLIT(@Categories, ',')))
        UNION

        SELECT c.CanonicalName, c.StandardizedName,  cnc.CanonicalNameCategory
        FROM CanonicalNames c
        INNER JOIN Aliases a ON a.CanonicalNamesId = c.CanonicalNamesId
        INNER JOIN CanonicalNameCategories cnc ON c.CanonicalNameCategoryId = cnc.CanonicalNameCategoryId
        WHERE LOWER(a.Alias) LIKE '%' + LOWER(@SearchText) + '%'
          AND (@Categories IS NULL OR cnc.CanonicalNameCategory IN (SELECT value FROM STRING_SPLIT(@Categories, ',')))
    )
    SELECT TOP 10 cnd.CanonicalName, cnd.StandardizedName ,cnd.CanonicalNameCategory
    FROM CanonicalNameData cnd
    ORDER BY LEN(cnd.CanonicalName), cnd.CanonicalName;
  `;
  const request = await db();
  const results = await request
    .input('SearchText', searchText)
    .input('Categories',categoriesToInclude ? categoriesToInclude.join(',') : undefined)
    .timed_query(query, 'getCanonicalNameSearchResults');
  return fixCase(results.recordset);
};


const searchThroughCanonicalNames = async (searchText, category) => {
  const query = `
    WITH CanonicalNameData AS (
        SELECT c.CanonicalName
        FROM CanonicalNames c
        INNER JOIN CanonicalNameCategories cnc ON c.CanonicalNameCategoryId = cnc.CanonicalNameCategoryId
        WHERE LOWER(c.CanonicalName) = LOWER(@SearchText)
          AND (@Category IS NULL OR cnc.CanonicalNameCategory = @Category)
        UNION
        SELECT c.CanonicalName
        FROM CanonicalNames c
        INNER JOIN Aliases a ON a.CanonicalNamesId = c.CanonicalNamesId
        INNER JOIN CanonicalNameCategories cnc ON c.CanonicalNameCategoryId = cnc.CanonicalNameCategoryId
        WHERE LOWER(a.Alias) = LOWER(@SearchText)
          AND (@Category IS NULL OR cnc.CanonicalNameCategory = @Category)
    )
    SELECT DISTINCT cnd.CanonicalName
    FROM CanonicalNameData cnd
  `;
  const request = await db();
  const results = await request
    .input('SearchText', searchText)
    .input('Category', category)
    .timed_query(query, 'searchForInstitutionThroughCanonicalNames');
  return fixCase(results.recordset);
};

async function getCategoryForCanonicalName(canonicalName){
  const query = `
  SELECT cnc.CanonicalNameCategory
  FROM CanonicalNames cn
  INNER JOIN CanonicalNameCategories cnc
  ON cn.CanonicalNameCategoryId = cnc.CanonicalNameCategoryId
  WHERE cn.CanonicalName = @CanonicalName;
  `
  const request = await db();
  const results = await request
    .input('CanonicalName', canonicalName)
    .timed_query(query, 'getCategoryForCanonicalName');
    return fixCase(results.recordset)[0];
}

const getExperienceLevelAndDescriptions = async () => {
  const query = `
  SELECT jts.Label,rd.Description,jts.JSTypeId,sf.FieldName
  FROM JSTypeScale jts
  INNER JOIN RatingDescription rd ON jts.JSTypeScaleId = rd.JSTypeScaleId
  INNER JOIN JSType jt ON jts.JSTypeId = jt.JSTypeId
  INNER JOIN SkillsField sf ON jt.JSTypeId = sf.JSTypeId
  ORDER BY Rating;
  `;
  const request = await db();
  const results = await request
    .timed_query(query, 'getExperienceLevelAndDescriptions');
  return fixCase(results.recordset);
};

async function getAliasesForCanonicalName(canonicalNameId) {
  const query = `
    SELECT AliasesId, Alias
    FROM Aliases
    WHERE CanonicalNamesId = @canonicalNameId;
  `;
  const request = await db();
  const results = await request
    .input('canonicalNameId', canonicalNameId)
    .timed_query(query, 'getAliasesForCanonicalName');
  return fixCase(results.recordset);
}

async function getCanonicalNames(categories) {
  const query = `
    SELECT c.CanonicalNamesId, c.CanonicalName, c.standardizedName, c.CanonicalNameCategoryId, cnc.CanonicalNameCategory
    FROM CanonicalNames c
    INNER JOIN CanonicalNameCategories cnc ON c.CanonicalNameCategoryId = cnc.CanonicalNameCategoryId
    WHERE @Categories IS NULL OR cnc.CanonicalNameCategory IN (SELECT value FROM STRING_SPLIT(@Categories, ','));
  `;

  const request = await db();
  const results = await request.input("Categories", categories ? categories.join(",") : undefined).query(query);
  return fixCase(results.recordset);
}

async function getAliases() {
  const query = `
    SELECT CanonicalNamesId, Alias
    FROM Aliases;
  `;
  const request = await db();
  const results = await request.timed_query(query, 'getAliases');
  return fixCase(results.recordset);
}

async function getCanonicalNameCategories() {
  const query = `
    SELECT cnc.CanonicalNameCategoryId, CanonicalNameCategory as StandardizedName, CanonicalName 
	  FROM CanonicalNameCategories cnc 
    INNER JOIN CanonicalNames cn 
    ON cn.StandardizedName = cnc.CanonicalNameCategory;
  `;
  const request = await db();
  const results = await request.timed_query(
    query,
    'getCanonicalNameCategories'
  );
  return fixCase(results.recordset);
}

async function addCanonicalName(canonicalName, canonicalNameCategoryId, standardizedName) {
  const query = `
    INSERT INTO CanonicalNames (CanonicalName, CanonicalNameCategoryId, StandardizedName)
    OUTPUT INSERTED.CanonicalNamesId, INSERTED.CanonicalName, INSERTED.CanonicalNameCategoryId
    VALUES (@CanonicalName, @CanonicalNameCategoryId, @StandardizedName);
  `;

  const request = await db();
  const result = await request
    .input('CanonicalName', canonicalName)
    .input('StandardizedName', standardizedName)
    .input('CanonicalNameCategoryId', canonicalNameCategoryId)
    .query(query, 'addCanonicalName');
  return fixCase(result.recordset)[0];
}

async function canonicalNameExists(canonicalName) {
  const query = `
    SELECT 1 
    FROM CanonicalNames
    WHERE LOWER(CanonicalName) = LOWER(@CanonicalName);
  `;
  const request = await db();
  const result = await request
    .input('CanonicalName', canonicalName)
    .query(query, 'canonicalNameExists');
  return result.recordset.length > 0;
}

async function aliasExists(alias, canonicalNameId) {
  const query = `
    SELECT 1
    FROM Aliases 
    WHERE LOWER(Alias) = LOWER(@Alias)
    AND CanonicalNamesId = @CanonicalNamesId;
  `;
  const request = await db();
  const result = await request
    .input('Alias', alias)
    .input('CanonicalNamesId', canonicalNameId)
    .query(query, 'aliasExists');
  return result.recordset.length > 0;
}

async function addAlias(canonicalNameId, alias) {
  const query = `
    INSERT INTO Aliases (CanonicalNamesId, Alias)
    OUTPUT INSERTED.AliasesId, INSERTED.Alias
    VALUES (@CanonicalNamesId, @Alias)
  `;
  const request = await db();
  const result = await request
    .input('CanonicalNamesId', canonicalNameId)
    .input('Alias', alias)
    .timed_query(query, 'addAlias');
  return fixCase(result.recordset)[0];
}

async function deleteAlias(aliasId) {
  const query = `
    DELETE
    FROM Aliases
    WHERE AliasesId = @AliasId
  `;
  const request = await db();
  await request.input('AliasId', aliasId).timed_query(query, 'deleteAlias');
}

async function getCanonicalNameAndAliasBySearch(searchText, category) {
  const query = `
    WITH SearchedCanonicalNameIds AS (
        SELECT CanonicalNamesId
        FROM CanonicalNames
        WHERE @SearchText IS NULL OR LOWER(CanonicalName) LIKE '%' + LOWER(@SearchText) + '%'
        UNION
        SELECT a.CanonicalNamesId
        FROM Aliases a
        WHERE @SearchText IS NULL OR LOWER(a.Alias) LIKE '%' + LOWER(@SearchText) + '%'
    )
    SELECT c.CanonicalNamesId, cn.CanonicalNameCategory, c.CanonicalName, NULL AS AliasesId, NULL AS Alias
    FROM CanonicalNames c
    INNER JOIN CanonicalNameCategories cn ON c.CanonicalNameCategoryId = cn.CanonicalNameCategoryId
    WHERE c.CanonicalNamesId IN (SELECT CanonicalNamesId FROM SearchedCanonicalNameIds)
      AND (@Category IS NULL OR cn.CanonicalNameCategory = @Category)
    UNION ALL
    SELECT c.CanonicalNamesId, cn.CanonicalNameCategory, c.CanonicalName, a.AliasesId, a.Alias
    FROM CanonicalNames c
    INNER JOIN Aliases a ON c.CanonicalNamesId = a.CanonicalNamesId
    INNER JOIN CanonicalNameCategories cn ON c.CanonicalNameCategoryId = cn.CanonicalNameCategoryId
    WHERE c.CanonicalNamesId IN (SELECT CanonicalNamesId FROM SearchedCanonicalNameIds)
      AND (@Category IS NULL OR cn.CanonicalNameCategory = @Category)
  `;

  const request = await db();
  const result = await request
    .input('SearchText', searchText)
    .input('Category', category)
    .query(query, 'getCanonicalNameAndAliasBySearch');

  return fixCase(result.recordset);
}

async function getPaginatedCanonicalNameAndAliasBySearch(searchText, pageSize, pageNumber, category, findNotInGraphDB) {
  const query = `
    WITH SearchedCanonicalNameIds AS (
      SELECT CanonicalNamesId
      FROM CanonicalNames c
        INNER JOIN CanonicalNameCategories cn ON c.CanonicalNameCategoryId = cn.CanonicalNameCategoryId
        WHERE (@SearchText IS NULL OR LOWER(CanonicalName) LIKE '%' + LOWER(@SearchText) + '%')
        AND (@Category IS NULL OR cn.CanonicalNameCategory = @Category)
        AND (@FindNotInGraphDB = 0 OR c.CanonicalNameGuid IS NULL)
      UNION
      SELECT a.CanonicalNamesId
      FROM Aliases a
        INNER JOIN CanonicalNames c ON c.CanonicalNamesId = a.CanonicalNamesId
        INNER JOIN CanonicalNameCategories cn ON c.CanonicalNameCategoryId = cn.CanonicalNameCategoryId
        WHERE (@SearchText IS NULL OR LOWER(a.Alias) LIKE '%' + LOWER(@SearchText) + '%')
        AND (@Category IS NULL OR cn.CanonicalNameCategory = @Category)
        AND (@FindNotInGraphDB = 0 OR c.CanonicalNameGuid IS NULL)
    ),
    LimitedCanonicalNames AS (
      SELECT c.CanonicalNamesId
      FROM CanonicalNames c
      WHERE c.CanonicalNamesId IN (SELECT CanonicalNamesId FROM SearchedCanonicalNameIds)
      ORDER BY c.CanonicalName
      OFFSET @PageNumber * @PageSize ROWS
      FETCH NEXT @PageSize ROWS ONLY
    )
    SELECT c.StandardizedName, c.CanonicalNamesId, cn.CanonicalNameCategory, c.CanonicalName, NULL AS AliasesId, NULL AS Alias, 
    CASE 
      WHEN CanonicalNameGuid IS NULL THEN 0
      ELSE 1
    END AS InGraphDB
    FROM CanonicalNames c
    INNER JOIN CanonicalNameCategories cn ON c.CanonicalNameCategoryId = cn.CanonicalNameCategoryId
    WHERE c.CanonicalNamesId IN (SELECT CanonicalNamesId FROM LimitedCanonicalNames)
    AND (@FindNotInGraphDB = 0 OR c.CanonicalNameGuid IS NULL)
    UNION ALL
    SELECT c.StandardizedName, c.CanonicalNamesId, cn.CanonicalNameCategory, c.CanonicalName, a.AliasesId, a.Alias,
    CASE 
      WHEN c.CanonicalNameGuid IS NULL THEN 0
      ELSE 1
    END AS InGraphDB
    FROM CanonicalNames c
    INNER JOIN Aliases a ON c.CanonicalNamesId = a.CanonicalNamesId
    INNER JOIN CanonicalNameCategories cn ON c.CanonicalNameCategoryId = cn.CanonicalNameCategoryId
    WHERE c.CanonicalNamesId IN (SELECT CanonicalNamesId FROM LimitedCanonicalNames)
    AND (@FindNotInGraphDB = 0 OR c.CanonicalNameGuid IS NULL);

    SELECT COUNT(*) AS resultSetSize
    FROM (
      SELECT CanonicalNamesId
      FROM CanonicalNames c
      INNER JOIN CanonicalNameCategories cn ON c.CanonicalNameCategoryId = cn.CanonicalNameCategoryId
      WHERE (@SearchText IS NULL OR LOWER(CanonicalName) LIKE '%' + LOWER(@SearchText) + '%')
        AND (@Category IS NULL OR cn.CanonicalNameCategory = @Category)
        AND (@FindNotInGraphDB = 0 OR c.CanonicalNameGuid IS NULL)
      UNION
      SELECT a.CanonicalNamesId
      FROM Aliases a
      INNER JOIN CanonicalNames c ON c.CanonicalNamesId = a.CanonicalNamesId
      INNER JOIN CanonicalNameCategories cn ON c.CanonicalNameCategoryId = cn.CanonicalNameCategoryId
      WHERE (@SearchText IS NULL OR LOWER(a.Alias) LIKE '%' + LOWER(@SearchText) + '%')
        AND (@Category IS NULL OR cn.CanonicalNameCategory = @Category)
        AND (@FindNotInGraphDB = 0 OR c.CanonicalNameGuid IS NULL)
    ) AS SearchedCanonicalNameIds;
  `;

  const request = await db();
  const result = await request
    .input('SearchText', searchText)
    .input('Category', category)
    .input('PageNumber', pageNumber)
    .input('PageSize', pageSize)
    .input('FindNotInGraphDB', findNotInGraphDB ? 1 : 0)
    .query(query, 'getPaginatedCanonicalNameAndAliasBySearch');
  const [canonicalData, canonicalNamesCount] = result.recordsets;
  const canonicalNamesAndAliases = fixCase(canonicalData);
  const total = fixCase(canonicalNamesCount)[0]?.resultSetSize || 0;
  return {canonicalNamesAndAliases, total};
}

async function getFieldsAndTypes() {
  const query = `
    SELECT sf.FieldName, jst.JavaScriptType
      FROM SkillsField sf
      INNER JOIN JSType jst
      ON sf.JSTypeId = jst.JSTypeId
  `;

  const request = await db();
  const result = await request
    .query(query, 'getFieldsAndTypes');
  return fixCase(result.recordset);
}

async function addCanonicalNameAndCategoryIfNotExists(canonicalName, canonicalNameCategory, standardizedName) {
 const query = `
    IF NOT EXISTS (
      SELECT 1
      FROM CanonicalNames
      WHERE CanonicalName = @CanonicalName
    )
    BEGIN
      INSERT INTO CanonicalNames (CanonicalName, CanonicalNameCategoryId, StandardizedName)
      VALUES (@CanonicalName,
              (SELECT CanonicalNameCategoryId
              FROM CanonicalNameCategories
              WHERE CanonicalNameCategory = @CanonicalNameCategory),
              @StandardizedName
            );
    END;
  `;
  const request = await db();
  await request
    .input('CanonicalName', canonicalName)
    .input('CanonicalNameCategory', canonicalNameCategory)
    .input('StandardizedName', standardizedName)
    .query(query, 'addCanonicalNameAndCategoryIfNotExists');
}

async function getSkillSearchFilterOptions() {
  const query = `
    SELECT jst.Description,
      jst.JavaScriptType,
      ssc.SkillSearchComparison,
      ssc.DisplayComparison
    FROM JSType jst
    INNER JOIN SkillSearchComparisons ssc
    ON jst.JSTypeId = ssc.JSTypeId
  `;
  const request = await db();
  ;
  return fixCase((await request.query(query, 'getSkillSearchFilterOptions')).recordset)
}

async function getGremlinSkillComparison() {
  const query = `
    SELECT sf.FieldName,
      ssc.SkillSearchComparison,
      ssc.GremlinComparison
    FROM SkillSearchComparisons ssc
    INNER JOIN SkillsField sf
    ON sf.JSTypeId = ssc.JSTypeId
  `;
  const request = await db();
  const results = await request.timed_query(query, 'getGremlinSkillComparison');
  return fixCase(results.recordset);
}

async function getCanonicalNameIdFromCanonicalName(canonicalName, category) {
  const query = `
    SELECT CanonicalNamesId
    FROM CanonicalNames cn
    INNER JOIN CanonicalNameCategories cat ON cn.CanonicalNameCategoryId = cat.CanonicalNameCategoryId
    WHERE cn.CanonicalName = @CanonicalName AND cat.CanonicalNameCategory = @Category
  `;
  const request = await db();
  const result = await request
    .input('CanonicalName', canonicalName)
    .input('Category', category)
    .query(query, 'getCanonicalNameIdFromCanonicalName');
  return fixCase(result.recordset)[0]?.canonicalNamesId;
}

async function deleteAliasesForCanonicalName(canonicalNamesId) {
  const query = `
    DELETE FROM Aliases
    WHERE CanonicalNamesId = @CanonicalNamesId
  `;
  const request = await db();
  await request
    .input('CanonicalNamesId', canonicalNamesId)
    .timed_query(query, 'deleteAliasesForCanonicalName');
}

async function deleteCanonicalName(canonicalNamesId) {
  const query = `
    DELETE FROM CanonicalNames
    WHERE CanonicalNamesId = @CanonicalNamesId
  `;
  const request = await db();
  await request
    .input('CanonicalNamesId', canonicalNamesId)
    .timed_query(query, 'deleteCanonicalName');
}

async function getStandardNameByCanonicalNameIfExists(canonicalName){
  const query =`
  SELECT StandardizedName
  FROM CanonicalNames
  WHERE CanonicalName = @CanonicalName
  `
  const request = await db();
  const results = await request
    .input('CanonicalName', canonicalName)
    .timed_query(query, 'getStandardNameByCanonicalNameIfExists');
  return fixCase(results.recordset)[0]?.['standardizedName'] || canonicalName;
}

async function updateCanonicalName(canonicalNameId, updatedName) {
  const query = `
    UPDATE CanonicalNames
    SET CanonicalName = @UpdatedName,
        StandardizedName = dbo.MakeStandardizedName(@UpdatedName)
    WHERE CanonicalNamesId = @CanonicalNameId;
  `;
  const request = await db();
  await request
    .input('CanonicalNameId', canonicalNameId)
    .input('UpdatedName', updatedName)
    .timed_query(query, 'updateCanonicalName');
}

async function getCanonicalNameDetails(name) {
  const query = `
    SELECT
    cn.CanonicalName,
    cn.StandardizedName,
    cnc.CanonicalNameCategory
  FROM CanonicalNames cn
  INNER JOIN CanonicalNameCategories cnc on cn.CanonicalNameCategoryId = cnc.CanonicalNameCategoryId
  WHERE LOWER(CanonicalName) = LOWER(@Name)
  `;

  const request = await db();
  const result = await request
    .input('Name', name)
    .query(query, 'getCanonicalNameDetails');
    return fixCase(result.recordset)[0];
}

async function getCanonicalNameByStandardizedNameIfExists(standardizedName){
  const query =`
  SELECT CanonicalName
  FROM CanonicalNames
  WHERE standardizedName = @standardizedName
  `
  const request = await db();
  const results = await request
    .input('standardizedName', standardizedName)
    .timed_query(query, 'getCanonicalNameByStandardizedNameIfExists');
  return fixCase(results.recordset)[0]?.['canonicalName'] || standardizedName;
}

async function standardizeName(name) {
  const query = `
    SELECT dbo.MakeStandardizedName(@Name) As StandardName
  `;
  const request = await db();
  const results = await request
    .input('Name', name)
    .timed_query(query, 'standardizeName');
  return fixCase(results.recordset)[0]?.standardName;
}

async function getConnectedStaffMemberEmails(staffIdList){
  const query =`
    WITH ParsedIds AS (
      SELECT CAST(value AS INT) AS StaffId
      FROM STRING_SPLIT(@StaffIdList, ',')
    )
    SELECT s.StaffId, s.UserPrincipleName AS Email
    FROM Staff s
    WHERE s.StaffId IN (SELECT StaffId FROM ParsedIds);
  `
  const request = await db();
  const results = await request
    .input('StaffIdList', staffIdList)
    .timed_query(query, 'getConnectedStaffMemberEmails');
  return fixCase(results.recordset);
}

async function getCanonicalNameById(canonicalNameId) {
  const query = `
    SELECT CanonicalName
    FROM CanonicalNames
    WHERE CanonicalNamesId = @CanonicalNameId
  `;
  const request = await db();
  const results = await request
    .input('CanonicalNameId', canonicalNameId)
    .timed_query(query, 'getCanonicalNameById');
  return fixCase(results.recordset);
}

module.exports = {
  getCanonicalNameSearchResults,
  getExperienceLevelAndDescriptions,
  getAliasesForCanonicalName,
  addCanonicalName,
  addAlias,
  canonicalNameExists,
  aliasExists,
  getAliases,
  getCanonicalNames,
  deleteAlias,
  getCanonicalNameAndAliasBySearch,
  searchThroughCanonicalNames,
  getCanonicalNameCategories,
  getFieldsAndTypes,
  addCanonicalNameAndCategoryIfNotExists,
  getSkillSearchFilterOptions,
  getGremlinSkillComparison,
  getCanonicalNameIdFromCanonicalName,
  deleteAliasesForCanonicalName,
  deleteCanonicalName,
  getStandardNameByCanonicalNameIfExists,
  getCanonicalNameByStandardizedNameIfExists,
  standardizeName,
  updateCanonicalName,
  getCategoryForCanonicalName,
  getCanonicalNameDetails,
  getConnectedStaffMemberEmails,
  getPaginatedCanonicalNameAndAliasBySearch,
  getCanonicalNameById
};
