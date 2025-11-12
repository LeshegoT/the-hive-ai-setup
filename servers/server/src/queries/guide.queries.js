const { db, transaction } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const specialisation_guides = async (specialisationId, status) => {
  const query = `
    select gs.UserPrincipleName, COUNT(q.HeroUserPrincipleName) as Heroes
    from GuideSpecialisations gs
    inner join GuideSpecialisationStatus gss on gss.GuideSpecialisationStatusId = gs.GuideSpecialisationStatusId
    left outer join Quests q on q.GuideUserPrincipleName = gs.UserPrincipleName
    where gs.SpecialisationId = @SpecialisationId AND gss.StatusDescription = @status
    group by gs.UserPrincipleName
  `;

  const connection = await db();
  const result = await connection
    .input('SpecialisationId', specialisationId)
    .input('status', status)
    .timed_query(query, 'specialisation_guides');

  return fixCase(result.recordset);
};

const all_guides = async () => {
  const q = `
    WITH Guides AS (
        SELECT 
            gs.UserPrincipleName,
            gss.StatusDescription AS GuideStatus,
            p.LastGuideActivityDate,
            string_agg(name, ', ') as Specialisations
            FROM GuideSpecialisations gs
            INNER JOIN Specialisations s on gs.SpecialisationId = s.SpecialisationId
            INNER JOIN GuideSpecialisationStatus gss ON gss.GuideSpecialisationStatusId = gs.GuideSpecialisationStatusId
            LEFT OUTER JOIN Profiles p on gs.UserPrincipleName = p.UserPrincipleName
            GROUP BY gs.UserPrincipleName, gss.StatusDescription, LastGuideActivityDate
    ),
    GuideDetails AS (
        SELECT 
            g.UserPrincipleName,
            g.Specialisations,
            GuideStatus,
            g.LastGuideActivityDate,
            CASE 
                WHEN QuestId IS NULL THEN 0
                ELSE 1
            END AS HasHeroes
        FROM Guides g
        LEFT OUTER JOIN Quests q on g.UserPrincipleName = q.GuideUserPrincipleName
    )
    SELECT 
        UserPrincipleName,
        Specialisations,
        LastGuideActivityDate,
        GuideStatus,
        CASE 
            WHEN HasHeroes = 1 THEN Count(1)
            ELSE 0
        END AS Heroes
    FROM GuideDetails gd
    GROUP BY gd.UserPrincipleName, gd.Specialisations, gd.LastGuideActivityDate, gd.GuideStatus, HasHeroes
  `;

  const request = await db();
  const results = await request.timed_query(q, 'all_guides');
  return fixCase(results.recordset);
};

const all_active_guides = async (tx) => {
  const q = `
    WITH Guides AS (
        SELECT 
            gs.UserPrincipleName,
            gss.StatusDescription AS GuideStatus,
            p.LastGuideActivityDate,
            string_agg(name, ', ') as Specialisations
            FROM GuideSpecialisations gs
            INNER JOIN Specialisations s on gs.SpecialisationId = s.SpecialisationId
            INNER JOIN GuideSpecialisationStatus gss ON gss.GuideSpecialisationStatusId = gs.GuideSpecialisationStatusId
            LEFT OUTER JOIN Profiles p on gs.UserPrincipleName = p.UserPrincipleName
            GROUP BY gs.UserPrincipleName, gss.StatusDescription, p.LastGuideActivityDate
    ),
    GuideDetails AS (
        SELECT 
            g.UserPrincipleName,
            g.Specialisations,
            g.GuideStatus,
            g.LastGuideActivityDate,
            CASE 
                WHEN q.QuestId IS NULL THEN 0
                ELSE 1
            END AS HasHeroes
        FROM Guides g
        LEFT OUTER JOIN Quests q on g.UserPrincipleName = q.GuideUserPrincipleName
    )
    SELECT 
        gd.UserPrincipleName,
        gd.Specialisations,
        gd.LastGuideActivityDate,
        gd.GuideStatus,
        CASE 
            WHEN gd.HasHeroes = 1 THEN Count(1)
            ELSE 0
        END AS Heroes
    FROM GuideDetails gd
    WHERE gd.GuideStatus = 'active'
    GROUP BY gd.UserPrincipleName, gd.Specialisations, gd.LastGuideActivityDate, gd.GuideStatus, gd.HasHeroes
  `;

  const request = await tx.timed_request();
  const results = await request.timed_query(q, 'all_active_guides');
  return fixCase(results.recordset);
};

const guide_details = async (guide) => {
  const q = `
    select
      t.UserPrincipleName,
      t.Specialisations,
      GuideStatus,
      p.LastGuideActivityDate
    from
    (
      select 
        UserPrincipleName,
        gss.StatusDescription as GuideStatus,
        string_agg(name, ', ') as Specialisations
      from GuideSpecialisations gs
      inner join Specialisations s on gs.SpecialisationId = s.SpecialisationId
      inner join GuideSpecialisationStatus gss on gss.GuideSpecialisationStatusId = gs.GuideSpecialisationStatusId
      group by UserPrincipleName, gss.StatusDescription
    )t
    left outer join Profiles p on t.UserPrincipleName = p.UserPrincipleName
    where t.UserPrincipleName = @UPN
  `;

  const request = await db();
  const results = await request
    .input('UPN', guide)
    .timed_query(q, 'guide_details');

  return fixCase(results.recordset)[0];
};

const is_guide = async (upn) => {
  const query = `
    select TOP(1) *
    from GuideSpecialisations
    where UserPrincipleName = @UPN
  `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(query, 'is_guide');

  return result.recordset.length > 0;
};

const guide_specialisations = async (upn, status) => {
  const q = `
    select s.SpecialisationId, s.Name
    from Specialisations s
    inner join GuideSpecialisations gs
      on s.SpecialisationId = gs.SpecialisationId
    inner join GuideSpecialisationStatus gss
    on gss.GuideSpecialisationStatusId = gs.GuideSpecialisationStatusId
    where gs.UserPrincipleName = @UPN and gss.StatusDescription = @status
  `;

  const request = await db();
  const results = await request
    .input('UPN', upn)
    .input('status', status)
    .timed_query(q, 'guide_specialisations');
  return fixCase(results.recordset);
};

const add_specialisations = async (guide, specialisations) => {
  const tx = await transaction();

  try {
    await tx.begin();

    for (const spec of specialisations) {
      const request = await tx.timed_request();

      const get_q = `
        SELECT *
        FROM GuideSpecialisations
        WHERE UserPrincipleName = @UPN
        AND SpecialisationId = @SpecialisationId
      `;

      const results = await request
        .input('UPN', guide)
        .input('SpecialisationId', spec.specialisationId)
        .timed_query(get_q, 'add_specialisations');

      if (!results.recordset.length) {
        const insert_q = `
        INSERT INTO GuideSpecialisations
          (UserPrincipleName, SpecialisationId)
        VALUES
          (LOWER(@UPN), @SpecialisationId)
      `;

        await request.timed_query(insert_q, 'add_specialisations');
      }
    }

    await tx.commit();
  } catch (error) {
    console.error(error);

    await tx.rollback();
  }
};

const guide_requests = async (upn) => {
  const q = `
    SELECT GuideRequestId, HeroUserPrincipleName, GuideUserPrincipleName, Justification, RequestStatusType
    FROM GuideRequests AS g
    INNER JOIN RequestStatusTypes AS r
    ON g.RequestStatusTypeId = r.RequestStatusTypeId
    WHERE HeroUserPrincipleName = @UPN OR GuideUserPrincipleName = @UPN
  `;

  const request = await db();
  const results = await request
    .input('UPN', upn)
    .timed_query(q, 'guide-requests');
  return fixCase(results.recordset);
};

const cancel_guide_request = async (requestId) => {
  const q = `
    UPDATE GuideRequests
    SET RequestStatusTypeId = (SELECT RequestStatusTypeId FROM RequestStatusTypes WHERE RequestStatusType = 'CANCELLED')
    WHERE GuideRequestId = @RequestId
  `;

  const request = await db();
  await request
    .input('RequestId', requestId)
    .timed_query(q, 'cancel-guide-request');
};

const create_guide_request = async (req) => {
  const q = `
    INSERT INTO GuideRequests(HeroUserPrincipleName, GuideUserPrincipleName, Justification, RequestStatusTypeId)
    VALUES(LOWER(@HeroUPN), LOWER(@GuideUPN), @Justification, (SELECT RequestStatusTypeId FROM RequestStatusTypes WHERE RequestStatusType = 'PENDING'))
  `;

  const request = await db();
  await request
    .input('HeroUPN', req.heroUpn)
    .input('GuideUPN', req.guideUpn)
    .input('Justification', req.justification)
    .timed_query(q, 'create-guide-request');
};

const accept_guide_request = async (req) => {
  const tx = await transaction();

  try {
    await tx.begin();

    const request = await tx.timed_request();

    let q = `
      UPDATE GuideRequests
      SET RequestStatusTypeId = (SELECT RequestStatusTypeId FROM RequestStatusTypes WHERE RequestStatusType = 'ACCEPTED')
      WHERE GuideRequestId = @RequestId
    `;

    await request
      .input('RequestId', req.guideRequestId)
      .timed_query(q, 'accept-guide-request');

    q = `
      UPDATE Quests
      SET GuideUserPrincipleName = @GuideUPN
      WHERE HeroUserPrincipleName = @HeroUPN AND [Status] = 'in-progress' AND GuideUserPrincipleName IS NULL
    `;

    await request
      .input('GuideUPN', req.guideUserPrincipleName)
      .input('HeroUPN', req.heroUserPrincipleName)
      .timed_query(q, 'assign-guide-from-request');

    await tx.commit();
  } catch (error) {
    console.error(error);

    await tx.rollback();
  }
};

const reject_guide_request = async (requestId) => {
  const q = `
    UPDATE GuideRequests
    SET RequestStatusTypeId = (SELECT RequestStatusTypeId FROM RequestStatusTypes WHERE RequestStatusType = 'REJECTED')
    WHERE GuideRequestId = @RequestId
  `;

  const request = await db();
  await request
    .input('RequestId', requestId)
    .timed_query(q, 'reject-guide-request');
};

const unassign_guide_from_quest = async (tx, questId) => {
  const q = `
    UPDATE Quests
    SET GuideUserPrincipleName = NULL
    WHERE QuestId = @QUESTID
  `;
  const request = await tx.timed_request();
  await request
    .input('QUESTID', questId)
    .timed_query(q, 'unassign_guide_from_quest');
};

const update_guide_status = async (tx, guideUPN, newStatus) => {
  const q = `
    UPDATE GuideSpecialisations
    SET GuideSpecialisationStatusId = (SELECT GuideSpecialisationStatusId FROM GuideSpecialisationStatus WHERE StatusDescription = @STATUS)
    WHERE UserPrincipleName = @UPN
  `;

  const request = await tx.timed_request();

  await request
    .input('UPN', guideUPN)
    .input('STATUS', newStatus)
    .timed_query(q, 'update_guide_status');
};

const guide_quests = async (tx, guideUPN) => {
  const q = `
    SELECT * FROM Quests WHERE GuideUserPrincipleName = @UPN
  `;

  const request = await tx.timed_request();
  const result = await request
    .input('UPN', guideUPN)
    .timed_query(q, 'guide_quests');

  return fixCase(result.recordset);
};

const initiate_delete_guide = async (tx, guideUPN) => {
  await update_guide_status(tx, guideUPN, 'pending-delete');
};

const confirm_delete_guide = async (tx, guideUPN) => {
  await update_guide_status(tx, guideUPN, 'deleted');
};

module.exports = {
  all_guides,
  all_active_guides,
  specialisation_guides,
  guide_details,
  is_guide,
  guide_specialisations,
  add_specialisations,
  guide_requests,
  cancel_guide_request,
  create_guide_request,
  accept_guide_request,
  reject_guide_request,
  initiate_delete_guide,
  confirm_delete_guide,
  guide_quests,
  unassign_guide_from_quest,
  update_guide_status,
};
