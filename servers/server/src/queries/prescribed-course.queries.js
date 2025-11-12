const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const prescribe_courses = async (tx, upns, courseId, dueDate) => {
  for (const upn of upns) {
    await assign_course(tx, upn, courseId, dueDate);
    await register_user(tx, upn, courseId);
  }
};

const assign_course = async (tx, upn, courseId, dueDate) => {
  const q = `
    IF EXISTS (
      SELECT
        1
      FROM
        PrescribedCourses
      WHERE
        LOWER(UserPrincipleName) = LOWER(@UPN)
        AND CourseId = @CourseId
    )
    BEGIN
      UPDATE
        PrescribedCourses
      SET
        DueDate = @DueDate
      WHERE
        LOWER(UserPrincipleName) = LOWER(@UPN)
        AND CourseId = @CourseId
    END
    ELSE
    BEGIN
      INSERT INTO PrescribedCourses
        (UserPrincipleName, CourseId, DueDate)
      VALUES
        (LOWER(@UPN), @CourseId, @DueDate)
    END
  `;

  const request = await tx.timed_request();
  await request
    .input('UPN', upn)
    .input('CourseId', courseId)
    .input('DueDate', dueDate)
    .timed_query(q, 'assign_course');
};

const register_user = async (tx, upn, courseId) => {
  let request = await tx.timed_request();

  const exists_q = `
      select *
      from UserCourses
      where UserPrincipleName = @UPN
      and CourseId = @CourseId
    `;

  const existing = await request
    .input('UPN', upn)
    .input('CourseId', courseId)
    .timed_query(exists_q, 'get_courses');

  if (existing.recordset.length) return;

  const q = `
      insert into UserCourses
        (UserPrincipleName, CourseId)
      values
        (LOWER(@UPN), @CourseId)
    `;

  request = await tx.timed_request();
  await request
    .input('UPN', upn)
    .input('CourseId', courseId)
    .timed_query(q, 'register_user');
};

const assigned_courses = async (courseId) => {
  const q = `
    SELECT
      pc.UserPrincipleName,
      DateCompleted,
      pc.CourseId,
      pc.DueDate,
      CASE
        WHEN EXISTS (SELECT 1 FROM DecoratedStaff s WHERE s.UserPrincipleName = pc.UserPrincipleName AND s.StaffStatus = 'active')
        THEN 'True'
        ELSE 'False' END as isStaff
    FROM PrescribedCourses pc
    INNER JOIN UserCourses uc ON pc.CourseId = uc.CourseId
      AND pc.UserPrincipleName = uc.UserPrincipleName
    WHERE pc.CourseId = @CourseId`;

  const connection = await db();
  const result = await connection
    .input('CourseId', courseId)
    .timed_query(q, 'assigned_courses');

  return fixCase(result.recordset);
};

const user_not_assigned_to_course = async (courseId) => {
  const q = `
    SELECT UserPrincipleName
    FROM DecoratedStaff s
    WHERE NOT EXISTS (
      SELECT 1
      FROM PrescribedCourses pc
      WHERE pc.CourseId = @CourseId
      AND pc.UserPrincipleName=s.UserPrincipleName)
    AND s.staffStatus = 'active';
  `;

  const connection = await db();
  const result = await connection
    .input('CourseId', courseId)
    .timed_query(q, 'user_not_assigned_to_course');

  return fixCase(result.recordset);
};

const user_completed_course = async (upn, courseId) => {
  const q = `
    SELECT UserPrincipleName
    FROM UserCourses
    WHERE DateCompleted IS NOT NULL
    AND UserPrincipleName = @Upn
    AND CourseId = @CourseId
  `;

  const connection = await db();
  const result = await connection
    .input('Upn', upn)
    .input('CourseId', courseId)
    .timed_query(q, 'user_completed_course');
  return result.recordset.length ? true : false;
};

const user_assigned_courses = async (upn) => {
  const q = `
    select
      pc.CourseId,
      DateCompleted
    from PrescribedCourses pc
    inner join UserCourses uc on pc.CourseId = uc.CourseId and pc.UserPrincipleName = uc.UserPrincipleName
    where pc.UserPrincipleName = @UPN
  `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(q, 'user_assigned_courses');

  return fixCase(result.recordset);
};

const course_progress = async () => {
  const q = `
    WITH PrescribedCoursesWithUsers AS (
    Select DISTINCT c.CourseId, UserPrincipleName, Name as CourseName from PrescribedCourses pc INNER JOIN Courses c ON pc.CourseId = c.CourseId
  ),
  prescribedCourseIDs AS (
    SELECT DISTINCT CourseId from PrescribedCourses
  ),
  requiredSections as (
    SELECT UserPrincipleName, pc.courseId, sectionId, [Grouping], sortOrder, CourseName
      FROM
        PrescribedCoursesWithUsers pc
        INNER JOIN CourseSections cs on pc.CourseId = cs.CourseId
  ),
  UserCompletedCourseSections as(
    Select us.UserPrincipleName, us.SectionId, [Grouping], SortOrder, DateCompleted, courseId, CourseName from UserSections us
    INNER JOIN requiredSections rs on us.sectionId = rs.sectionId AND us.UserPrincipleName = rs.UserPrincipleName
    WHERE us.DeletedBy IS NULL
  ),
  courseTotalSections AS (
    SELECT courseId, COUNT(courseId) AS totalSections from
    (Select DISTINCT CourseId, SectionId FROM requiredSections ) rs
    GROUP BY courseId
  ),
  userProgress as (
      Select
          pcu.userPrincipleName,
          pcu.CourseId,
          pcu.CourseName,
          totalSections as RequiredSections,
          COUNT(ucs.courseId) AS CompletedSections,
          CASE
            WHEN totalSections =  COUNT(ucs.courseId) THEN 'completed'
            WHEN COUNT(ucs.courseId)  =  0 THEN 'not-started'
            ELSE 'in-progress' END AS progress
  FROM PrescribedCoursesWithUsers pcu
  INNER JOIN courseTotalSections ts ON pcu.CourseId = ts.CourseId
  LEFT JOIN UserCompletedCourseSections ucs ON ts.CourseId = ucs.CourseId AND pcu.UserPrincipleName = ucs.UserPrincipleName
    GROUP BY pcu.courseId, pcu.userPrincipleName, pcu.CourseName, totalSections
  )
  Select
      BBDUserName as userName,
      up.UserPrincipleName,
      DisplayName,
      JobTitle,
      Office,
	    (SELECT TOP 1 sd.Department FROM Staff ss
      INNER JOIN StaffDepartment sd
      ON ss.StaffId = sd.StaffId
      WHERE ss.StaffId = s.StaffId
      ORDER BY sd.StartDate DESC) AS Department,
      up.CourseId,
      up.courseName,
      RequiredSections,
      CompletedSections,
      progress
  from userProgress up
    LEFT JOIN DecoratedStaff s ON up.UserPrincipleName = s.UserPrincipleName
  `;

  const connection = await db();
  const result = await connection.timed_query(q, 'course_progress');

  return fixCase(result.recordset);
};

const remove_prescribed_course = async (upn, courseId) => {
  const q = `
    delete
    from PrescribedCourses
    where CourseId = @CourseId
    and UserPrincipleName = @UPN
  `;

  const connection = await db();
  await connection
    .input('CourseId', courseId)
    .input('UPN', upn)
    .timed_query(q, 'assigned_courses');
};
const get_prescribed_course_progress = async (upn, courseId) => {
  const q = `
    WITH requiredSections as (
      Select * from CourseSections where CourseId = @CourseId
    ),
    UserCompletedCourseSections as(
      Select UserPrincipleName, us.SectionId, [Grouping], SortOrder, DateCompleted, courseId from UserSections us
      Inner join requiredSections rs on us.sectionId = rs.sectionId
      WHERE us.DeletedBy IS NULL
    )
    Select userPrincipleName, CourseId, (Select Count(*) from RequiredSections) as RequiredSections,  COUNT(courseId) as CompletedSections from UserCompletedCourseSections
      WHERE userPrincipleName = @UPN
      GROUP BY courseId, userPrincipleName
  `;

  const connection = await db();
  const result = await connection
    .input('CourseId', courseId)
    .input('UPN', upn)
    .timed_query(q, 'get_prescribed_course_progress');

  return result.recordset.length ? fixCase(result.recordset)[0] : undefined;
};

const update_prescribed_course_status = async (
  tx,
  upn,
  courseId,
  newStatus
) => {
  const q = `
    UPDATE PrescribedCourses
    SET status = @NewStatus
    OUTPUT inserted.*
    where CourseId = @CourseId
    and UserPrincipleName = @UPN
  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('CourseId', courseId)
    .input('NewStatus', newStatus)
    .input('UPN', upn)
    .timed_query(q, 'update_prescribed_course_status');

  return result.recordset.length ? fixCase(result.recordset)[0] : undefined;
};

const insert_user_courses = async (tx, courseId, userInteractionID) => {
  const q = `
    insert into UserCompletedCourses
    (
      CourseID,
      UserInteractionID
    )
    values
    (
      @CourseID,
      @UserInteractionID
    )
  `;

  const connection = await tx.timed_request();
  await connection
    .input('CourseID', courseId)
    .input('UserInteractionID', userInteractionID)
    .timed_query(q, 'insert_user_courses');
};

module.exports = {
  prescribe_courses,
  assigned_courses,
  user_assigned_courses,
  remove_prescribed_course,
  course_progress,
  get_prescribed_course_progress,
  update_prescribed_course_status,
  insert_user_courses,
  user_not_assigned_to_course,
  user_completed_course,
};
