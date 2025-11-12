const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const all_heroes = async () => {
  const q = `select distinct HeroUserPrincipleName from Quests`;

  const request = await db();
  const result = await request.timed_query(q, 'all_heroes');

  return fixCase(result.recordset);
};

const hero_details = async (upn) => {
  const q = `
    select
      q.HeroUserPrincipleName,
      s.Name as Specialisation,
      q.Goal,
      p.LastHeroActivityDate,
      q.StartDate,
      q.EndDate,
      q.GuideUserPrincipleName
    from Quests q
    inner join Specialisations s on q.SpecialisationId = s.SpecialisationId
    left outer join Profiles p on q.HeroUserPrincipleName = p.UserPrincipleName
    where q.HeroUserPrincipleName = @UPN AND STATUS = 'in-progress'
  `;

  const request = await db();
  const result = await request.input('UPN', upn).timed_query(q, 'hero_details');

  return fixCase(result.recordset)[0];
};

const update_last_hero_activity = async (upn) => {
  const q = `
    if exists (select * from Profiles where UserPrincipleName = @UPN)
    begin
      UPDATE Profiles
      SET
        LastHeroActivityDate = GETDATE()
      WHERE UserPrincipleName = @UPN
    End
    ELSE
      begin
        insert into Profiles
        (
          UserPrincipleName,
          CreatedDate,
          LastUpdatedDate,
          LastHeroActivityDate
        )
        values
        (
          @UPN,
          getdate(),
          getdate(),
          getdate()
        )
      end
  `;

  const request = await db();
  await request.input('UPN', upn).timed_query(q, 'update_last_hero_activity');
};

const update_last_guide_activity = async (upn) => {
  const q = `
    UPDATE Profiles
    SET
      LastGuideActivityDate = GETDATE()
    WHERE UserPrincipleName = @UPN
  `;

  const request = await db();
  await request.input('UPN', upn).timed_query(q, 'update_last_guide_activity');
};

module.exports = {
  all_heroes,
  hero_details,
  update_last_hero_activity,
  update_last_guide_activity,
};
