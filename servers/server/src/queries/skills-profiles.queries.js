const { db } = require('../shared/db');

const insertSkillsProfileForStaffId = async (staffId, profile, description)  => {
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
    const request = await db();
    
    const result = await request
        .input("StaffId", staffId)
        .input("Profile", profile)
        .input("Description", description)
        .timed_query(query, "insertSkillsProfileForStaffId");
    return {
        skillsProfilesId: result.recordset[0]["SkillsProfilesId"], 
        staffId: staffId, 
        skillsProfile: profile, 
        shortDescription: description };
    
}

const readSkillsProfileForStaffId = async (staffId) => {
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
        .timed_query(query, "readSkillsProfileForStaffId");

    return results.recordset;
}

const updateSkillsProfileById = async (skillsProfilesId, staffId, profile, description)  => {
    const query = `
    UPDATE SkillsProfiles
    SET 
          SkillsProfile = @Profile
          ,ShortDescription = @Description
    WHERE SkillsProfilesId = @SkillsProfileId`;
    const request = await db();
    await request
        .input("SkillsProfileId", skillsProfilesId)
        .input("Profile", profile)
        .input("Description", description)
        .timed_query(query, "updateSkillsProfileById");

    return {
        skillsProfilesId:  skillsProfilesId,
        staffId: staffId,
        skillsProfile: profile,
        shortDescription: description
     };
}

const deleteSkillsProfileById = async (skillsProfilesId) => {
    const query = `
    DELETE FROM SkillsProfiles
      WHERE SkillsProfilesId = @SkillsProfileId`;
    const request = await db();
    await request
        .input("SkillsProfileId", skillsProfilesId)
        .timed_query(query, "deleteSkillsProfileById");
}

module.exports = {
    insertSkillsProfileForStaffId,
    readSkillsProfileForStaffId,
    updateSkillsProfileById,
    deleteSkillsProfileById
};