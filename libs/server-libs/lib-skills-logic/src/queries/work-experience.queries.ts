import { fixCase } from "@the-hive/lib-core";
import { SqlRequest, SqlTransaction } from "@the-hive/lib-db";
import { WorkExperience, WorkExperienceOutcome, WorkExperienceRole, WorkExperienceSector, WorkExperienceTechnology, WorkExperienceUpdate } from "@the-hive/lib-skills-shared";

export async function createWorkExperience(tx: SqlTransaction, workExperience: WorkExperienceUpdate, sectorId: number, roleId: number): Promise<number> {
  const query = `
  INSERT INTO [WorkExperience]
    (StaffId,CompanyName,WorkExperienceSectorId,WorkExperienceRoleId,StartDate,EndDate,BBDExperience,ProjectDescription)
  OUTPUT INSERTED.WorkExperienceId
  VALUES
    (@StaffId,@CompanyName,@WorkExperienceSectorId,@WorkExperienceRoleId,@StartDate,@EndDate,@BBDExperience,@ProjectDescription)
  `;
  const connection = await tx.timed_request();
  const result = await connection
    .input('StaffId', workExperience.staffId)
    .input('CompanyName', workExperience.companyName)
    .input('WorkExperienceSectorId', sectorId)
    .input('WorkExperienceRoleId', roleId)
    .input('StartDate', workExperience.startDate)
    .input('EndDate', workExperience.endDate)
    .input('BBDExperience', workExperience.bbdExperience)
    .input('ProjectDescription', workExperience.projectDescription)
    .timed_query(query, "createWorkExperience");
  const resultSet = (result.recordset as {WorkExperienceId: number}[]);
  return resultSet[0].WorkExperienceId;
}


export async function readWorkExperienceOutcomes(db: () => Promise<SqlRequest>, workExperience: WorkExperience):Promise<WorkExperienceOutcome[]> {
  const query = `
  SELECT WorkExperienceOutcomeId,WorkExperienceId,Body,[Order]
  FROM WorkExperienceOutcome
  WHERE WorkExperienceId = @WorkExperienceId
  ORDER BY [Order]
  `;
  const connection = await db();
  const result = await connection
    .input('WorkExperienceId', workExperience.workExperienceId)
    .timed_query(query, 'readWorkExperienceOutcomes')
  const resultSet = fixCase(result.recordset) as WorkExperienceOutcome[];
  return resultSet;
}

export async function readWorkExperienceTechnologies(db: () => Promise<SqlRequest>, workExperience: WorkExperience): Promise<WorkExperienceTechnology[]> {
  const query = `
  SELECT wet.WorkExperienceTechnologyId,wet.WorkExperienceId,wet.CanonicalNameId,cn.StandardizedName,wet.[Order], cn.CanonicalName
  FROM WorkExperienceTechnology wet
  INNER JOIN CanonicalNames cn ON wet.CanonicalNameId = cn.CanonicalNamesId
  WHERE WorkExperienceId = @WorkExperienceId
  ORDER BY [Order]
  `;
  const connection = await db();
  const result = await connection
    .input('WorkExperienceId', workExperience.workExperienceId)
    .timed_query(query, 'readWorkExperienceTechnologies')
  const resultSet = fixCase(result.recordset) as WorkExperienceTechnology[];
  return resultSet;
}

export async function readWorkExperienceByStaffId(db: () => Promise<SqlRequest>, staffId: number): Promise<WorkExperience[]> {
  const query = `
  SELECT we.WorkExperienceId,we.StaffId,we.CompanyName,wes.SectorName,wer.RoleName,we.StartDate,we.EndDate,we.BbdExperience,we.ProjectDescription
  FROM WorkExperience we
  LEFT JOIN WorkExperienceSectors wes ON we.WorkExperienceSectorId = wes.WorkExperienceSectorId
  LEFT JOIN WorkExperienceRoles wer ON we.WorkExperienceRoleId = wer.WorkExperienceRoleId
  WHERE we.StaffId = @StaffId
  ORDER BY we.StartDate DESC
  `;
  const connection = await db();
  const result = await connection
    .input('StaffId', staffId)
    .timed_query(query, "readWorkExperienceByStaffId")
  const resultSet = fixCase(result.recordset) as WorkExperience[];
  return resultSet;
}

export async function readWorkExperienceById(db: () => Promise<SqlRequest>, workExperienceId: number): Promise<WorkExperience> {
  const query = `
  SELECT we.WorkExperienceId,we.StaffId,we.CompanyName,wes.SectorName,wer.RoleName,we.StartDate,we.EndDate,we.BbdExperience,we.ProjectDescription
  FROM WorkExperience we
  LEFT JOIN WorkExperienceSectors wes ON we.WorkExperienceSectorId = wes.WorkExperienceSectorId
  LEFT JOIN WorkExperienceRoles wer ON we.WorkExperienceRoleId = wer.WorkExperienceRoleId
  WHERE we.WorkExperienceId = @WorkExperienceId
  `;
  const connection = await db();
  const result = await connection
    .input('WorkExperienceId', workExperienceId)
    .timed_query(query, "readWorkExperienceById")
  const resultSet = fixCase(result.recordset) as WorkExperience[];
  return resultSet[0];
}

export async function updateWorkExperience(
    tx: SqlTransaction,
    staffId: number,
    workExperienceId: number,
    workExperience: WorkExperienceUpdate,
    sectorId: number,
    roleId: number
  ): Promise<void> {
  const query = `
  IF EXISTS(SELECT 1 FROM WorkExperience WHERE WorkExperienceId = @WorkExperienceId AND StaffId = @StaffId)
  BEGIN
  UPDATE WorkExperience
   SET CompanyName = @CompanyName
      ,WorkExperienceSectorId = @WorkExperienceSectorId
      ,WorkExperienceRoleId = @WorkExperienceRoleId
      ,StartDate = @StartDate
      ,EndDate = @EndDate
      ,BbdExperience = @BbdExperience
      ,ProjectDescription = @ProjectDescription
  WHERE WorkExperienceId = @WorkExperienceId
  END
  `;
  const connection = await tx.timed_request();
  await connection
    .input('WorkExperienceId', workExperienceId)
    .input('CompanyName', workExperience.companyName)
    .input('WorkExperienceSectorId', sectorId)
    .input('WorkExperienceRoleId', roleId)
    .input('StartDate', workExperience.startDate)
    .input('EndDate', workExperience.endDate)
    .input('BbdExperience', workExperience.bbdExperience)
    .input('ProjectDescription', workExperience.projectDescription)
    .input('StaffId', staffId)
    .timed_query(query, "updateWorkExperience");
};

export async function deleteWorkExperience(tx: SqlTransaction, staffId: number, workExperienceId: number): Promise<void> {
  const query = `
  IF EXISTS(SELECT * FROM WorkExperience WHERE WorkExperienceId = @WorkExperienceId AND StaffId = @StaffId)
  BEGIN
    DELETE FROM WorkExperience WHERE WorkExperienceId = @WorkExperienceId
  END
  `;
  const connection = await tx.timed_request();
  await connection
    .input('WorkExperienceId', workExperienceId)
    .input('StaffId', staffId)
    .timed_query(query, "deleteWorkExperience");
};

export async function createWorkExperienceOutcome(tx: SqlTransaction, staffId: number, workExperienceId: number, workExperienceDetail: WorkExperienceOutcome): Promise<void> {
  const query = `
  IF EXISTS(SELECT 1 FROM WorkExperience WHERE WorkExperienceId = @WorkExperienceId AND StaffId = @StaffId)
  BEGIN
  INSERT INTO WorkExperienceOutcome
           (WorkExperienceId,Body,[Order])
     VALUES
           (@WorkExperienceId,@Body,@Order)
  END
  `;
  const connection = await tx.timed_request();
  await connection
    .input('WorkExperienceId', workExperienceId)
    .input('Body', workExperienceDetail.body)
    .input('Order', workExperienceDetail.order)
    .input('StaffId', staffId)
    .timed_query(query, 'createWorkExperienceOutcome');
}

export async function updateWorkExperienceOutcome(tx: SqlTransaction, workExperienceDetail: WorkExperienceOutcome): Promise<void> {
  const query = `
  BEGIN
  UPDATE WorkExperienceOutcome
           SET Body = @Body,
           [Order] = @Order
     WHERE WorkExperienceOutcomeId = @WorkExperienceOutcomeId
  END
  `;
  const connection = await tx.timed_request();
  await connection
    .input('Body', workExperienceDetail.body)
    .input('Order', workExperienceDetail.order)
    .input('WorkExperienceOutcomeId', workExperienceDetail.workExperienceOutcomeId)
    .timed_query(query, 'updateWorkExperienceOutcome');
}

export async function deleteWorkExperienceOutcome(tx: SqlTransaction, workExperienceOutcomeId: number): Promise<void> {
  const query = `
  BEGIN
    DELETE FROM WorkExperienceOutcome WHERE WorkExperienceOutcomeId = @WorkExperienceOutcomeId
  END
  `;
  const connection = await tx.timed_request();
  await connection
    .input('WorkExperienceOutcomeId', workExperienceOutcomeId)
    .timed_query(query, "deleteWorkExperienceOutcome");
};

export async function createWorkExperienceTechnology(tx: SqlTransaction, staffId: number, workExperienceId: number, workExperienceTech: WorkExperienceTechnology): Promise<void> {
  const query = `
  IF EXISTS(SELECT 1 FROM WorkExperience WHERE WorkExperienceId = @WorkExperienceId AND StaffId = @StaffId)
  BEGIN
  INSERT INTO WorkExperienceTechnology
           (WorkExperienceId,CanonicalNameId,[Order])
     SELECT @WorkExperienceId, cn.CanonicalNamesId, @Order
     FROM CanonicalNames cn WHERE StandardizedName = @StandardizedName
  END
  `;
  const connection = await tx.timed_request();
  await connection
    .input('WorkExperienceId', workExperienceId)
    .input('StandardizedName', workExperienceTech.standardizedName)
    .input('Order', workExperienceTech.order)
    .input('StaffId', staffId)
    .timed_query(query, 'createWorkExperienceTechnology');
}

export async function updateWorkExperienceTechnology(tx: SqlTransaction, workExperienceDetail: WorkExperienceTechnology): Promise<void> {
  const query = `
  BEGIN
  UPDATE WorkExperienceTechnology
           SET CanonicalNameId = @CanonicalNameId,
           [Order] = @Order
     WHERE WorkExperienceOutcomeId = @WorkExperienceOutcomeId
  END
  `;
  const connection = await tx.timed_request();
  await connection
    .input('CanonicalNameId', workExperienceDetail.canonicalNameId)
    .input('Order', workExperienceDetail.order)
    .input('WorkExperienceTechnologyId', workExperienceDetail.workExperienceTechnologyId)
    .timed_query(query, 'updateWorkExperienceTechnology');
}

export async function deleteWorkExperienceTechnology(tx: SqlTransaction, workExperienceTechnologyId: number): Promise<void> {
  const query = `
  BEGIN
    DELETE FROM WorkExperienceTechnology WHERE WorkExperienceTechnologyId = @WorkExperienceTechnologyId
  END
  `;
  const connection = await tx.timed_request();
  await connection
    .input('WorkExperienceTechnologyId', workExperienceTechnologyId)
    .timed_query(query, "deleteWorkExperienceTechnology");
};


export async function readWorkExperienceRoles(db: () => Promise<SqlRequest>): Promise<WorkExperienceRole[]> {
  const query = `
  SELECT WorkExperienceRoleId
      ,RoleName
      ,ApprovedBy
      ,ApprovedAt
  FROM WorkExperienceRoles
  `;
  const connection = await db();
  const result = await connection
    .timed_query(query, 'readWorkExperienceRoles');
  const resultSet = fixCase(result.recordset) as WorkExperienceRole[];
  return resultSet;
}

export async function approveWorkExperienceRole(tx: SqlTransaction, workExperienceRoleId: number, upn: string) {
  const query = `
  UPDATE WorkExperienceRoles
  SET ApprovedBy = @ApprovedBy
    ,ApprovedAt = GETDATE()
  WHERE WorkExperienceRoleId = @WorkExperienceRoleId
  `;
  const connection = await tx.timed_request();
  await connection
    .input('WorkExperienceRoleId', workExperienceRoleId)
    .input('ApprovedBy', upn)
    .timed_query(query, 'approveWorkExperienceRole');
}

export async function deleteWorkExperienceRole(tx: SqlTransaction, workExperienceRoleId: number): Promise<void> {
  const query = `
  IF EXISTS(SELECT 1 FROM WorkExperienceRoles WHERE WorkExperienceRoleId = @WorkExperienceRoleId)
  BEGIN
    DELETE FROM WorkExperience WHERE WorkExperienceRoleId = @WorkExperienceRoleId
  END
  `;
  const connection = await tx.timed_request();
  await connection
    .input('WorkExperienceRoleId', workExperienceRoleId)
    .timed_query(query, "deleteWorkExperienceRole");
};

export async function getOrCreateWorkExperienceRole(tx: SqlTransaction, name: string): Promise<number> {
const query = `
  MERGE INTO WorkExperienceRoles AS Target
  USING (SELECT @RoleName AS RoleName) AS source
  ON Target.RoleName = source.RoleName
  WHEN NOT MATCHED BY TARGET
  THEN Insert(RoleName, ApprovedBy, ApprovedAt) VALUES (Source.RoleName, NULL, NULL);

  SELECT WorkExperienceRoleId FROM WorkExperienceRoles WHERE RoleName = @RoleName;
`
  const connection = await tx.timed_request();
  const result = await connection
    .input('RoleName', name)
    .timed_query(query, "getOrCreateWorkExperienceRole");
  const resultSet = (result.recordset as {WorkExperienceRoleId: number}[]);
  return resultSet[0].WorkExperienceRoleId;
}

export async function readWorkExperienceSectors(db: () => Promise<SqlRequest>): Promise<WorkExperienceSector[]> {
  const query = `
  SELECT WorkExperienceSectorId
      ,SectorName
      ,ApprovedBy
      ,ApprovedAt
  FROM WorkExperienceSectors
  `;
  const connection = await db();
  const result = await connection
    .timed_query(query, 'readWorkExperienceSectors');
  const resultSet = fixCase(result.recordset) as WorkExperienceSector[];
  return resultSet;
}

export async function approveWorkExperienceSector(tx: SqlTransaction, workExperienceSectorId: number, upn: string) {
  const query = `
  UPDATE WorkExperienceSectors
  SET ApprovedBy = @ApprovedBy
    ,ApprovedAt = GETDATE()
  WHERE WorkExperienceSectorId = @WorkExperienceSectorId
  `;
  const connection = await tx.timed_request();
  await connection
    .input('WorkExperienceSectorId', workExperienceSectorId)
    .input('ApprovedBy', upn)
    .timed_query(query, 'approveWorkExperienceSector');
}

export async function deleteWorkExperienceSector(tx: SqlTransaction, workExperienceSectorId: number): Promise<void> {
  const query = `
  IF EXISTS(SELECT 1 FROM WorkExperienceSectors WHERE WorkExperienceSectorId = @WorkExperienceSectorId)
  BEGIN
    DELETE FROM WorkExperience WHERE WorkExperienceSectorId = @WorakExperienceSectorId
  END
  `;
  const connection = await tx.timed_request();
  await connection
    .input('WorkExperienceSectorId', workExperienceSectorId)
    .timed_query(query, "deleteWorkExperienceSector");
};

export async function getOrCreateWorkExperienceSector(tx: SqlTransaction, name: string): Promise<number> {
const query = `
  MERGE INTO WorkExperienceSectors AS Target
  USING (SELECT @SectorName AS SectorName) AS source
  ON Target.SectorName = source.SectorName
  WHEN NOT MATCHED BY TARGET
  THEN Insert(SectorName, ApprovedBy, ApprovedAt) VALUES (Source.SectorName, NULL, NULL);

  SELECT WorkExperienceSectorId FROM WorkExperienceSectors WHERE SectorName = @SectorName;
`
  const connection = await tx.timed_request();
  const result = await connection
    .input('SectorName', name)
    .timed_query(query, "getOrCreateWorkExperienceSector");
  const resultSet = (result.recordset as {WorkExperienceSectorId: number}[]);
  return resultSet[0].WorkExperienceSectorId;
}

export async function addNewWorkExperienceRole(tx: SqlTransaction, roleName: string): Promise<WorkExperienceRole> {
  const query = `
  INSERT INTO WorkExperienceRoles (RoleName)
  OUTPUT 
    INSERTED.WorkExperienceRoleId AS workExperienceRoleId,
    INSERTED.RoleName AS roleName
  VALUES (@RoleName);
  `;
  const connection = await tx.timed_request();
  const result = await connection
    .input('RoleName', roleName)
    .timed_query(query, "addNewWorkExperienceRole");
  return result.recordset[0] as WorkExperienceRole;
}

export async function addNewWorkExperienceSector(tx: SqlTransaction, sectorName: string): Promise<WorkExperienceSector> {
  const query = `
  INSERT INTO WorkExperienceSectors (SectorName)
  OUTPUT 
    INSERTED.WorkExperienceSectorId AS workExperienceSectorId,
    INSERTED.SectorName AS sectorName
  VALUES (@SectorName);
  `;
  const connection = await tx.timed_request();
  const result = await connection
    .input('SectorName', sectorName)
    .timed_query(query, "addNewWorkExperienceSector");
  return result.recordset[0] as WorkExperienceSector;
}