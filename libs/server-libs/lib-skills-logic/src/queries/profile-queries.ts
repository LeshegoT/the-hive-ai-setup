import { SqlRequest, SqlTransaction } from "@the-hive/lib-db";
import { SkillsProfile } from "@the-hive/lib-skills-shared";

export const insertSkillsProfile = async (transaction: SqlTransaction, staffId: number, profile: string, description: string): Promise<SkillsProfile>  => {
    const query = `
    INSERT INTO SkillsProfiles
           (StaffId
           ,SkillsProfile
           ,ShortDescription)
    OUTPUT Inserted.SkillsProfilesId
     VALUES
           (@StaffId
           ,@Profile
           ,@Description)
    `;
    const request = await transaction.timed_request();

    const result = await request
        .input("StaffId", staffId)
        .input("Profile", profile)
        .input("Description", description)
        .timed_query(query, "insertSkillsProfile");
    return {
        skillsProfilesId: result.recordset[0]["SkillsProfilesId"],
        staffId: staffId,
        skillsProfile: profile,
        shortDescription: description };

}

export const readSkillsProfileByStaffId = async (db: () => Promise<SqlRequest>, staffId: number): Promise<SkillsProfile[]> => {
    const query = `
    SELECT SkillsProfilesId as skillsProfilesId
      ,StaffId as staffId
      ,SkillsProfile as skillsProfile
      ,ShortDescription as shortDescription
    FROM SkillsProfiles
    WHERE StaffId = @StaffId
    `;
    const result = await db();
    const results = await result
        .input("StaffId", staffId)
        .timed_query(query, "readSkillsProfileByStaffId");

    return results.recordset as SkillsProfile[];
}

export const readSkillsProfileById = async (db: () => Promise<SqlRequest>, id: number): Promise<SkillsProfile> => {
    const query = `
    SELECT SkillsProfilesId as skillsProfilesId
      ,StaffId as staffId
      ,SkillsProfile as skillsProfile
      ,ShortDescription as shortDescription
    FROM SkillsProfiles
    WHERE SkillsProfilesId = @Id
    `;
    const result = await db();
    const results = await result
        .input("Id", id)
        .timed_query(query, "readSkillsProfileById");

    return results.recordset[0] as SkillsProfile;
}

export const updateSkillsProfile = async (transaction: SqlTransaction, skillsProfilesId: number, staffId: number, profile: string, description: string): Promise<SkillsProfile> => {
    const query = `
    UPDATE SkillsProfiles
    SET
          SkillsProfile = @Profile
          ,ShortDescription = @Description
    WHERE SkillsProfilesId = @SkillsProfileId`;
    const request = await transaction.timed_request();
    await request
        .input("SkillsProfileId", skillsProfilesId)
        .input("Profile", profile)
        .input("Description", description)
        .timed_query(query, "updateSkillsProfile");

    return {
        skillsProfilesId:  skillsProfilesId,
        staffId: staffId,
        skillsProfile: profile,
        shortDescription: description
     };
}

export const deleteSkillsProfile = async (transaction: SqlTransaction, skillsProfilesId: number): Promise<void> => {
    const query = `
    DELETE FROM SkillsProfiles
      WHERE SkillsProfilesId = @SkillsProfileId`;
    const request = await transaction.timed_request();
    await request
        .input("SkillsProfileId", skillsProfilesId)
        .timed_query(query, "deleteSkillsProfile");
}
