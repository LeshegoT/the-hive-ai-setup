const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const all_sections = async () => {
  const q = `
    SELECT 
      s.SectionId, 
      s.Code, 
      s.Name, 
      s.PathToMarkdown, 
      s.ExternalSection, 
      s.ExternalLink, 
      s.ExternalRenderable, 
      s.YoutubeContentKey, 
      COALESCE(st.AverageTimeSection, '0:00:00.0') AS AverageTimeSection
    FROM Sections s
    LEFT JOIN (
      SELECT 
        SectionId, 
        CONVERT(varchar, (COALESCE(AVG(TimeOnSection), 0) / 3600000)) + FORMAT(DATEADD(ms, COALESCE(AVG(TimeOnSection), 0), 0), ':mm:ss.fff') AS AverageTimeSection
      FROM SectionsTimes
      GROUP BY SectionId
    ) AS st ON s.SectionId = st.SectionId
  `;

  const request = await db();
  const results = await request.timed_query(q, 'all_sections');
  const sections = fixCase(results.recordset);

  return sections;
};

const insert_user_sections = async (tx, sectionId, upn, userInteractionID) => {
  const q = `
    insert into UserSections
    (SectionId, UserPrincipleName, DateCompleted, UserInteractionID)
    values 
    (@SectionId, LOWER(@UPN), getDate(), @UIID)
  `;

  const request = await tx.timed_request();
  await request
    .input('SectionId', sectionId)
    .input('UIID', userInteractionID)
    .input('UPN', upn)
    .timed_query(q, 'insert_user_sections');
};

const delete_user_sections = async (tx, sectionId, upn) => {
  const updateQuery = `
    update UserSections
    SET DeletedBy = LOWER(@UPN),
    DeletedDate = GETDATE()
    where SectionId = @SectionId
    and UserPrincipleName = @UPN
    and DeletedBy is null
  `;

  const updateRequest = await tx.timed_request();
  await updateRequest
    .input('SectionId', sectionId)
    .input('UPN', upn)
    .timed_query(updateQuery, 'delete_user_sections');
};

const check_section_completed = async (tx, sectionId, upn) => {
  const q = `
    select UserSectionsId from UserSections
    where SectionId = @SectionId
    and UserPrincipleName = @UPN
    and DeletedBy is null
  `;

  const request = await tx.timed_request();
  const result = await request
    .input('SectionId', sectionId)
    .input('UPN', upn)
    .timed_query(q, 'check_section_completed');

    return result.recordset.length > 0;
};

const check_section_previously_completed = async (tx, sectionId, upn) => {
  const q = `
    select UserSectionsId from UserSections
    where SectionId = @SectionId
    and UserPrincipleName = @UPN
    and DeletedBy is not null
  `;

  const request = await tx.timed_request();
  const result = await request
    .input('SectionId', sectionId)
    .input('UPN', upn)
    .timed_query(q, 'check_section_previously_completed');

  return result.recordset.length > 0;
};

module.exports = {
  all_sections,
  insert_user_sections,
  check_section_completed,
  delete_user_sections,
  check_section_previously_completed
};
