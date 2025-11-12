/**@format */
import { fixCase, parseIfSetElseDefault } from "@the-hive/lib-core";
import { isSqlTransaction, SqlRequest, SqlTransaction } from "@the-hive/lib-db";
import { Pagination } from "@the-hive/lib-shared";
import {
  Alias,
  Attribute,
  CanonicalNameDetails,
  CanonicalNames,
  StandardizedNameAndCanonicalNameGuid,
  Institution,
  SearchTextException,
  SkillsEntity,
  StandardizedName,
} from "@the-hive/lib-skills-shared";

const SKILLS_SEARCH_SIMILARITY_SCORE_FACTOR = parseIfSetElseDefault('SKILLS_SEARCH_SIMILARITY_SCORE_FACTOR', 0.8)

type CanonicalNamesRecord = {
  CanonicalNameId: number;
  CanonicalName: string;
  StandardizedName: string;
  CanonicalNameCategoryId: number;
};

export async function addAliasIfNotExists(
  tx:SqlTransaction, 
  canonicalNameId: number, 
  alias: Alias
):Promise<Alias>{
  const query = `
    IF NOT EXISTS (
        SELECT 1
        FROM Aliases
        WHERE Alias = @Alias
          AND CanonicalNamesId = @CanonicalNamesId
    ) AND @CanonicalNamesId IS NOT NULL
    BEGIN
        INSERT INTO Aliases (CanonicalNamesId, Alias)
        VALUES (@CanonicalNamesId, @Alias);
    END;
  `;
  const request = await tx.timed_request();
  await request
    .input("CanonicalNamesId", canonicalNameId)
    .input("Alias", alias.alias)
    .timed_query(query, "addAliasIfNotExists");
  return alias;
}

export async function updateCanonicalName(
  tx: SqlTransaction,
  canonicalNameId: number,
  newCanonicalName: string,
): Promise<string> {
  const query = `
      UPDATE CanonicalNames
      SET CanonicalName = @UpdatedName
      WHERE CanonicalNamesId = @CanonicalNamesId;
  `;
  const request = await tx.timed_request();
  await request
    .input("CanonicalNamesId", canonicalNameId)
    .input("UpdatedName", newCanonicalName)
    .timed_query(query, "updateCanonicalName");
  return newCanonicalName;
}

export async function deleteAttributeOrInstitutionWithAliasesAndExceptions(
  tx: SqlTransaction,
  attributeOrInstitution: Partial<Attribute> | Partial<Institution>,
): Promise<Array<Omit<SkillsEntity, "canonicalNameGuid">>> {
  const query = `
  DELETE FROM Aliases
  WHERE canonicalNamesId = @CanonicalNamesId;

  DELETE FROM SkillSearchTextExceptions
  WHERE StandardName = @StandardizedName;

  DELETE FROM CanonicalNames
  OUTPUT DELETED.CanonicalName,DELETED.CanonicalNamesId, DELETED.StandardizedName
  WHERE CanonicalNamesId = @CanonicalNamesId;

  `;
  const request = await tx.timed_request();
  const result = await request
    .input("CanonicalNamesId", attributeOrInstitution.canonicalNameId)
    .input("StandardizedName", attributeOrInstitution.standardizedName)
    .timed_query(query, "deleteAttributeOrInstitutionWithAliasesAndExceptions");
  return fixCase(result.recordset as CanonicalNamesRecord[]);
}

export async function retrieveAttributeSearchResults(
  db: () => Promise<SqlRequest>,
  searchText: string,
  pagination: Pagination,
  categoriesToInclude: string[],
  ratified: boolean,
  attributesOrInstitutionsThatNeedRatification?: string[],
): Promise<CanonicalNames[]> {
  const query = `
  WITH CanonicalNameData AS (
    SELECT
        c.CanonicalNamesId,
        c.CanonicalName,
        c.StandardizedName,
        cnc.CanonicalNameCategoryId,
        cnc.CanonicalNameCategory,
        COALESCE(
            CASE
                WHEN LOWER(c.CanonicalName) LIKE '%' + LOWER(@SearchText) + '%'
                    OR JARO_WINKLER_SIMILARITY(LOWER(c.CanonicalName), LOWER(@SearchText)) >= @SkillsSearchSimilarityScoreFactor
                THEN JARO_WINKLER_SIMILARITY(LOWER(c.CanonicalName), LOWER(@SearchText))
            END,
            bestAliasMatch.SimilarityScore
        ) AS SimilarityScore
    FROM CanonicalNames c
    INNER JOIN CanonicalNameCategories cnc ON c.CanonicalNameCategoryId = cnc.CanonicalNameCategoryId
    OUTER APPLY (
        SELECT TOP 1
        a.Alias,
            JARO_WINKLER_SIMILARITY(LOWER(a.Alias), LOWER(@SearchText)) AS SimilarityScore
        FROM Aliases a
        WHERE a.CanonicalNamesId = c.CanonicalNamesId
          AND (
              LOWER(a.Alias) LIKE '%' + LOWER(@SearchText) + '%'
              OR JARO_WINKLER_SIMILARITY(LOWER(a.Alias), LOWER(@SearchText)) >= @SkillsSearchSimilarityScoreFactor
          )
        ORDER BY JARO_WINKLER_SIMILARITY(LOWER(a.Alias), LOWER(@SearchText)) DESC
    ) bestAliasMatch
    WHERE (
        LOWER(c.CanonicalName) LIKE '%' + LOWER(@SearchText) + '%'
        OR JARO_WINKLER_SIMILARITY(LOWER(c.CanonicalName), LOWER(@SearchText)) >= @SkillsSearchSimilarityScoreFactor
        OR bestAliasMatch.Alias IS NOT NULL
    )
      AND (@Categories IS NULL OR cnc.CanonicalNameCategory IN (
            SELECT value FROM STRING_SPLIT(@Categories, ','))
      )
)

SELECT
    d.CanonicalNamesId as CanonicalNameId,
    d.CanonicalName,
    d.StandardizedName,
    d.CanonicalNameCategoryId,
    (
        SELECT CanonicalName
        FROM CanonicalNames
        WHERE StandardizedName = d.CanonicalNameCategory
    ) as CanonicalNameCategory
FROM CanonicalNameData d
WHERE
(
    @Ratified IS NULL
    OR (@Ratified = 0 AND
        (@AttributesOrInstitutionsThatNeedRatification IS NULL OR
         d.CanonicalName IN (SELECT value FROM STRING_SPLIT(@AttributesOrInstitutionsThatNeedRatification, ','))
         OR d.StandardizedName IN (SELECT value FROM STRING_SPLIT(@AttributesOrInstitutionsThatNeedRatification, ','))
        )
    )
    OR (@Ratified = 1 AND
        (@AttributesOrInstitutionsThatNeedRatification IS NULL OR
         d.CanonicalName NOT IN (SELECT value FROM STRING_SPLIT(@AttributesOrInstitutionsThatNeedRatification, ','))
         AND d.StandardizedName NOT IN (SELECT value FROM STRING_SPLIT(@AttributesOrInstitutionsThatNeedRatification, ','))
        )
    )
)
  ORDER BY
      CASE WHEN LOWER(d.CanonicalName) = LOWER(@SearchText) THEN 0 ELSE 1 END,
      CASE WHEN LOWER(d.CanonicalName) LIKE '%' + LOWER(@SearchText) + '%' THEN 0 ELSE 1 END,
      d.SimilarityScore DESC,
      LEN(d.CanonicalName) ASC
  OFFSET (@StartIndex) * @PageLength ROWS
  FETCH NEXT @PageLength ROWS ONLY;
    `;

  const request = await db();
  const results = await request
    .input("SearchText", searchText)
    .input("StartIndex", pagination.startIndex)
    .input("PageLength", pagination.pageLength)
    .input("Ratified", ratified)
    .input(
      "AttributesOrInstitutionsThatNeedRatification",
      attributesOrInstitutionsThatNeedRatification ? attributesOrInstitutionsThatNeedRatification.join(",") : undefined,
    )
    .input("Categories", categoriesToInclude ? categoriesToInclude.join(",") : undefined)
    .input("SkillsSearchSimilarityScoreFactor", SKILLS_SEARCH_SIMILARITY_SCORE_FACTOR)
    .timed_query(query, "getCanonicalNamesSearchResults");
  return fixCase(results.recordset as CanonicalNamesRecord[]);
}

export async function getAllCanonicalNames(db: () => Promise<SqlRequest>): Promise<CanonicalNameDetails[]> {
  const query = `
    SELECT
      CanonicalName,
      CanonicalNamesId,
      CanonicalNameCategoryId,
      StandardizedName
    FROM  CanonicalNames
  `;
  const request = await db();
  const results = await request.timed_query(query, "getAllCanonicalNames");
  return fixCase(results.recordset) as CanonicalNameDetails[];
}

export async function getCanonicalNameDetails(
  dbOrTx: (() => Promise<SqlRequest>) | SqlTransaction,
  standardizedName: string,
): Promise<CanonicalNameDetails> {
  const query = `
    SELECT
    CanonicalName,
    CanonicalNamesId as canonicalNameId,
    CanonicalNameCategoryId,
    StandardizedName,
    CanonicalNameGuid as canonicalNameGuid
    FROM  CanonicalNames
    WHERE StandardizedName = @StandardizedName
  `;
  let request;
  if (isSqlTransaction(dbOrTx)) {
    request = await dbOrTx.timed_request();
  } else {
    request = await dbOrTx();
  }
  const result = await request
    .input("StandardizedName", standardizedName)
    .timed_query(query, "getCanonicalNameDetails");
  return fixCase(result.recordset as CanonicalNameDetails[])[0];
}

export async function retrieveCanonicalNameDetailsByCanonicalNameId(
  db: () => Promise<SqlRequest>,
  canonicalNameId: number,
): Promise<CanonicalNameDetails> {
  const query = `
    SELECT
    CanonicalName AS canonicalName,
    CanonicalNamesId AS canonicalNameId,
    CanonicalNameCategoryId AS canonicalNameCategoryId,
    StandardizedName AS standardizedName
    FROM CanonicalNames
    WHERE CanonicalNamesId = @canonicalNameId
  `;
  const request = await db();
  const result = await request
    .input("canonicalNameId", canonicalNameId)
    .timed_query(query, "retrieveCanonicalNameDetailsByCanonicalNameId");
  return result.recordset[0] as CanonicalNameDetails;
}

export async function getAliases(db: () => Promise<SqlRequest>, canonicalNameId: number): Promise<Alias[]> {
  const query = `
    SELECT
      AliasesId as AliasId,
      Alias
    FROM Aliases
    WHERE CanonicalNamesId = @CanonicalNameId;
  `;
  const request = await db();
  const result = await request.input("CanonicalNameId", canonicalNameId).timed_query(query, "getAliases");
  return fixCase(result.recordset as Alias[]);
}

export async function getCanonicalDetailsForInstitutionsGivenSearchText(
  db: () => Promise<SqlRequest>,
  searchText: string,
): Promise<Omit<SkillsEntity, "canonicalNameGuid">[]> {
  const query = `
    SELECT CanonicalName, CanonicalNamesId as CanonicalNameId, StandardizedName , CanonicalNameCategoryId
    FROM CanonicalNames
    WHERE CanonicalName LIKE '%' + @searchText + '%'
    AND CanonicalNameCategoryId = (
    SELECT CanonicalNameCategoryId
    FROM CanonicalNameCategories
    WHERE LOWER(CanonicalNameCategory) = 'institution');
  `;
  const request = await db();
  const result = await request.input("searchText", searchText).timed_query(query, "getInstitutionSearchResults");
  return fixCase(result.recordset as CanonicalNamesRecord[]);
}

export async function searchByTopLevelTag(
  db: () => Promise<SqlRequest>,
  searchText: string,
  topLevelTag: StandardizedName
): Promise<CanonicalNameDetails[]> {
  const query = `
    SELECT 
      CanonicalName AS canonicalName, 
      CanonicalNamesId AS canonicalNameId, 
      StandardizedName AS standardizedName, 
      CanonicalNameCategoryId AS canonicalNameCategoryId, 
      CanonicalNameGuid AS canonicalNameGuid
    FROM CanonicalNames
    WHERE CanonicalName LIKE '%' + @searchText + '%'
      AND CanonicalNameCategoryId = (
        SELECT CanonicalNameCategoryId
        FROM CanonicalNameCategories
        WHERE LOWER(CanonicalNameCategory) = @topLevelTag
      );
  `;
  const request = await db();
  const result = await request
    .input("searchText", searchText)
    .input("topLevelTag", topLevelTag)
    .timed_query(query, "searchByTopLevelTag");
  return result.recordset as CanonicalNameDetails[];
}

export async function removeAllAliasesForCanonicalName(tx: SqlTransaction, canonicalNameId: number) {
  const query = `
    DELETE FROM Aliases WHERE CanonicalNamesId = @canonicalNameId
  `;
  const request = await tx.timed_request();

  await request.input("canonicalNameId", canonicalNameId).timed_query(query, "deleteAliases");
}

export async function addListOfAliasesForCanonicalName(
  tx: SqlTransaction,
  canonicalNameId: number,
  aliases: Alias[],
): Promise<Alias[]> {
  const query = `
    INSERT INTO Aliases (Alias, CanonicalNamesId)
    (SELECT value,@canonicalNameId
    FROM OPENJSON(@arrayOfAliases));
  `;
  const aliasesString = JSON.stringify(aliases);
  const request = await tx.timed_request();

  await request
    .input("arrayOfAliases", aliasesString)
    .input("canonicalNameId", canonicalNameId)
    .timed_query(query, "addAliases");
  return aliases;
}

export async function replaceAliasesOfAStandardizedName(
  tx: SqlTransaction,
  aliases: Alias[],
  standardName: StandardizedName,
): Promise<Alias[]> {
  const canonicalNameId = (await getCanonicalNameDetails(tx, standardName)).canonicalNameId;
  await removeAllAliasesForCanonicalName(tx, canonicalNameId);
  await addListOfAliasesForCanonicalName(tx, canonicalNameId, aliases);

  return aliases;
}

export async function addCanonicalName(
  db: () => Promise<SqlRequest>,
  canonicalName: string,
  standardizedName: string,
  canonicalNameCategory: string,
): Promise<CanonicalNameDetails> {
  const query = `
    INSERT INTO CanonicalNames (CanonicalName, CanonicalNameCategoryId, StandardizedName)
    OUTPUT INSERTED.CanonicalNamesId as canonicalNameId, INSERTED.CanonicalName, INSERTED.StandardizedName, INSERTED.CanonicalNameCategoryId
    VALUES (
      @CanonicalName,
      (SELECT CanonicalNameCategoryId
        FROM CanonicalNameCategories
        WHERE CanonicalNameCategory = @CanonicalNameCategory),
       @StandardizedName
    );
  `;
  const request = await db();
  const result = await request
    .input("CanonicalName", canonicalName)
    .input("StandardizedName", standardizedName)
    .input("CanonicalNameCategory", canonicalNameCategory)
    .timed_query(query, "addCanonicalName");
  return fixCase(result.recordset)[0] as CanonicalNameDetails;
}

export async function addAnAlias(tx: SqlTransaction, canonicalNameId: number, alias: string): Promise<Alias> {
  const query = `
    INSERT INTO Aliases (CanonicalNamesId, Alias)
    OUTPUT INSERTED.AliasesId as AliasId, INSERTED.Alias
    VALUES (@CanonicalNameId, @Alias)
  `;
  const request = await tx.timed_request();
  const result = await request
    .input("CanonicalNameId", canonicalNameId)
    .input("Alias", alias)
    .timed_query(query, "addAnAlias");
  return fixCase(result.recordset)[0] as Alias;
}

export async function retrieveCanonicalNames(
  dbOrTx: (() => Promise<SqlRequest>) | SqlTransaction,
  canonicalName: string,
): Promise<CanonicalNames> {
  const query = `
   SELECT
      c.CanonicalName as canonicalName ,
      c.CanonicalNamesId as canonicalNameId,
      c.CanonicalNameCategoryId as canonicalNameCategoryId,
      c.StandardizedName as standardizedName,
      cnc.CanonicalNameCategory AS canonicalNameCategory
    FROM  CanonicalNames c
    INNER JOIN CanonicalNameCategories cnc
    ON c.CanonicalNameCategoryId = cnc.CanonicalNameCategoryId
    WHERE CanonicalName = @CanonicalName;
  `;
  let request;
  if (isSqlTransaction(dbOrTx)) {
    request = await dbOrTx.timed_request();
  } else {
    request = await dbOrTx();
  }
  const result = await request.input("CanonicalName", canonicalName).timed_query(query, "retrieveCanonicalNames");
  return result.recordset;
}

export async function getStandardizedNameByCanonicalNameIfExists(
  dbOrTx: (() => Promise<SqlRequest>) | SqlTransaction,
  canonicalName: string,
): Promise<StandardizedName | undefined> {
  const query = `
  SELECT StandardizedName
  FROM CanonicalNames
  WHERE CanonicalName = @CanonicalName
  `;
  let request;
  if (isSqlTransaction(dbOrTx)) {
    request = await dbOrTx.timed_request();
  } else {
    request = await dbOrTx();
  }
  const results = await request
    .input("CanonicalName", canonicalName)
    .timed_query(query, "getStandardizedNameByCanonicalNameIfExists");

  return results.recordset[0]?.["StandardizedName"] || undefined;
}

export async function standardizeName(db: () => Promise<SqlRequest>, canonicalName: string): Promise<string> {
  const query = `
    SELECT dbo.MakeStandardizedName(@Name) As StandardName
  `;
  const request = await db();
  const results = await request.input("Name", canonicalName).timed_query(query, "standardizeName");
  return (results.recordset[0] as { StandardName: string }).StandardName;
}

export async function addNewCanonicalNameAndAliases(
  db: () => Promise<SqlRequest>,
  canonicalName: string,
  canonicalNameCategory: string,
  standardizedName: string,
  aliases: string[],
): Promise<void> {
  const query = `
  INSERT INTO CanonicalNames (CanonicalName, CanonicalNameCategoryId, StandardizedName)
  VALUES (
    @CanonicalName,
    (SELECT CanonicalNameCategoryId FROM CanonicalNameCategories WHERE CanonicalNameCategory = @CanonicalNameCategory),
    @StandardizedName
  );

  INSERT INTO Aliases (CanonicalNamesId, Alias)
  SELECT SCOPE_IDENTITY(), value
  FROM STRING_SPLIT(@Aliases, ',');
`;
  const aliasesString = aliases.join(",");
  const request = await db();
  await request
    .input("CanonicalName", canonicalName)
    .input("StandardizedName", standardizedName)
    .input("CanonicalNameCategory", canonicalNameCategory)
    .input("Aliases", aliasesString)
    .timed_query(query, "addNewCanonicalNameAndAliases");
}

export async function updateAliasCanonicalNameReference(
  tx: SqlTransaction,
  oldStandardizedName: string,
  newStandardizedName: string,
): Promise<void> {
  const query = `
    UPDATE a
    SET a.CanonicalNamesID = c2.CanonicalNamesID
    FROM Aliases a
    INNER JOIN CanonicalNames c1 ON a.CanonicalNamesID = c1.CanonicalNamesID
    INNER JOIN CanonicalNames c2 ON c2.StandardizedName = @NewStandardizedName
    WHERE c1.StandardizedName = @OldStandardizedName;
  `;
  const request = await tx.timed_request();
  await request
    .input("OldStandardizedName", oldStandardizedName)
    .input("NewStandardizedName", newStandardizedName)
    .timed_query(query, "updateAliasCanonicalNameReference");
}

export async function deleteCanonicalNameByStandardizedName(
  tx: SqlTransaction,
  standardizedName: string,
): Promise<void> {
  const query = `
    DELETE FROM CanonicalNames
    WHERE StandardizedName = @StandardizedName
  `;
  const request = await tx.timed_request();
  await request.input("StandardizedName", standardizedName).timed_query(query, "deleteCanonicalName");
}

export async function updateCanonicalNameGuidByStandardizedName(
  tx: SqlTransaction,
  standardizedNameAndCanonicalNameGuid: StandardizedNameAndCanonicalNameGuid,
): Promise<boolean> {
  const query = `
    UPDATE CanonicalNames
    SET canonicalNameGuid = @guid
    OUTPUT inserted.canonicalNameGuid
    WHERE StandardizedName = @standardizedName
  `;

  const request = await tx.timed_request();
  const result = await request
    .input("standardizedName", standardizedNameAndCanonicalNameGuid.standardizedName)
    .input("guid", standardizedNameAndCanonicalNameGuid.canonicalNameGuid)
    .timed_query(query, "addCanonicalNameGuidByStandardizedName");
  return result?.recordset?.length > 0;
}

export async function addSearchTextException(
  tx: SqlTransaction,
  searchTextException: string,
  standardizedName: StandardizedName,
): Promise<SearchTextException> {
  const query = `
    INSERT INTO SkillSearchTextExceptions (Exception, StandardName)
    OUTPUT INSERTED.ExceptionId AS searchTextExceptionId, INSERTED.Exception AS searchTextException, INSERTED.StandardName AS standardizedName
    VALUES (@searchTextException, @standardizedName)
  `;

  const request = await tx.timed_request();
  const result = await request
    .input("searchTextException", searchTextException)
    .input("standardizedName", standardizedName)
    .timed_query(query, "addSearchTextException");
  return result.recordset[0] as SearchTextException;
}

export async function retrieveSearchTextExceptions(db: () => Promise<SqlRequest>): Promise<SearchTextException[]> {
  const query = `
    SELECT
      ExceptionId AS searchTextExceptionId,
      Exception AS searchTextException,
      StandardName AS standardizedName
    FROM SkillSearchTextExceptions
  `;

  const request = await db();
  const result = await request.timed_query(query, "retrieveSearchTextExceptions");
  return result.recordset as SearchTextException[];
}
