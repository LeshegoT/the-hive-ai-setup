const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');
const { transformCanonicalNamesForProperties } = require('../shared/skills');
const { client } = require('../shared/skills-db-connection');

async function markStaffRecordForDeletion(user) {
  const q = `
    UPDATE Staff
      Set StaffStatus = 'pending-delete'
      WHERE LOWER(UserPrincipleName) = LOWER(@userPrincipleName)
    SELECT 'pending-delete' as status
  `;

  const connection = await db();
  const results = await connection
    .input('UserPrincipleName', user)
    .timed_query(q, 'markStaffRecordForDeletion');

  return results.recordset[0].status;
}

async function checkStaffOccurance(user) {
  const q = `
    SELECT StaffId, BBDUserName, UserPrincipleName AS UPN , DisplayName, JobTitle, Office, StaffStatus, StaffStatus
    FROM DecoratedStaff
    WHERE Lower(BBDUserName) = Lower(@BBDUserName) OR Lower(UserPrincipleName) = LOWER(@UserPrincipleName)`;

  const connection = await db();
  const results = await connection
    .input('BBDUserName', user.samAccountName)
    .input('UserPrincipleName', user.userPrincipalName)
    .timed_query(q, 'checkStaffOccurance');

  return fixCase(results.recordset);
}

async function createUser(tx, user) {
  const q = `
      INSERT INTO Staff
          (BBDUserName,UserPrincipleName,DisplayName,JobTitle, OfficeId)
      VALUES
          (LOWER(@BBDUserName), LOWER(@UserPrincipleName), @DisplayName, @JobTitle, (SELECT OfficeId FROM Offices WHERE OfficeName = @Office));

      SELECT scope_identity() AS staffId;
    `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('BBDUserName', user.samAccountName)
    .input('UserPrincipleName', user.userPrincipalName)
    .input('DisplayName', user.displayName)
    .input('JobTitle', user.title)
    .input('Office', user.office)
    .input('StaffStatus', user.StaffStatus)
    .timed_query(q, 'createUser');
  return result.recordset[0].staffId;
}

async function createUserDepartment(tx, user, staffId) {
  const q = `
      INSERT INTO StaffDepartment
          (Department, Manager, StartDate, StaffId)
      VALUES
          (@Department, LOWER(@Manager) , GETDATE() , @StaffId)
    `;

  const connection = await tx.timed_request();
  await connection
    .input('Department', user.department)
    .input('Manager', user.manager)
    .input('StaffId', staffId)
    .timed_query(q, 'createUserDepartment');
}

async function updateUser(tx, user) {
  const q = `
      UPDATE Staff
        SET
            BBDUserName = @BBDUserName,
            UserPrincipleName = LOWER(@UserPrincipleName),
            DisplayName = @DisplayName,
            JobTitle = @JobTitle,
             OfficeId = (SELECT OfficeId FROM Offices WHERE OfficeName = @Office)
        WHERE LOWER(BBDUserName) = LOWER(@BBDUserName) OR LOWER(UserPrincipleName) = LOWER(@UserPrincipleName)
    `;

  const connection = await tx.timed_request();
  await connection
    .input('BBDUserName', user.samAccountName)
    .input('UserPrincipleName', user.userPrincipalName)
    .input('DisplayName', user.displayName)
    .input('JobTitle', user.title)
    .input('Office', user.office)
    .timed_query(q, 'updateUser');
}

async function updateStaffAdditionalInformation(user) {
  const q = `
      UPDATE Staff
        SET
            EmploymentDate = @EmploymentDate,
            Qualification1 = @Q1,
            Qualification2 = @Q2,
            Qualification3 = @Q3
        WHERE LOWER(BBDUserName) = LOWER(@BBDUserName)
    `;

  const connection = await db();
  await connection
    .input('BBDUserName', user.userName)
    .input('Q1', user.qual1)
    .input('Q2', user.qual2)
    .input('Q3', user.qual3)
    .input('EmploymentDate', user.employmentDate)
    .timed_query(q, 'updateStaffAdditionalInformation');
}

const activeStaffRecordJoin = `    SELECT TOP 1 st.StaffId, st.BBDUserName, st.UserPrincipleName, st.DisplayName, st.JobTitle, st.Office, st.StaffStatus, st.EmploymentDate, sd.Department, sd.Manager, sd.StartDate
    FROM DecoratedStaff st
        left JOIN StaffDepartment sd ON st.StaffId = sd.StaffId`;
async function getActiveStaffRecord(user) {
  const q = `${activeStaffRecordJoin}
    WHERE LOWER(st.UserPrincipleName) = LOWER(@UserPrincipleName)
    ORDER BY sd.StartDate DESC
    `;

  const connection = await db();
  const results = await connection
    .input('UserPrincipleName', user.userPrincipalName)
    .timed_query(q, 'getActiveStaffRecord');

  return fixCase(results.recordset)[0];
}

async function getActiveStaffRecordByStaffNumber(staffNumber) {
  const q = `${activeStaffRecordJoin}
    WHERE LOWER(st.BBDUserName) = lower(@StaffNumber)
    ORDER BY sd.StartDate DESC
    `;

  const connection = await db();
  const results = await connection
    .input('StaffNumber', `bbdnet${staffNumber}`)
    .timed_query(q, 'getActiveStaffRecord');

  return fixCase(results.recordset)[0];
}

async function getActiveStaffRecordWithoutDepartment(user) {
  const q = `
    SELECT TOP 1 st.StaffId, st.BBDUserName, st.UserPrincipleName, st.DisplayName, st.JobTitle, st.Office, st.StaffStatus, st.LastReview
    FROM DecoratedStaff st
    WHERE LOWER(st.UserPrincipleName) = LOWER(@UserPrincipleName)
    `;

  const connection = await db();
  const results = await connection
    .input('UserPrincipleName', user.userPrincipalName)
    .timed_query(q, 'getActiveStaffRecordWithoutDepartment');

  return fixCase(results.recordset)[0];
}

async function markAsOutdated(tx, user) {
  const q = `
      UPDATE Staff
        SET
            BBDUserName = CONCAT(BBDUserName , '-outdated')
        WHERE StaffId = @StaffID

        SELECT 'updated' AS status
    `;

  const connection = await tx.timed_request();
  const results = await connection
    .input('StaffID', user.staffId)
    .timed_query(q, 'markAsOutdated');

  return results.recordset[0].status;
}

const getAllBBDUsers = async (activeOnly = false) => {
  const q = `
    SELECT
    sad.DisplayName,
    sad.BBDUserName AS UserName,
    sad.UserPrincipleName,
    sad.JobTitle,
    sad.Office,
    sad.Department,
    sad.Manager,
    sad.StaffStatus,
    sad.EntityAbbreviation,
    sad.EntityDescription,
    sad.Residence,
    sad.DateOfBirth,
    sad.Nationality
FROM StaffWithActiveDepartment sad
WHERE
    sad.StaffId IS NOT NULL
    AND sad.UserPrincipleName IS NOT NULL
    AND (sad.StaffStatus = @staffStatus OR @staffStatus IS NULL);
  `;

  const connection = await db();

  const results = await connection
    .input('staffStatus', activeOnly === true ? 'active' : undefined)
    .timed_query(q, 'getAllBBDUsers');

  return fixCase(results.recordset);
};

const getReviewsForStaffMember = async (upn) => {
  const q = `
    SELECT s.StaffId,
          rt.TemplateName as ReviewType,
          r.ReviewId,
          r.Reviewee,
          r.ReviewStatusId,
          rs.Description as ReviewStatus,
          r.DueDate,
          r.DateCreated,
          r.CreatedBy
    FROM Staff s
            INNER JOIN Review r ON r.Reviewee = s.UserPrincipleName AND r.DeletedBy IS NULL
            INNER JOIN ReviewStatus rs ON r.ReviewStatusId = rs.ReviewStatusId
            INNER JOIN FeedbackAssignmentTemplate rt ON r.TemplateId = rt.FeedbackAssignmentTemplateId
    where lower(s.UserPrincipleName)=LOWER(@upn);
  `;

  const connection = await db();

  const result = await connection
    .input('upn', upn)
    .timed_query(q, 'getReviewsForStaffMember');
  return fixCase(result.recordset);
};

const getStaffReviewsHistoryForStaffMember = async (staffId) => {
  const q = `
    SELECT s.StaffId,
          sr.StaffReviewId,
          sr.ReviewId,
          sr.CreatedBy,
          sr.CreatedDate,
          sr.NextReviewDate,
          sr.PreviousStaffReviewId,
          rt.TemplateName,
          r.ReviewId,
          r.Reviewee,
          r.ReviewStatusId,
          rs.Description,
          r.DueDate,
          r.DateCreated,
          r.CreatedBy
    FROM Staff s
            INNER JOIN StaffReview SR ON s.StaffId = SR.StaffId
            LEFT JOIN Review R ON SR.ReviewId = R.ReviewId
            LEFT JOIN ReviewStatus rs ON r.ReviewStatusId = rs.ReviewStatusId
            LEFT JOIN FeedbackAssignmentTemplate rt ON r.TemplateId = rt.FeedbackAssignmentTemplateId
    where s.staffId=@STaffId
  `;

  const connection = await db();

  const result = await connection
    .input('STaffId', staffId)
    .timed_query(q, 'getStaffReviewsHistoryStaffMember');
  return fixCase(result.recordset);
};

const createInitialStaffReview = async (tx, staffMember, reviewDate) => {
  const q = `
    INSERT INTO StaffReview (CreatedDate, CreatedBy, StaffId, NextReviewDate)
    VALUES (SYSDATETIME(), 'the-hive@bbd.co.za', @StaffId, @ReviewDate);

    SELECT SCOPE_IDENTITY() AS StaffReviewId;
  `;
  const connection = await tx.timed_request();
  let result = await connection
    .input('StaffId', staffMember.staffId)
    .input('ReviewDate', reviewDate)
    .timed_query(q, 'createInitialStaffReview');

  result = fixCase(result.recordset);
  return result[0].staffReviewId;
};

const createNextStaffReview = async (
  tx,
  staffMember,
  previousId,
  reviewDate
) => {
  const q = `
    INSERT INTO StaffReview (CreatedDate, CreatedBy, StaffId, NextReviewDate, PreviousStaffReviewId)
    VALUES (SYSDATETIME(), 'the-hive@bbd.co.za', @StaffId, @ReviewDate, @PreviousStaffReview);

    SELECT SCOPE_IDENTITY() AS StaffReviewId
  `;
  const connection = await tx.timed_request();
  let result = await connection
    .input('StaffId', staffMember.staffId)
    .input('ReviewDate', reviewDate)
    .input('PreviousStaffReview', previousId)
    .timed_query(q, 'createNextStaffReview');

  result = fixCase(result.recordset);
  return result[0].staffReviewId;
};

const updateReviewOnStaffReview = async (tx, staffReviewId, review) => {
  const q = `
    UPDATE StaffReview SET ReviewId=@Review WHERE StaffReviewId=@StaffReview
  `;
  const connection = await tx.timed_request();
  const result = await connection
    .input('Review', review.reviewId)
    .input('StaffReview', staffReviewId)
    .timed_query(q, 'updateReviewOnStaffReview');
  return result.rowsAffected[0] === 1;
};

const getBBDUserStaffPersonalDetails = async (upn) => {
  const q = `
    SELECT
        swad.StaffId,
        swad.DisplayName,
        swad.BBDUserName AS UserName,
        swad.UserPrincipleName,
        swad.JobTitle,
        swad.Office,
        swad.Department,
        swad.StaffStatus,
        swad.Manager,
        (SELECT DisplayName
         FROM Staff staffManager
         WHERE LOWER(staffManager.UserPrincipleName) = LOWER(swad.Manager)) AS ManagerName,
        swad.EmploymentDate AS StartDate,
        swad.Qualification1,
        swad.Qualification2,
        swad.Qualification3,
        swad.EntityDescription AS Entity,
        swad.EntityAbbreviation
    FROM StaffWithActiveDepartment swad
    WHERE LOWER(swad.UserPrincipleName) = LOWER(@upn)
`;

  const connection = await db();

  let result = await connection
    .input('upn', upn)
    .timed_query(q, 'getBBDUserStaffDetails');
  result = fixCase(result.recordset);
  return result[0];
}

const getBBDUserStaffLatestQualifications = async (staffId) => {
  const query = `
    g.V().has('person', 'identifier', staffId)
      .outE('has')
      .where(inV().repeat(out()).emit().has('identifier', within('Qualification','qualification')))
      .order().by('dateOfGraduation', decr)
      .project('name', 'year')
        .by(inV().values('identifier'))
        .by(values('dateOfGraduation'))
    `;

  const input = {
    staffId
  };

  return (await client.submit(query, input))._items
}

const getBBDUserStaffDetails = async (upn) => {
  const person = await getBBDUserStaffPersonalDetails(upn);
  if(person) {
    const qualificationsForReviews = await getBBDUserStaffLatestQualifications(person.staffId);
    const qualifications = await transformCanonicalNamesForProperties(qualificationsForReviews, 'name');

    return {
      ...person,
      qualifications
    }
  } else {
    return undefined;
  }
};

const getUPNDepartmentHistory = async (upn) => {
  const q = `
    SELECT sd.department, sd.manager, sd.startDate , ss.DisplayName AS managerDisplayName
    FROM StaffDepartment sd
       INNER JOIN Staff s ON s.staffId = sd.staffId AND LOWER(s.UserPrincipleName) = LOWER(@UPN)
       INNER JOIN Staff ss ON LOWER(ss.UserPrincipleName) = LOWER(sd.manager)
    ORDER BY StartDate DESC
  `;

  const connection = await db();
  const results = await connection
    .input('UPN', upn)
    .timed_query(q, 'getUPNDepartmentHistory');
  return fixCase(results.recordset);
};

module.exports = {
  getAllBBDUsers,
  markStaffRecordForDeletion,
  getBBDUserStaffDetails,
  checkStaffOccurance,
  createUser,
  updateUser,
  getActiveStaffRecord,
  getActiveStaffRecordByStaffNumber,
  markAsOutdated,
  createUserDepartment,
  getUPNDepartmentHistory,
  updateStaffAdditionalInformation,
  getActiveStaffRecordWithoutDepartment,
  getBBDUserStaffLatestQualifications,
  getReviewsForStaffMember,
  getStaffReviewsHistoryForStaffMember,
  createInitialStaffReview,
  createNextStaffReview,
  updateReviewOnStaffReview,
  getBBDUserStaffPersonalDetails
};
