/** @format */
import { fixCase } from "@the-hive/lib-core";
import { SqlRequest, SqlTransaction } from "@the-hive/lib-db";
import {
  Attribute,
  AttributeType,
  BadRequestDetail,
  EntityCount,
  FieldValue,
  Guid,
  SkillsLastUsedDetails,
  Staff,
  StaffOnSupply,
  DecoratedStaff,
  StandardizedName,
  UserAttribute,
  OnSupplyRole,
  PendingProofValidation,
} from "@the-hive/lib-skills-shared";
import gremlin from "gremlin";
import { getSkillRequiredFields } from "./attribute.queries";

type StaffLastUsedDetailsRecord = { StaffId: number; LastModified: Date; LastVisited: Date };

export async function getStaffId(db: () => Promise<SqlRequest>, upn: string): Promise<number | undefined> {
  const query = `
    SELECT StaffId
    FROM Staff
    WHERE UserPrincipleName = @UPN
  `;
  const request = await db();
  const result = await request.input("UPN", upn).timed_query(query, "getStaffId");
  const fixedCaseRecordset = fixCase(result.recordset as { StaffId: number }[]);
  return fixedCaseRecordset[0]?.staffId;
}

export async function addStaffToSupply(
  db: () => Promise<SqlRequest>,
  staffId: number,
  addedBy: string,
  onSupplyAsOf: Date,
): Promise<void> {
  const query = `
    INSERT INTO StaffOnSupply (StaffId, OnSupplyAsOf, AddedBy, AddedOn)
    VALUES (@staffId, @onSupplyAsOf, @addedBy, GETDATE())
  `;
  const request = await db();
  await request
    .input("staffId", staffId)
    .input("addedBy", addedBy)
    .input("onSupplyAsOf", onSupplyAsOf)
    .timed_query(query, "getStaffId");
}

export async function getTotalUsers(gremlin: gremlin.driver.Client): Promise<number> {
  const query = `
    g.V()
      .hasLabel('person')
      .count()
  `;
  const resultPromise = gremlin.submit(query);
  const result = await resultPromise;
  return result._items[0];
}

export async function getAllUsersForAttribute(
  gremlin: gremlin.driver.Client,
  standardizedName: string,
): Promise<number[]> {
  const query = `
    g.V()
      .has('identifier', standardizedName)
      .repeat(inE().outV())
      .until(hasLabel('person'))
      .values('identifier')
  `;
  const result = await gremlin.submit(query, { standardizedName });
  return result._items;
}

export async function getEntityCountByStaffIds(
  db: () => Promise<SqlRequest>,
  staffIds: number[],
  officeIds: number[],
): Promise<EntityCount> {
  const query = `
    SELECT [BBD], [BBi], [BBn], [BBu], [GNC], [ILI], [IND], [BBs]
    FROM (
        SELECT EntityAbbreviation FROM DecoratedStaff
        WHERE StaffId IN (SELECT value FROM STRING_SPLIT(@StaffIds, ','))
        AND StaffStatus <> 'terminated'
        AND OfficeId IN (SELECT value FROM STRING_SPLIT(@OfficeIds, ','))
    ) src
    PIVOT (
        COUNT(EntityAbbreviation)
        FOR EntityAbbreviation IN ([BBD], [BBi], [BBn], [BBu], [GNC], [ILI], [IND], [BBs])
    ) AS PivotTable;
  `;
  const request = await db();
  const selectedStaffIds = staffIds.join(",");
  const result = await request
    .input("StaffIds", selectedStaffIds)
    .input("OfficeIds", officeIds.join(","))
    .timed_query(query, "getEntityCountByStaffIds");
  return result.recordset[0] as EntityCount;
}

export async function getStaffIdsByCompanyEntityFilter(
  db: () => Promise<SqlRequest>,
  entityIds: string,
  staffNameSearchText?: string,
  searchDate: Date = undefined,
  filterStaffOnSupply = false,
  officeFilter?: string,
): Promise<number[]> {
  let query = `
    SELECT
      s.StaffId
    FROM DecoratedStaff AS s
    LEFT JOIN
      SkillsLastUsed AS skl ON skl.StaffId = s.StaffId
    WHERE
      (@StaffNameSearchText IS NULL OR s.DisplayName LIKE '%' + @StaffNameSearchText + '%')
      AND s.CompanyEntityId IN (SELECT value FROM STRING_SPLIT(@EntityIds, ','))
      AND s.StaffStatus <> 'terminated'
  `;

  if (searchDate) {
    query += "AND (skl.LastModified < @SearchDate) ";
  } else {
    // we need not filter by searchDate thus continue query building
  }

  if (filterStaffOnSupply) {
    query += `
      AND s.StaffId IN (
        SELECT
          sos.StaffId
          FROM StaffOnSupply AS sos
          WHERE sos.DeletedBy IS NULL AND sos.DeletedOn IS NULL
      )
      `;
  } else {
    // continue to execute the query
  }

  if (officeFilter) {
    query += `
      AND s.OfficeId IN (SELECT value FROM STRING_SPLIT(@OfficeIds, ','))
    `;
  } else {
    // continue to execute the query
  }

  const request = await db();
  const result = await request
    .input("EntityIds", entityIds)
    .input("SearchDate", searchDate)
    .input("StaffNameSearchText", staffNameSearchText)
    .input("OfficeIds", officeFilter)
    .timed_query(query, "getStaffIdsByCompanyEntityFilter");
  return result.recordset.map((record: { StaffId: number }) => record.StaffId);
}

export async function updateStaffOnSupply(
  db: () => Promise<SqlRequest>,
  staffId: number,
  onSupplyAsOf: Date,
): Promise<void> {
  const query = `
    UPDATE StaffOnSupply
    SET OnSupplyAsOf = @onSupplyAsOf
    WHERE StaffId = @staffId AND
    DeletedBy IS NULL AND DeletedOn IS NULL
  `;
  const request = await db();
  await request.input("staffId", staffId).input("onSupplyAsOf", onSupplyAsOf).timed_query(query, "updateStaffOnSupply");
}

export async function getStaffOnSupplySummary(db: () => Promise<SqlRequest>): Promise<number> {
  const query = `
    SELECT
      COUNT(1) AS onSupplyStaff
    FROM StaffOnSupply
  `;
  const request = await db();
  const result = await request.timed_query(query, "getStaffOnSupplySummary");
  return fixCase(result.recordset)[0]["onSupplyStaff"] as number;
}

export async function removeStaffFromSupply(tx: SqlTransaction, upn: string, deletedBy: string): Promise<void> {
  const query = `
  UPDATE StaffOnSupply
  SET DeletedBy = @DeletedBy, DeletedOn = GETDATE()
  WHERE StaffId = (SELECT StaffId FROM Staff WHERE UserPrincipleName = @UPN)
  AND DeletedBy IS NULL AND DeletedOn IS NULL
`;

  const request = await tx.timed_request();
  await request.input("UPN", upn).input("DeletedBy", deletedBy).timed_query(query, "removeStaffFromSupply");
}

export async function getStaffOnSupply(db: () => Promise<SqlRequest>): Promise<StaffOnSupply[]> {
  const query = `
  SELECT
    StaffId,
    BBDUserName,
    UserPrincipleName as upn,
    DisplayName,
    JobTitle,
    Department,
    Manager,
    OnSupplyAsOf,
    Role,
    EntityDescription,
    EntityAbbreviation
  FROM CurrentStaffOnSupply
`;

  const request = await db();
  const result = await request.timed_query(query, "getStaffOnSupply");
  return fixCase(result.recordset) as StaffOnSupply[];
}

export async function retrieveStaffOnSupplyByUpn(
  db: () => Promise<SqlRequest>,
  upn: string,
): Promise<StaffOnSupply | undefined> {
  const query = `
    SELECT
      StaffId AS staffId,
      BBDUserName AS bbdUserName,
      UserPrincipleName AS upn,
      DisplayName AS displayName,
      JobTitle AS jobTitle,
      Department AS department,
      Manager AS manager,
      OnSupplyAsOf AS onSupplyAsOf,
      Role AS role,
      EntityDescription AS entityDescription,
      EntityAbbreviation AS entityAbbreviation
    FROM CurrentStaffOnSupply
    WHERE UserPrincipleName = @upn
  `;

  const request = await db();
  const result = await request.input("upn", upn).timed_query(query, "retrieveStaffOnSupplyByUpn");
  return result.recordset.length > 0 ? (result.recordset[0] as StaffOnSupply) : undefined;
}

export async function getAllSkillsUsers(gremlin: gremlin.driver.Client): Promise<number[]> {
  const query = `
    g.V()
      .hasLabel('person')
      .values('identifier')
  `;
  const resultPromise = gremlin.submit(query);
  const result = await resultPromise;
  return result._items;
}

export async function retrieveAllSkillsUsersWithoutGivenAttributeType(
  gremlin: gremlin.driver.Client,
  attributeType: AttributeType,
): Promise<number[]> {
  const query = `
    g.V()
      .hasLabel('person')
      .not(
        repeat(out())
          .until(hasLabel('topLevelTag'))
          .has('identifier', attributeType)
      )
      .values('identifier')
  `;

  const input = {
    attributeType,
  };
  const resultPromise = gremlin.submit(query, input);
  const result = await resultPromise;
  return result._items;
}

export async function getStaffDetailsByStaffIds(
  db: () => Promise<SqlRequest>,
  companyEntityIds: number[],
  staffIds: number[],
  inArray: boolean,
  startIndex: number,
  pageLength?: number,
  staffNameSearchText?: string,
  sortedColumn?: keyof DecoratedStaff,
  sortOrder?: string,
  searchDate: Date = undefined,
): Promise<DecoratedStaff[] | BadRequestDetail> {
  const allowedSortColumns: (keyof DecoratedStaff)[] = [
    "staffId",
    "displayName",
    "upn",
    "jobTitle",
    "manager",
    "department",
    "entityDescription",
    "lastModified",
    "lastVisited",
  ];

  const allowedSortOrders: string[] = ["ASC", "DESC"];

  if (
    (sortedColumn && !allowedSortColumns.includes(sortedColumn)) ||
    (sortOrder && !allowedSortOrders.includes(sortOrder.toUpperCase()))
  ) {
    return {
      message: `Failed to sort data`,
      detail: `The given operation could not be fulfilled as the selected column ${sortedColumn} given was incorrect`,
    };
  } else {
    const validSortOrder =
      sortOrder && allowedSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : "ASC";

    const validSortedColumn = sortedColumn || "staffId";

    let baseQuery = `
      WITH StaffFilteredByCompanyEntity AS (
        SELECT
          StaffId, BBDUserName, UserPrincipleName, DisplayName,
          JobTitle, EntityDescription, Department, Manager
        FROM DecoratedStaff
        WHERE
          CompanyEntityId IN (SELECT value FROM STRING_SPLIT(@EntityIds, ','))
          AND StaffStatus <> 'terminated'
      )
      SELECT
          s.StaffId, s.BBDUserName, s.UserPrincipleName as upn, s.DisplayName,
          s.JobTitle, s.EntityDescription, s.Department, s.Manager,
          FORMAT(skl.LastVisited, 'yyyy-MM-dd') AS LastVisited,
          FORMAT(skl.LastModified, 'yyyy-MM-dd') AS LastModified
      FROM StaffFilteredByCompanyEntity as s
      LEFT JOIN SkillsLastUsed as skl
          ON skl.StaffId = s.StaffId
      WHERE
      s.StaffId ${inArray ? "" : "NOT"} IN (SELECT value FROM STRING_SPLIT(@StaffIds, ','))
      AND (@StaffNameSearchText IS NULL OR s.DisplayName LIKE '%' + @StaffNameSearchText + '%')
    `;

    const orderBySubqueries: { [key: string]: string } = {
      displayName: "ORDER BY s.DisplayName",
      upn: "ORDER BY s.UserPrincipleName",
      staffId: "ORDER BY s.StaffId",
      jobTitle: "ORDER BY s.JobTitle",
      manager: "ORDER BY s.Manager",
      department: "ORDER BY s.Department",
      lastModified: "ORDER BY LastModified",
      lastVisited: "ORDER BY LastVisited",
      entityDescription: "ORDER BY EntityDescription",
    };

    const orderByClause = orderBySubqueries[validSortedColumn] + " " + validSortOrder;

    const paginationClause = `
    OFFSET @StartPage ROWS
    FETCH NEXT @PageLength ROWS ONLY;
    `;
    baseQuery += searchDate ? "AND (skl.LastModified < @SearchDate) " : "";

    const fullQuery = baseQuery + orderByClause + paginationClause;

    const request = await db();
    const staffIdsString = staffIds.join(",");
    const entityIds = companyEntityIds.join(",");
    const result = await request
      .input("StaffIds", staffIdsString)
      .input("EntityIds", entityIds)
      .input("StartPage", startIndex ? startIndex * pageLength : 0)
      .input("PageLength", pageLength ? pageLength : staffIds.length)
      .input("SearchDate", searchDate)
      .input("StaffNameSearchText", staffNameSearchText)
      .timed_query(fullQuery, "getStaffDetailsByStaffIds");

    return fixCase(result.recordset) as DecoratedStaff[];
  }
}

export async function getAllStaffDetailsByStaffIds(
  db: () => Promise<SqlRequest>,
  staffIds: number[],
  inArray: boolean,
  startIndex?: number,
  pageLength?: number,
  sortedColumn?: keyof DecoratedStaff,
  sortOrder?: string,
  staffNameSearchText? : string,
): Promise<DecoratedStaff[]> {
  const allowedSortColumns: string[] = [
    "displayName",
    "email",
    "staffId",
  ];

  const allowedSortOrders: string[] = ["ASC", "DESC"];

  if (
    (sortedColumn && !allowedSortColumns.includes(sortedColumn)) ||
    (sortOrder && !allowedSortOrders.includes(sortOrder.toUpperCase()))
  ) {
    throw new Error(`The given operation could not be fulfilled as the selected column ${sortedColumn} given was incorrect. Columns allowed for sorting on Pending Proof Validation table are: Staff Name and Staff Email`);
  } else {
    const validSortOrder =
      sortOrder && allowedSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : "ASC";

    const validSortedColumn = sortedColumn || "staffId";
    const query = `
    SELECT
      s.StaffId,
      s.BBDUserName,
      s.UserPrincipleName as upn,
      s.DisplayName,
      s.JobTitle,
      s.Department,
      s.Manager,
      FORMAT(skl.LastVisited, 'yyyy-MM-dd') AS LastVisited,
      FORMAT(skl.LastModified, 'yyyy-MM-dd') AS LastModified
      FROM StaffWithActiveDepartment AS s
      LEFT JOIN SkillsLastUsed AS skl
      ON skl.StaffId = s.StaffId
      WHERE ${inArray ? "" : "NOT"} EXISTS (
        SELECT 1
        FROM STRING_SPLIT(@StaffIds, ',') AS staff
        WHERE TRY_CAST(staff.value AS INT) = s.StaffId
      )
      AND s.StaffStatus <> 'terminated'
      AND (@StaffNameSearchText IS NULL OR s.DisplayName LIKE '%' + @StaffNameSearchText + '%')
    `;

     const orderBySubqueries: { [key: string]: string } = {
      displayName: "ORDER BY s.DisplayName",
      email: "ORDER BY s.UserPrincipleName",
      staffId: "ORDER BY s.StaffId",
    };

    const orderByClause = orderBySubqueries[validSortedColumn] + " " + validSortOrder;
    const paginationClause = `
      OFFSET @StartPage ROWS
      FETCH NEXT @PageLength ROWS ONLY;
    `;

    const fullQuery = query + orderByClause + paginationClause;
    const request = await db();
    const staffIdsString = staffIds.join(",");
    const result = await request
      .input("StaffIds", staffIdsString)
      .input("StartPage", startIndex * pageLength || 0)
      .input("PageLength", pageLength || staffIds.length)
      .input("StaffNameSearchText", staffNameSearchText || '')
      .timed_query(fullQuery, "getAllStaffDetailsByStaffIds");
    return fixCase(result.recordset) as DecoratedStaff[];
  }
  
}

export async function getStaffDetails(db: () => Promise<SqlRequest>, staffId: number): Promise<DecoratedStaff> {
  const query = `
SELECT
	ds.StaffId,
	ds.BBDUserName,
	ds.UserPrincipleName as upn,
	ds.DisplayName,
	ds.JobTitle,
	ds.Department,
	ds.Manager,
  ds.Nationality,
  ds.Residence,
  ds.DateOfBirth
FROM DecoratedStaff ds
WHERE ds.StaffId = @StaffId
  AND ds.StaffStatus <> 'terminated'
  `;

  const request = await db();
  const result = await request.input("StaffId", staffId).timed_query(query, "getStaffDetails");
  return fixCase(result.recordset)[0] as DecoratedStaff;
}

export async function getUserAttributes(gremlin: gremlin.driver.Client, staffId: number, attributeType?: AttributeType) {
  const includeAttributeTypeFilter = attributeType?`
    .where(
      __.inV()
        .repeat(__.outE('is-a').inV())
        .until(__.hasLabel('topLevelTag'))
        .has('identifier', attributeType))` : '';

  const query = `
    g.V()
      .has('person', 'identifier', staffId)
      .outE('has')
      ${includeAttributeTypeFilter}
      .project('edgeId', 'attributeId', 'attribute', 'attributeType', 'attributesDetails', 'needsRatification')
        .by(id())
        .by(inV().id())
        .by(inV().values('identifier'))
            .by(inV().repeat(out())
            .until(hasLabel('topLevelTag').and().outE('has-field'))
            .values('identifier')
          )
        .by(
          valueMap()
            .unfold()
            .map(
              project('standardizedName', 'value')
                .by(select(keys))
                .by(select(values).unfold())
            )
            .fold()
        )
        .by(
          choose(
            inV().outE('is-a').inV().hasLabel('new'),
            constant(true),
            constant(false)
          )
        )
  `;
  const input = {
    staffId: staffId,
    attributeType: attributeType,
  };
  const resultPromise = gremlin.submit(query, input);
  const result = await resultPromise;
  return result._items;
}

export async function getUserAttributesByPagination(
  gremlin: gremlin.driver.Client,
  startIndex: number,
  pageLength: number,
): Promise<
  {
    guid: Guid;
    staffId: number;
    canonicalNameGuid: string;
    standardizedName: string;
    attributeType: AttributeType;
    fieldValues: FieldValue[];
    needsRatification: boolean;
  }[]
> {
  const maxResultLength = startIndex + pageLength;

  const query = `
    g.V()
      .hasLabel('person')
      .outE('has')
      .range(startResultIndex, maxResultLength)
      .project('staffId', 'guid', 'canonicalNameGuid', 'standardizedName', 'attributeType', 'fieldValues', 'needsRatification')
        .by(outV().values('identifier'))
        .by(id())
        .by(inV().id())
        .by(inV().values('identifier'))
        .by(inV()
            .repeat(out())
            .until(hasLabel('topLevelTag').and().outE('has-field'))
            .values('identifier')
            .dedup())
        .by(
          valueMap()
            .unfold()
            .map(
              project('standardizedName', 'value')
                .by(select(keys))
                .by(select(values).unfold())
            )
            .fold()
        )
        .by(choose(
              inV().outE('is-a').inV().hasLabel('new'),
              constant(true),
              constant(false)))
  `;
  const input = {
    startResultIndex: startIndex,
    maxResultLength: maxResultLength,
  };
  const resultPromise = gremlin.submit(query, input);
  const result = await resultPromise;
  return result._items;
}

export async function getStaffIdsConnectedToAttribute(
  gremlin: gremlin.driver.Client,
  attributeId: string,
): Promise<number[]> {
  const query = `
    g.V(attributeId)
      .inE('has')
      .outV()
      .hasLabel('person')
      .values('identifier')
  `;
  const input = {
    attributeId: attributeId,
  };
  const resultPromise = gremlin.submit(query, input);
  const result = await resultPromise;
  return result._items;
}

export async function getUserDetailsByStaffIds(
  db: () => Promise<SqlRequest>,
  staffIds: number[],
): Promise<{ staffId: number; upn: string; displayName: string }[]> {
  const query = `
    SELECT StaffId, UserPrincipleName AS upn, DisplayName
    FROM Staff s
    WHERE s.StaffId IN (
        SELECT CAST(value AS INT)
        FROM STRING_SPLIT(@StaffIds, ',')
    );
  `;
  const request = await db();
  const result = await request.input("StaffIds", staffIds.join(",")).timed_query(query, "getStaffIds");
  return fixCase(result.recordset) as { staffId: number; upn: string; displayName: string }[];
}

export async function doesEdgeExistForUser(
  gremlin: gremlin.driver.Client,
  staffId: number,
  edgeId: string,
): Promise<boolean> {
  const query = `
    g.E(edgeId).where(outV().has('person', 'identifier', staffId))
  `;
  const input = {
    staffId,
    edgeId,
  };

  const result = await gremlin.submit(query, input);
  return result._items.length > 0;
}

export async function isEdgeAnAttributeForUser(
  gremlin: gremlin.driver.Client,
  attributeEdgeGuid: Guid,
  staffId: number,
): Promise<boolean> {
  const query = `
    g.E(guid).outV().has('identifier',staffId)
  `;
  const input = {
    attributeEdgeGuid,
    staffId,
  };
  const result = await gremlin.submit(query, input);
  return result._items.length > 0;
}

export async function getEdgeById(
  gremlin: gremlin.driver.Client,
  edgeId: string,
): Promise<{
  guid: Guid;
  staffId: number;
  canonicalNameGuid: string;
  standardizedName: string;
  attributeType: AttributeType;
  fieldValues: FieldValue[];
  needsRatification: boolean;
}> {
  const query = `
      g.V()
      .hasLabel('person')
      .outE()
      .hasId(edgeId)
      .project('staffId', 'guid', 'canonicalNameGuid', 'standardizedName', 'attributeType', 'fieldValues', 'needsRatification')
        .by(outV().values('identifier'))
        .by(id())
        .by(inV().id())
        .by(inV().values('identifier'))
        .by(inV()
            .repeat(out())
            .until(hasLabel('topLevelTag').and().outE('has-field'))
            .values('identifier')
            .dedup())
        .by(
          valueMap()
            .unfold()
            .map(
              project('standardizedName', 'value')
                .by(select(keys))
                .by(select(values).unfold())
            )
            .fold()
        )
        .by(choose(
              inV().outE('is-a').inV().hasLabel('new'),
              constant(true),
              constant(false)))
  `;
  const input = {
    edgeId,
  };
  return (await gremlin.submit(query, input))._items[0];
}

export async function updateSkillsLastModifiedForUser(
  tx: SqlTransaction,
  staffId: number,
): Promise<SkillsLastUsedDetails[]> {
  const query = `
    UPDATE SkillsLastUsed
    SET LastModified = GETDATE()
    OUTPUT INSERTED.StaffId, INSERTED.LastModified ,INSERTED.LastVisited
    WHERE StaffId = @StaffId;
  `;
  const connection = await tx.timed_request();
  const result = await connection.input("StaffId", staffId).timed_query(query, "updateSkillsLastModifiedForUser");
  const updatedRow = result.recordset;
  return fixCase(updatedRow as StaffLastUsedDetailsRecord[]);
}

export async function updateUserLastVisitedIfNotUpdatedToday(db: () => Promise<SqlRequest>, staffId: number) {
  const query = `
    MERGE INTO SkillsLastUsed AS Target
    USING (SELECT @StaffId AS StaffId) AS source
    ON Target.StaffId = source.StaffId
    WHEN MATCHED AND CAST(Target.LastVisited AS DATE) <> CAST(GETDATE() AS DATE)
      THEN UPDATE SET Target.LastVisited = GETDATE()
    WHEN NOT MATCHED BY TARGET
      THEN INSERT (StaffId, LastVisited) VALUES (@StaffId, GETDATE());
  `;

  const request = await db();
  await request.input("StaffId", staffId).timed_query(query, "updateUserLastUsedIfNotUpdatedToday");
}

export async function getUsersConnectedToAttribute(
  gremlin: gremlin.driver.Client,
  attribute: Attribute,
): Promise<{ staffId: number; fieldValues: Pick<FieldValue, "value" | "standardizedName">[] }[]> {
  const query = `
    g.V().has('identifier',standardizedName)
      .inE('has')
      .project('staffId', 'fieldValues')
        .by(outV().values('identifier'))
        .by(properties().project('standardizedName', 'value')
        .by(key())
        .by(value())
        .fold()
    )
    `;
  const input = {
    standardizedName: attribute.standardizedName,
  };
  const result = await gremlin.submit(query, input);
  return result._items;
}

export async function isAttributeAlreadyAddedForUser(
  gremlin: gremlin.driver.Client,
  attribute: StandardizedName,
  staffId: Staff["staffId"],
): Promise<boolean> {
  const query = `g.V().has('identifier',staffId).outE('has').where(inV().has('identifier',attribute))`;
  const input = { attribute, staffId };
  const result = await gremlin.submit(query, input);
  return result._items.length > 0;
}

export async function retrieveMetaDataTagsForAttributeOrInstitution(
  gremlin: gremlin.driver.Client,
  standardizedNameForAttributeOrInstitution: StandardizedName,
): Promise<string[]> {
  const query = `g.V().has('identifier',standardizedNameForAttributeOrInstitution)
                .repeat(out()).until(hasLabel('metaDataTag')).values('identifier')`;
  const input = { standardizedNameForAttributeOrInstitution };
  const result = await gremlin.submit(query, input);
  return result._items;
}

export async function addUserToGraphIfNotAdded(
  gremlin: gremlin.driver.Client,
  staffId: Staff["staffId"],
): Promise<void> {
  const query = `g.V().has('person', 'identifier', staffId)
        .fold().coalesce(unfold(), addV('person')
        .property('identifier', staffId))`;
  const input = { staffId };
  await gremlin.submit(query, input);
}

export async function addUserAttributeIfNotAddedOrIfRepeatable(
  gremlin: gremlin.driver.Client,
  userAttributeToAdd: Partial<UserAttribute>,
  staffId: number,
): Promise<UserAttribute> {
  const input = {
    staffId,
    attribute: userAttributeToAdd.attribute.standardizedName,
    addedAt: new Date().toISOString(),
  };

  let addPropertiesToEdgeQuery = "";
  for (const field of userAttributeToAdd.fieldValues) {
    input[field.standardizedName] = field.value;
    addPropertiesToEdgeQuery += `.property('${field.standardizedName}', ${field.standardizedName})`;
  }

  const alreadyAdded = await isAttributeAlreadyAddedForUser(
    gremlin,
    userAttributeToAdd.attribute.standardizedName,
    staffId,
  );
  const isRepeatable = (
    await retrieveMetaDataTagsForAttributeOrInstitution(gremlin, userAttributeToAdd.attribute.standardizedName)
  ).includes("repeatable");

  let edgeId: Guid;
  if (alreadyAdded && !isRepeatable) {
    edgeId = await retrieveEdgeGuidForUserAttribute(gremlin, userAttributeToAdd.attribute.standardizedName, staffId);
  } else {
    const query = `
      g.V().has('identifier', staffId)
      .addE('has').to(g.V().has('identifier', attribute))${addPropertiesToEdgeQuery}
      .property('addedAt', addedAt)
      .id()`;

    await addUserToGraphIfNotAdded(gremlin, staffId);
    const result = await gremlin.submit(query, input);
    edgeId = result._items[0];
  }

  return { ...userAttributeToAdd, guid: edgeId } as UserAttribute;
}

export async function retrieveEdgeGuidForUserAttribute(
  gremlin: gremlin.driver.Client,
  standardizedName: StandardizedName,
  staffId: Staff["staffId"],
): Promise<Guid> {
  const query = `g.V().has('identifier', staffId)
    .outE('has')
    .where(inV().has('identifier', standardizedName))
    .id()`;
  const input = {
    standardizedName,
    staffId,
  };
  const result = await gremlin.submit(query, input);
  return result._items[0];
}

export async function editUserAttribute(
  gremlin: gremlin.driver.Client,
  userAttribute: UserAttribute,
): Promise<UserAttribute | BadRequestDetail> {
  const input = {
    edgeId: userAttribute.guid,
  };

  const allowedFieldNames = (await getSkillRequiredFields(gremlin, userAttribute.attribute.canonicalNameGuid)).map(
    (requiredField) => requiredField.name,
  );

  let updateEdgePropertiesQuery = "";
  const invalidFieldNames: string[] = [];
  for (const field of userAttribute.fieldValues) {
    const fieldName = allowedFieldNames.find((fieldName) => fieldName === field.standardizedName);
    if (fieldName) {
      const fieldNameValue = `${fieldName}Value`;
      updateEdgePropertiesQuery += `.property('${fieldName}', ${fieldNameValue})`;
      input[fieldNameValue] = field.value;
    } else {
      invalidFieldNames.push(field.standardizedName);
    }
  }

  if (invalidFieldNames.length !== 0) {
    return {
      message: `${invalidFieldNames} are invalid field names. Please input a valid field from ${allowedFieldNames}`,
    };
  } else {
    const query = `g.E(edgeId)${updateEdgePropertiesQuery}.properties().project("standardizedName","value").by(key()).by(value())`;
    const result = await gremlin.submit(query, input);
    return { ...userAttribute, fieldValues: result._items };
  }
}

export async function isAttributeAlreadyAddedAsCoreTech(
  gremlin: gremlin.driver.Client,
  userAttribute: UserAttribute,
): Promise<boolean> {
  const query = `g.E(edgeId).has('coreTechAddedBy').has('coreTechAddedOn')`;
  const input = { edgeId: userAttribute.guid };
  const result = await gremlin.submit(query, input);
  return result._items.length > 0;
}

export async function getCoreTechCountForUser(
  gremlin: gremlin.driver.Client,
  staffId: Staff["staffId"],
): Promise<number> {
  const query = `g.V().has('identifier', staffId).outE('has').has('coreTechAddedBy').count()`;
  const input = { staffId };
  const result = await gremlin.submit(query, input);
  return result._items[0];
}

export async function addAttributeAsCoreTechForUser(
  gremlin: gremlin.driver.Client,
  userAttribute: UserAttribute,
  addedBy: Staff["staffId"],
): Promise<UserAttribute> {
  const query = `g.E(edgeId).property('coreTechAddedBy', addedBy)
                .property('coreTechAddedOn', addedOn).properties()
                .project("standardizedName","value").by(key()).by(value())`;
  const input = { edgeId: userAttribute.guid, addedOn: new Date().toISOString(), addedBy };
  const result = await gremlin.submit(query, input);
  return { ...userAttribute, fieldValues: result._items };
}

export async function removeCoreTechInformationFromAttribute(
  gremlin: gremlin.driver.Client,
  userAttribute: UserAttribute,
): Promise<UserAttribute> {
  const query = `
    g.E(edgeId)
    .sideEffect(
      properties('coreTechAddedBy', 'coreTechAddedOn')
      .drop()
    )
    .properties()
    .project("standardizedName","value")
    .by(key()).by(value())
  `;

  const input = { edgeId: userAttribute.guid };
  const fieldValues = await gremlin.submit(query, input);

  return { ...userAttribute, fieldValues: fieldValues._items };
}

export async function addAttributesAsCoreTechForUser(
  gremlin: gremlin.driver.Client,
  userAttributes: UserAttribute[],
  addedBy: Staff["staffId"],
): Promise<UserAttribute[] | BadRequestDetail> {
  const query = `
    g.E(edgeIds)
      .property('coreTechAddedBy', addedBy)
      .property('coreTechAddedOn', addedOn)
  `;

  const input = {
    edgeIds: userAttributes.map((userAttributes) => userAttributes.guid),
    addedOn: new Date().toISOString(),
    addedBy,
  };
  await gremlin.submit(query, input);
  return userAttributes;
}

export async function removeAllCoreTechForUser(
  gremlin: gremlin.driver.Client,
  staffId: Staff["staffId"],
): Promise<void> {
  const query = `
    g.V().has('identifier', staffId)
      .outE('has')
      .where(__.or(
        __.has('coreTechAddedBy'),
        __.has('coreTechAddedOn')
      ))
      .properties('coreTechAddedBy', 'coreTechAddedOn').drop()
  `;
  const input = { staffId };
  await gremlin.submit(query, input);
}

export async function retrieveOnSupplyRoles(db: () => Promise<SqlRequest>): Promise<OnSupplyRole[]> {
  const query = `
    SELECT onSupplyRoleId, role
    FROM
    OnSupplyRole
  `;

  const request = await db();
  const result = await request.timed_query(query, "retrieveOnSupplyRoles");
  return result.recordset as OnSupplyRole[];
}

export async function createStaffOnSupplyRole(
  db: () => Promise<SqlRequest>,
  staffId: number,
  roleId: number,
  addedBy: string,
): Promise<boolean> {
  const query = `
    INSERT INTO StaffOnSupplyRole (StaffOnSupplyId, OnSupplyRoleId, AddedBy, AddedOn)
    SELECT StaffOnSupplyId, @RoleId, @AddedBy, GETDATE() FROM CurrentStaffOnSupply
    WHERE StaffId = @StaffId
  `;

  const request = await db();
  const result = await request
    .input("RoleId", roleId)
    .input("StaffId", staffId)
    .input("AddedBy", addedBy)
    .timed_query(query, "createStaffOnSupplyRole");
  return result.rowsAffected.length > 0;
}

export async function retrieveGuidsOfUserAttributeEdgesFromInstitution(
  gremlin: gremlin.driver.Client,
  institutionStandardizedName: StandardizedName,
  attributeStandardizedName: StandardizedName,
):Promise<UserAttribute["guid"][]>{
  const q = `
    g.V().has('identifier', attributeStandardizedName)   
    .inE().has('obtainedFrom', institutionStandardizedName)
    .id()
  `
  const input = {
    attributeStandardizedName,
    institutionStandardizedName
  }
  const result = await gremlin.submit(q, input);
  return result._items;
}

export async function retrieveStaffWithAttributeObtainedFromInstitution(
  gremlin: gremlin.driver.Client,
  attributeStandardizedName: StandardizedName,
  institutionStandardizedName: StandardizedName
): Promise<Pick<UserAttribute, 'staffId' | 'fieldValues'>[]> {
  const query = `
    g.V().hasLabel('person')
    .outE().has('obtainedFrom', institutionStandardizedName)
      .where(
        __.inV().has('identifier', attributeStandardizedName)
      )
    .project('staffId', 'fieldValues')
      .by(__.outV().values('identifier'))
      .by(
        __.properties()
          .project('standardizedName', 'value')
            .by(__.key())
            .by(__.value())
          .fold()
      )
    `;
  const input = { institutionStandardizedName, attributeStandardizedName };
  const result = await gremlin.submit(query, input);
  return result._items;
}

export async function retrieveStaffWhoHaveNotInteractedWithSkills(
  db: () => Promise<SqlRequest>,
  skillsInactivityReminderMonths: number
): Promise<DecoratedStaff[]>{
  const query = `
    SELECT
      ds.StaffId AS staffId,
      ds.UserPrincipleName AS upn,
      ds.DisplayName AS displayName,
      ds.BBDUserName AS bbdUserName,
      ds.JobTitle AS jobTitle,
      ds.Department AS department,
      ds.entityDescription AS entityDescription,
      ds.entityAbbreviation AS entityAbbreviation,
      ds.Manager AS manager,
      slu.LastModified AS lastModified,
      slu.LastVisited AS lastVisited
    FROM DecoratedStaff ds
    INNER JOIN SkillsLastUsed slu
      ON ds.StaffId = slu.StaffId
    LEFT JOIN SkillsCommunication sc
      ON ds.StaffId = sc.StaffId
    WHERE
      slu.LastModified < DATEADD(MONTH, -@skillsInactivityReminderMonths, GETDATE())
      AND (sc.SentAt IS NULL OR sc.SentAt < DATEADD(MONTH, -@skillsInactivityReminderMonths, GETDATE()));
  `

  const request = await db();
  const result = await request
  .input("skillsInactivityReminderMonths", skillsInactivityReminderMonths)
  .timed_query(query, "retrieveStaffWhoHaveNotInteractedWithSkills");
  return result.recordset as DecoratedStaff[];
}

export async function getPendingProofValidations(
  gremlin: gremlin.driver.Client
): Promise<PendingProofValidation[]>{
  const q = `
   g.V().hasLabel('person').as('staffId')
  .outE('has').as('hasEdge')
  .has('proof', P.neq('NoFile'))
  .hasNot('uploadVerifiedBy')
  .as('edge')
  .inV().as('qualification')
  .select('staffId', 'qualification', 'edge')
    .by('identifier')
    .by('identifier')
    .by(project('proofFile', 'guid')
         .by('proof')
         .by(T.id))
  .project('staffId', 'qualification', 'proofFile', 'guidOfEdgeRequiringValidation')
    .by(select('staffId'))
    .by(select('qualification'))
    .by(select('edge').select('proofFile'))
    .by(select('edge').select('guid'))
  `
  const result = await gremlin.submit(q);
  return result._items;
}

export async function updateQualificationEdgeProperty(
  gremlin: gremlin.driver.Client,
  edgeId: string, 
  propertyValue: string,
): Promise<boolean | BadRequestDetail>{
  const query = `g.E('${edgeId}').property('uploadVerifiedBy', '${propertyValue}') `;
  try {
    const result = await gremlin.submit(query);
    return result._items.length > 0;
  }catch (error){
    return {
      message: "Gremlin query execution failed",
      detail: error.message,
    }
  }
}