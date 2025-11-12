const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const insert_user_sections = async (sectionId, upn) => {
  const q = `
    if not exists (
        select * 
        from UserSections 
        where SectionId = @SectionId
         and UserPrincipleName = @upn
         and DeletedBy is null)
      begin
        insert into UserSections
            (SectionId, UserPrincipleName, DateCompleted, UserInteractionID)
        values 
            (@SectionId, LOWER(@UPN), getDate(), (select top(1) UserInteractionID from UserInteractions
            where HeroUserPrincipleName = @UPN ORDER BY UserInteractionID DESC))
      end
    `;

  const connection = await db();
  await connection
    .input('SectionId', sectionId)
    .input('UPN', upn)
    .timed_query(q, 'insert_user_sections');
};

const completed_section = async (sectionId, UPN) => {
  const q = `
    select 
      cs.CourseId, 
      count(us.UserSectionsId) as CompletedSections
    from Sections s
    inner join UserSections us
      on s.SectionId = us.SectionId
      and us.DeletedBy is null
    inner join CourseSections cs
      on s.SectionId = cs.SectionId
    where us.UserPrincipleName = @UPN
      and cs.CourseId in (select CourseId from CourseSections where SectionId = @SectionId)
    Group By CourseId
  `;

  const request = await db();
  const results = await request
    .input('SectionId', sectionId)
    .input('UPN', UPN)
    .timed_query(q, 'completed_section');

  return fixCase(results.recordset);
};

const add_time_to_section = async (sectionId, UPN, time) => {
  const q = `
    insert into SectionsTimes
      (SectionId, UserPrincipleName, TimeOnSection)
    values 
      (@SectionId, LOWER(@UPN), @Time)
  `;

  const request = await db();
  await request
    .input('SectionId', sectionId)
    .input('UPN', UPN)
    .input('Time', time)
    .timed_query(q, 'add_time_to_section');
};

module.exports = {
  insert_user_sections,
  completed_section,
  add_time_to_section,
};
