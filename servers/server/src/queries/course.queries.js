const { db, transaction } = require('../shared/db');
const fixCase = require('../shared/fix-case');
const { groupItems } = require('../shared/group-items');
const {
  restrict_content,
  restrict_content_to_individual,
} = require('./groups.queries');
const {
  DeleteExistingRestrictions,
  InsertRestrictions,
} = require('../queries/restrictions.queries');

const RESTRICTION_TYPE_ID = 2;
const ATC_RESTRICTION_GROUP_NAME = 'ATC';
const ICON_DIRECTORY = 'images/logos/';

const all_permitted_courses = async (upn) => {
  const q = `
    SELECT
      c.CourseId,
      c.Code,
      c.Name,
      c.Description,
      c.Icon,
      cs.SectionId,
      cs.SortOrder
    FROM Courses c
        INNER JOIN CourseSections cs on cs.CourseId = c.CourseId
    WHERE Restricted = 0
      OR c.CourseId IN (
        SELECT DISTINCT TypeKeyId AS CourseId FROM ContentRestrictions gr
        INNER JOIN
        Groups ug
        ON gr.GroupName = ug.GroupName AND MemberUserPrincipleName = @UPN
        WHERE RestrictionTypeId = 2 AND gr.GroupName IS NOT NULL
      )
      OR c.CourseId IN (
        SELECT TypeKeyId as CourseId
        FROM ContentRestrictions
        WHERE RestrictionTypeId = 2 AND UPN = @UPN
      )
    ORDER BY
        CourseId,
        SortOrder
  `;

  const request = await db();
  const results = await request
    .input('UPN', upn)
    .timed_query(q, 'all_permitted_courses');
  const courses = groupItems(fixCase(results.recordset), 'code', 'sectionId');

  return courses;
};

const all_courses = async () => {
  const q = `
    WITH courseTimeData AS (
    SELECT
      CourseId,
      CONVERT(varchar, (COALESCE(AVG(TotalTimeOnCourse), 0) / 3600000)) + FORMAT(DATEADD(ms, COALESCE(AVG(TotalTimeOnCourse), 0), 0), ':mm:ss.fff') AS AverageTimeOnCourse
    FROM (
      SELECT
        cs.CourseId,
        SUM(st.TimeOnSection) AS TotalTimeOnCourse
      FROM SectionsTimes st
      INNER JOIN CourseSections cs
      ON cs.SectionId = st.SectionId
      GROUP BY st.UserPrincipleName, cs.CourseId
    ) AS a
    GROUP BY CourseId
  )
  select
    c.CourseId,
    c.Code,
    c.Name,
    c.Description,
    c.Icon,
    cs.SectionId,
    ct.AverageTimeOnCourse
  from Courses c
    inner join CourseSections cs on cs.CourseId = c.CourseId
    LEFT JOIN courseTimeData ct on ct.CourseId = c.CourseId
  order by
    CourseId,
    SortOrder;
  `;

  const request = await db();
  const results = await request.timed_query(q, 'all_courses');
  const courses = groupItems(fixCase(results.recordset), 'code', 'sectionId');

  return courses;
};

const unregistered_user = async () => {
  const q = `
    select top 1
      us.UserPrincipleName,
      cs.CourseId
    from UserSections us
    inner join CourseSections cs on us.SectionId = cs.SectionId
    left outer join UserCourses uc on cs.CourseId = uc.CourseId and us.UserPrincipleName = uc.UserPrincipleName
    where uc.UserCourseId is null and us.DeletedBy is null
    group by us.UserPrincipleName, cs.CourseId
    order by us.UserPrincipleName, cs.CourseId
  `;

  const request = await db();
  const results = await request.timed_query(q, 'unregistered_user');
  const userCourse = fixCase(results.recordset)[0];

  return userCourse;
};

const checkIfUserRegistered = async (upn, courseId) => {
  const q = `
  select
    case
      when count(1)>0 then 1
      else 0
    end as exists_check
  from UserCourses
  where UserPrincipleName = @UPN
  and CourseId = @CourseId
  `;

  const request = await db();
  const results = await request
    .input('UPN', upn)
    .input('CourseId', courseId)
    .timed_query(q, 'checkIfUserRegistered');

  const res = fixCase(results.recordset);
  return res[0].exists_check;
};

const register_user = async (tx, upn, courseId) => {
  const q = `
    insert into UserCourses (UserPrincipleName, CourseId)
    values (LOWER(@UPN), @CourseId)
  `;

  const request = await tx.timed_request();
  await request
    .input('CourseId', courseId)
    .input('UPN', upn)
    .timed_query(q, 'register_user');
};

const incomplete_courses = async () => {
  const q = `
    declare @TotalSections table
    (
        CourseId INT,
        CourseName NVARCHAR(50),
        Total INT
    )

    insert into @TotalSections
    select
        c.CourseId,
        c.Name as CourseName,
        Count(cs.SectionId) as Total
    from Courses c
    inner join CourseSections cs on c.CourseId = cs.CourseId
    group by c.CourseId, c.Name

    declare @CompleteSections table
    (
        CourseId INT,
        UserPrincipleName NVARCHAR(50),
        Complete INT
    );

    WITH allowedSections (CourseId, UserPrincipleName, SectionId) AS (
      select
          uc.CourseId,
          us.UserPrincipleName,
          cs.SectionId
      from UserCourses uc
          inner join CourseSections cs on uc.CourseId = cs.CourseId
          inner join UserSections us on cs.SectionId = us.SectionId and uc.UserPrincipleName = us.UserPrincipleName and us.DeletedBy is null
      where uc.DateCompleted is null
    )

    insert into @CompleteSections
    Select CourseId, UserPrincipleName, count(SectionId) as Complete
    from allowedSections
    group by CourseId, UserPrincipleName

    select
        c.CourseId,
        t.CourseName,
        c.UserPrincipleName
    from @CompleteSections c
    inner join @TotalSections t on c.CourseId = t.CourseId
    where c.Complete = t.Total
    order by c.CourseId, c.UserPrincipleName
  `;

  const request = await db();
  const results = await request.timed_query(q, 'incomplete_courses');
  const incompleteCourses = fixCase(results.recordset);

  return incompleteCourses;
};

const complete_course = async (courseId, upn) => {
  const query = `
    update UserCourses
    set DateCompleted = getDate()
    where CourseId = @CourseId
    and UserPrincipleName = @UPN
  `;

  const connection = await db();
  await connection
    .input('CourseId', courseId)
    .input('UPN', upn)
    .timed_query(query, 'complete_course');
};

const courses_to_allocate_points = async (upn) => {
  const q = `
  select *
  from UserCourses uc
      left outer Join Points p
      on uc.UserPrincipleName = p.UserPrincipleName
      and uc.UserCourseId = p.LinkId
      and p.DeletedBy is null
  where uc.UserPrincipleName = @UPN
      and DateCompleted is not null
      and p.PointId is null
    `;

  const request = await db();

  const results = await request
    .input('UPN', upn)
    .timed_query(q, 'courses_to_allocate_points');

  return fixCase(results.recordset);
};
const count_user_registered_for_course = async (courseId) => {
  const q = `
    SELECT count(*) AS CountUser FROM UserCourses
    WHERE CourseId = @courseId
  `;
  const connection = await db();
  const results = await connection
    .input('CourseId', courseId)
    .timed_query(q, 'user_register_for_course');
  return results.recordset[0].CountUser;
};
const count_user_assignedcourse = async (courseId) => {
  const q = `
    SELECT count(*) AS CountUser FROM PrescribedCourses
    WHERE CourseId = @courseId
  `;
  const connection = await db();
  const results = await connection
    .input('CourseId', courseId)
    .timed_query(q, 'course_assigned_to_user');
  return results.recordset[0].CountUser;
};
const delete_trackcourses = async (courseId, tx) => {
  const q = `
   DELETE FROM TrackCourses
     WHERE CourseId = @courseId
    `;
  const request = await tx.timed_request();
  await request.input('CourseId', courseId).query(q, 'delete-trackcourse');
};
const delete_levelupcourse = async (courseId, tx) => {
  const q = `
   DELETE FROM LevelUpCourses
     WHERE CourseId = @courseId
    `;
  const request = await tx.timed_request();
  await request
    .input('CourseId', courseId)
    .timed_query(q, 'delete-levelupcourse');
};
const count_user_mission = async (courseId) => {
  const q = `
    SELECT count(*) AS CountCourseMission FROM MissionCourses
    WHERE CourseId = @courseId
  `;
  const connection = await db();
  const results = await connection
    .input('CourseId', courseId)
    .timed_query(q, 'course_mission');
  return results.recordset[0].CountCourseMission;
};
const count_course_message = async (courseId) => {
  const q = `
    SELECT count(*) AS CountCourseMessages FROM CourseMessages
    WHERE CourseId = @courseId
  `;
  const connection = await db();
  const results = await connection
    .input('CourseId', courseId)
    .timed_query(q, 'course_message');
  return results.recordset[0].CountCourseMessages;
};
const count_content_restrictions = async (courseId) => {
  const q = `select count(*) as CountContentRestrictions from ContentRestrictions
  where RestrictionTypeId=@restrictionTypeId  and TypeKeyId=@courseId`;
  const connection = await db();
  const results = await connection
    .input('CourseId', courseId)
    .input('RestrictionTypeId', RESTRICTION_TYPE_ID)
    .timed_query(q, 'course_content_restriction');
  return results.recordset[0].CountContentRestrictions;
};
const delete_prescribedcourse = async (courseId, tx) => {
  const q = `
   DELETE FROM PrescribedCourses
     WHERE CourseId = @courseId
    `;
  const request = await tx.timed_request();
  await request
    .input('CourseId', courseId)
    .timed_query(q, 'delete-prescribedcourse');
};
const delete_course = async (courseId) => {
  const tx = await transaction();
  const q = `
   DELETE FROM Courses
     WHERE CourseId = @courseId
    `;
  try {
    await tx.begin();
    await delete_trackcourses(courseId, tx);
    await delete_levelupcourse(courseId, tx);
    await delete_prescribedcourse(courseId, tx);
    await delete_course_sections(courseId, tx);
    const request = await tx.request();
    await request.input('CourseId', courseId).query(q, 'delete-course');
    await tx.commit();
  } catch (error) {
    console.error(error);
    await tx.rollback();
    return false;
  }
  return true;
};
const users_course_progress = async () => {
  const q = `
    WITH allSectionsWithCourseCode AS (
      SELECT Courses.CourseId, Courses.Name, CourseSections.SectionId, Sections.Code FROM Courses
      INNER JOIN CourseSections
      ON Courses.CourseId = CourseSections.CourseId
      INNER JOIN Sections
      ON CourseSections.SectionID = Sections.SectionId
      ),
      sectionDetails AS (
      SELECT CourseId, UserSections.SectionId, Name, Code, UserPrincipleName as UPN, DateCompleted FROM allSectionsWithCourseCode
      INNER JOIN UserSections
      ON allSectionsWithCourseCode.SectionId = UserSections.SectionId AND UserSections.DeletedBy IS NULL
      ),
      s AS (
        SELECT UPN, CourseId, Name, Count(*) AS SectionsDone
        FROM sectionDetails
        GROUP BY UPN, CourseId, Name
      ),
      r AS (
        SELECT  CourseSections.CourseId, Count(*) AS SectionsInCourse
        FROM CourseSections
        GROUP BY CourseId
      ),
      courseTimeData AS (
        SELECT cs.CourseId, st.UserPrincipleName as UPN, SUM(st.TimeOnSection) AS TotalTimeOnCourse, AVG(st.TimeOnSection) AS AverageTimeOnSection
        FROM SectionsTimes st
        INNER JOIN CourseSections cs
        ON cs.SectionId = st.SectionId
        GROUP BY st.UserPrincipleName, cs.CourseId

      ),
	  ns AS (
		SELECT UPN, allSectionsWithCourseCode.CourseId, Name AS CourseName, NextSectionId, Code as NextSectionCode FROM (
		SELECT CourseId, MAX(SectionId) + 1 as NextSectionId, UPN FROM sectionDetails
			GROUP BY CourseId, UPN
		) as possibleSections
		INNER JOIN allSectionsWithCourseCode
		ON possibleSections.NextSectionId = allSectionsWithCourseCode.SectionId
		AND possibleSections.CourseId = allSectionsWithCourseCode.CourseId
	  )
      SELECT s.UPN, r.CourseId, SectionsInCourse, SectionsDone, Name, NextSectionId, NextSectionCode, ROUND(SectionsDone * 100.0 / SectionsInCourse, 2) AS Percentage,
      CONVERT(varchar, (COALESCE(courseTimeData.TotalTimeOnCourse, 0) / 3600000)) + FORMAT(DATEADD(ms, COALESCE(courseTimeData.TotalTimeOnCourse, 0), 0), ':mm:ss.fff') AS TotalTimeOnCourse,
      CONVERT(varchar, (COALESCE(courseTimeData.AverageTimeOnSection, 0) / 3600000)) + FORMAT(DATEADD(ms, COALESCE(courseTimeData.AverageTimeOnSection, 0), 0), ':mm:ss.fff') AS AverageTimeOnSection
      FROM r
	  INNER JOIN s ON r.CourseId = s.CourseId
	  LEFT JOIN ns
	  ON s.UPN = ns.UPN
	  AND s.CourseId = ns.CourseId
    LEFT JOIN courseTimeData
    ON courseTimeData.UPN = ns.UPN
    AND courseTimeData.CourseId = ns.CourseId
    `;

  const request = await db();

  const results = await request.timed_query(q, 'users_course_progress');

  return fixCase(results.recordset);
};

const create_course = async (course) => {
  const tx = await transaction();

  try {
    await tx.begin();

    let q = `
      SELECT TOP 1 CourseId
      FROM Courses
      ORDER BY CourseId DESC
    `;
    let request = await tx.timed_request();
    let results = await request.timed_query(q, 'get-last-courseId');
    const newCourseId = fixCase(results.recordset)[0].courseId + 1;

    q = `
      SELECT TOP 1 SectionId
      FROM Sections
      ORDER BY SectionId DESC
    `;
    request = await tx.timed_request();
    results = await request.timed_query(q, 'get-last-sectionId');
    const newSectionId = fixCase(results.recordset)[0].sectionId + 1;

    if (!newSectionId) {
      console.error('Error retrieving course and section IDs.');
      await tx.rollback();
      return;
    }

    const trimmedName = course.name.trim();

    q = `
      INSERT INTO Courses (CourseId, Code, Name, [Description], Icon, Restricted)
      VALUES
      (@CourseId, @Code, @Name, @Description, @Icon, 1)
    `;

    request = await tx.request();
    await request
      .input('CourseId', newCourseId)
      .input('Code', course.code)
      .input('Name', trimmedName)
      .input('Description', course.description)
      .input('Icon', `${ICON_DIRECTORY}${course.icon}`)
      .query(q, 'create-course');

    q = `
      INSERT INTO Sections (SectionId, Code, Name, PathToMarkdown)
      VALUES
      (@SectionId, @Code, @Name, @PathToMarkdown)
    `;

    const q2 = `
      INSERT INTO CourseSections (CourseId, SectionId, [Grouping], SortOrder)
      VALUES
      (@CourseId, @SectionId, @Grouping, @SortOrder)
    `;

    const questionInsert = `
      INSERT INTO Questions(SectionId,Text)
      OUTPUT inserted.QuestionId
      VALUES (@SectionId,@Text);
    `;

    const answerInsert = `
      INSERT INTO QuestionAnswers(QuestionId,CorrectAnswer,Text)
      VALUES (@QuestionId,@CorrectAnswer,@Text)
    `;

    for (let i = 0; i < course.sections.length; i++) {
      request = await tx.request();
      const sectionId = newSectionId + i;
      await request
        .input('SectionId', sectionId)
        .input('Code', course.sections[i].code)
        .input('Name', course.sections[i].name)
        .input('PathToMarkdown', course.sections[i].path)
        .query(q, 'create-section');

      request = await tx.request();
      await request
        .input('CourseId', newCourseId)
        .input('SectionId', sectionId)
        .input('Grouping', course.code)
        .input('SortOrder', i + 1)
        .query(q2, 'create-course-section');

      // add section questions and answers
      if (course.sections[i].questions) {
        for (const question of course.sections[i].questions) {
          request = await tx.request();
          const insertResult = await request
            .input('SectionId', sectionId)
            .input('Text', question.text)
            .query(questionInsert, 'create-section-question');
          question.questionId = fixCase(insertResult.recordset)[0].questionId;
          for (const answer of question.answers) {
            request = await tx.request();
            await request
              .input('QuestionId', question.questionId)
              .input('CorrectAnswer', answer.correct || false)
              .input('Text', answer.text)
              .query(answerInsert, 'create-question-answer');
          }
        }
      }
    }

    if (course.trackId > 0) {
      q = `
        SELECT TOP 1 SortOrder
        FROM TrackCourses
        WHERE TrackId = @TrackId
        ORDER BY SortOrder DESC
      `;

      request = await tx.request();
      results = await request
        .input('TrackId', course.trackId)
        .query(q, 'get-highest-sort-order');
      const newSortOrder =
        results.recordset.length > 0
          ? fixCase(results.recordset)[0].sortOrder + 1
          : 1;

      q = `
        INSERT INTO TrackCourses (TrackId, CourseId, [Grouping], SortOrder)
        VALUES
        (@TrackId, @CourseId, @Grouping, @SortOrder)
      `;

      request = await tx.request();
      await request
        .input('TrackId', course.trackId)
        .input('CourseId', newCourseId)
        .input('Grouping', course.code)
        .input('SortOrder', newSortOrder)
        .query(q, 'create-track-course');
    }

    await restrict_content(
      tx,
      ATC_RESTRICTION_GROUP_NAME,
      newCourseId,
      RESTRICTION_TYPE_ID
    );
    await restrict_content_to_individual(
      tx,
      course.creator,
      newCourseId,
      RESTRICTION_TYPE_ID
    );

    if (course.restrictions && course.restrictions.length > 0) {
      for (let i = 0; i < course.restrictions.length; i++) {
        await restrict_content(
          tx,
          course.restrictions[i].groupName,
          newCourseId,
          RESTRICTION_TYPE_ID
        );
      }
    }

    await tx.commit();
  } catch (error) {
    console.error(error);

    await tx.rollback();
  }
};

const delete_course_sections = async (courseId, tx) => {
  const q = `
    DELETE FROM CourseSections
    WHERE CourseId = @COURSEID
  `;

  const request = tx ? await tx.timed_request() : await db();
  await request
    .input('COURSEID', courseId)
    .timed_query(q, 'delete_course_sections');
};

const add_course_section = async (
  courseId,
  sectionId,
  grouping,
  sortOrder,
  tx
) => {
  const q = `
    INSERT INTO CourseSections
      (CourseId, SectionId, Grouping, SortOrder)
    VALUES
      (@COURSEID, @SECTIONID, @GROUPING, @SORTORDER)
  `;

  const request = tx ? await tx.timed_request() : await db();
  await request
    .input('COURSEID', courseId)
    .input('SECTIONID', sectionId)
    .input('GROUPING', grouping)
    .input('SORTORDER', sortOrder)
    .timed_query(q, 'add_course_section');
};

const update_course_sections = async (courseId, courseCode, sections, tx) => {
  await delete_course_sections(courseId, tx);
  console.log('course sections deleted');

  for (const s of sections) {
    const questionsTemp = s.questions;
    if (questionsTemp) {
      for (const q of questionsTemp) {
        await delete_section_questions(tx, s.sectionId, q.questionId);
      }
    }
    if (!s.sectionId) {
      const newId = await add_section(tx, s);
      s.sectionId = newId;
    }
    await add_course_section(
      courseId,
      s.sectionId,
      courseCode,
      s.sortOrder,
      tx
    );
    await add_section_questions(tx, questionsTemp, s.sectionId);
  }

  //update section questions and question answers
};

const add_section = async (tx, section) => {
  const q = `
    INSERT INTO Sections (SectionId, Code, Name, PathToMarkdown)
    VALUES (@SectionId, @Code, @Name, @PathToMarkdown)
  `;

  const a = `
  SELECT MAX(SectionId) FROM Sections
  `;

  let request = await tx.timed_request();

  const maxSectionId = await request.timed_query(a, 'get-max-section-id');

  const sectionId = maxSectionId.recordset[0][''] + 1;

  request = await tx.timed_request();

  await request
    .input('SectionId', sectionId)
    .input('Code', section.code)
    .input('Name', section.name)
    .input('PathToMarkdown', section.path)
    .timed_query(q, 'add-new-section');

  return sectionId;
};

const delete_section_questions = async (tx, sectionId, questionId) => {
  const a = `
  DELETE FROM QuestionAnswers
  WHERE QuestionId = @QuestionId
  `;

  const q = `
  DELETE FROM Questions
  WHERE SectionId = @SectionId
  `;

  let request = tx ? await tx.timed_request() : await db();
  await request
    .input('QuestionId', questionId)
    .timed_query(a, 'delete-answers');

  request = tx ? await tx.timed_request() : await db();
  await request
    .input('SectionId', sectionId)
    .timed_query(q, 'delete-questions');
};

const add_section_questions = async (tx, questions, sectionId) => {
  const questionInsert = `
    INSERT INTO Questions(SectionId,Text)
    OUTPUT inserted.QuestionId
    VALUES (@SectionId,@Text);
  `;

  const answerInsert = `
    INSERT INTO QuestionAnswers(QuestionId,CorrectAnswer,Text)
    VALUES (@QuestionId,@CorrectAnswer,@Text)
  `;
  if (questions) {
    for (const question of questions) {
      request = await tx.timed_request();
      const insertResult = await request
        .input('SectionId', sectionId)
        .input('Text', question.text)
        .timed_query(questionInsert, 'create-section-question');
      question.questionId = fixCase(insertResult.recordset)[0].questionId;
      for (const answer of question.answers) {
        request = await tx.timed_request();
        await request
          .input('QuestionId', question.questionId)
          .input('CorrectAnswer', answer.correct || false)
          .input('Text', answer.text)
          .timed_query(answerInsert, 'create-question-answer');
      }
    }
  }
};

const update_course = async (
  icon,
  name,
  courseId,
  code,
  description,
  restricted,
  trackIds,
  tx
) => {
  let q = `
    UPDATE Courses
    SET
        Code = @CODE,
        Name = @NAME,
        [Description] = @DESCRIPTION,
        Icon = @ICON,
        Restricted = @RESTRICTED

    WHERE CourseId = @COURSEID
  `;
  let request = tx ? await tx.timed_request() : await db();
  await request
    .input('COURSEID', courseId)
    .input('CODE', code)
    .input('NAME', name)
    .input('DESCRIPTION', description)
    .input('ICON', icon)
    .input('RESTRICTED', restricted)
    .timed_query(q, 'update_course');

  if (trackIds.length > 0) {
    q = `
        WITH trackIdList AS (
        SELECT CAST(value AS INT) AS TrackId
        FROM STRING_SPLIT(@TrackIds, ',')
        ),
        sortOrders AS (
        SELECT TrackId, MAX(SortOrder) AS SortOrder
        FROM TrackCourses
        WHERE TrackId IN (SELECT TrackId FROM trackIdList)
        GROUP BY TrackId
        )
        INSERT INTO TrackCourses (TrackId, CourseId, [Grouping], SortOrder)
        SELECT
        t.TrackId,
        @CourseId,
        @Grouping,
        ISNULL(m.SortOrder, 0) + 1 AS SortOrder
        FROM trackIdList t
        LEFT JOIN sortOrders m ON t.TrackId = m.TrackId
      `;

    request = await tx.request();
    results = await request
      .input('TrackIds', trackIds.toString())
      .input('CourseId', courseId)
      .input('Grouping', code)
      .query(q, 'create-track-courses');
  }
};

const get_section_questions = async (sectionId) => {
  const tx = await db();

  const question = await get_question(tx, sectionId);
  if (question.length > 0){
    const questionIds = question.map((q) => q.questionId);
    const answers = await get_answers(tx, questionIds);
    question.forEach((q, index) => {
      q.answers = answers[index];
    });
  } else {
    //There are no questions to get the answers for.
  }

  return question;
};

const get_question = async (tx, sectionId) => {
  const q = `
  SELECT * FROM Questions
  WHERE SectionId = @SectionId
  `;

  const request = tx ? tx : await db();
  const results = await request
    .input('SectionId', sectionId)
    .timed_query(q, 'get-questions');
  return fixCase(results.recordset);
};

const get_answers = async (tx, questionIds) => {
  const q = `
  SELECT * FROM QuestionAnswers
  WHERE QuestionId IN (
    SELECT CAST(value AS INT) AS QuestionId
    FROM STRING_SPLIT(@QuestionIds, ',')
    );
  `;

  const request = tx ? tx : await db();
  const results = await request
    .input('QuestionIds', questionIds)
    .query(q, 'get-answers');
  return fixCase(results.recordset);
};

const update_course_everything = async (course) => {
  const tx = await transaction();
  try {
    await tx.begin();

    // update course
    await update_course(
      course.icon,
      course.name,
      course.courseId,
      course.code,
      course.description,
      course.restricted,
      course.trackIds,
      tx
    );
    console.log('course updated');

    //Update Restrictions
    await DeleteExistingRestrictions(course, tx);
    console.log('restrictions deleted');

    if (course.restricted) {
      const restrictions = {
        courseId: course.courseId,
        restrictions: course.restrictions.map((r) => {
          return {
            groupName: r.groupName,
            upn: r.upn,
          };
        }),
      };

      await InsertRestrictions(restrictions, tx);
      console.log('restrictions added');
    }

    await update_course_sections(
      course.courseId,
      course.code,
      course.sections,
      tx
    ); //TODO: fix updating course sections and questions/answers
    console.log('course sections updated');

    await tx.commit();
  } catch (error) {
    console.error(error);
    await tx.rollback();
  }
};

const get_completed_courses = async (upn) => {
  const q = `
    select CourseId from UserCompletedCourses as ucc
    inner join UserInteractions as ui
    on ucc.UserInteractionID = ui.UserInteractionID
    where ui.HeroUserPrincipleName = @UPN
    and ucc.DeletedBy is null
  `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(q, 'get_completed_courses');
  return fixCase(result.recordset);
};

const checkForCourseCompletionDate = async (upn, courseId) => {
  const q = `
    select
      case when count(1)>0
      then 1
      else 0
    end
      as date_check
      FROM UserCourses
      where UserPrincipleName = @UPN
      and CourseId = @CourseId
      and DateCompleted is null
  `;

  const connection = await db();
  const result = await connection
    .input('CourseID', courseId)
    .input('UPN', upn)
    .timed_query(q, 'checkForCourseCompletionDate');
  const value = fixCase(result.recordset);

  return value[0].date_check > 0;
};


async function resetUserCourseProgress(tx, deletedBy, upn, courseId) {
  const q = `
    DECLARE @DeletedDate DATETIME = GETDATE();

    UPDATE p
    SET p.DeletedBy = @DeletedBy, p.DeletedDate = @DeletedDate
    FROM Points p
    INNER JOIN UserSections us ON p.UserInteractionID = us.UserInteractionID
    INNER JOIN CourseSections cs ON cs.SectionId = us.SectionId
    WHERE cs.CourseId = @CourseID AND p.UserPrincipleName = @UPN;

    UPDATE us
    SET us.DeletedBy = @DeletedBy, us.DeletedDate = @DeletedDate
    FROM Points p
    INNER JOIN UserSections us ON p.UserInteractionID = us.UserInteractionID
    INNER JOIN CourseSections cs ON cs.SectionId = us.SectionId
    WHERE cs.CourseId = @CourseID AND p.UserPrincipleName = @UPN;

    UPDATE p
    SET p.DeletedBy = @DeletedBy, p.DeletedDate = @DeletedDate
    FROM Points p
    INNER JOIN UserCompletedCourses ucc ON p.UserInteractionID = ucc.UserInteractionID
    LEFT JOIN UserCourses uc ON uc.CourseId = ucc.CourseID AND uc.UserPrincipleName = p.UserPrincipleName
    WHERE ucc.CourseId = @CourseID AND p.UserPrincipleName = @UPN;

    UPDATE ucc
    SET ucc.DeletedBy = @DeletedBy, ucc.DeletedDate = @DeletedDate
    FROM Points p
    INNER JOIN UserCompletedCourses ucc ON p.UserInteractionID = ucc.UserInteractionID
    LEFT JOIN UserCourses uc ON uc.CourseId = ucc.CourseID AND uc.UserPrincipleName = p.UserPrincipleName
    WHERE ucc.CourseId = @CourseID AND p.UserPrincipleName = @UPN;

    UPDATE uc
    SET uc.DateCompleted = NULL
    FROM Points p
    INNER JOIN UserCompletedCourses ucc ON p.UserInteractionID = ucc.UserInteractionID
    LEFT JOIN UserCourses uc ON uc.CourseId = ucc.CourseID AND uc.UserPrincipleName = p.UserPrincipleName
    WHERE ucc.CourseId = @CourseID AND p.UserPrincipleName = @UPN;

    UPDATE PrescribedCourses
    SET [Status] = NULL
    WHERE CourseId = @CourseID AND UserPrincipleName = @UPN;
  `
  const connection = await db();
  await connection
    .input('DeletedBy', deletedBy)
    .input('UPN', upn)
    .input('CourseID', courseId)
    .timed_query(q, 'resetUserProgress');
};

module.exports = {
  all_permitted_courses,
  all_courses,
  unregistered_user,
  register_user,
  incomplete_courses,
  complete_course,
  courses_to_allocate_points,
  users_course_progress,
  create_course,
  update_course,
  get_section_questions,
  update_course_sections,
  update_course_everything,
  get_completed_courses,
  count_user_assignedcourse,
  count_user_registered_for_course,
  delete_course,
  count_user_mission,
  count_course_message,
  count_content_restrictions,
  checkForCourseCompletionDate,
  checkIfUserRegistered,
  resetUserCourseProgress,
};
