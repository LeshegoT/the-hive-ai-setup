const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

function GetRestrictionTypeAndKey(restrictionInfo) {
  const { trackId, courseId, levelupId, sideQuestId } = restrictionInfo;

  let restrictionTypeId, contentId;
  if (trackId) {
    restrictionTypeId = 1;
    contentId = trackId;
  } else if (courseId) {
    restrictionTypeId = 2;
    contentId = courseId;
  } else if (levelupId) {
    restrictionTypeId = 3;
    contentId = levelupId;
  } else if (sideQuestId) {
    restrictionTypeId = 4;
    contentId = sideQuestId;
  }

  return { restrictionTypeId, contentId };
}

const DeleteExistingRestrictions = async (restrictionInfo, tx) => {
  const { restrictionTypeId, contentId } =
    GetRestrictionTypeAndKey(restrictionInfo);
  console.log('restrictions info: ');

  console.log('TYPEID', restrictionTypeId);
  console.log('KEYID', contentId);
  const q = `
    DELETE from ContentRestrictions 
    WHERE RestrictionTypeId = @TYPEID AND TypeKeyId = @KEYID
  `;

  const request = tx ? await tx.timed_request() : await db();
  await request
    .input('TYPEID', restrictionTypeId)
    .input('KEYID', contentId)
    .timed_query(q, 'DeleteExistingRestrictions');
};

const AddRestriction = async (restriction, tx) => {
  const { restrictionTypeId, contentId, groupName, upn } =
    restriction;

  const q = `
    INSERT INTO ContentRestrictions 
      (UPN,GroupName,RestrictionTypeId, TypeKeyId)
    Values
      (LOWER(@UPN), @GROUPNAME, @RESTRICTIONTYPEID, @CONTENTID)
    `;

  const request = tx ? await tx.timed_request() : await db();
  await request
    .input('UPN', upn)
    .input('GROUPNAME', groupName)
    .input('RESTRICTIONTYPEID', restrictionTypeId)
    .input('CONTENTID', contentId)
    .timed_query(q, 'AddRestriction');
};

const InsertRestrictions = async (restrictionInfo, tx) => {
  const { restrictionTypeId, contentId } =
    GetRestrictionTypeAndKey(restrictionInfo);

  restrictionInfo.restrictions.forEach(async (r) => {
    await AddRestriction({
      restrictionTypeId,
      contentId,
      groupName: r.groupName || null,
      upn: r.upn || null,
      tx,
    });
  });
};

const all_restrictions = async () => {
  const q = `
  Select 
    r.RestrictionTypeId, 
    TypeName, 
    UPN,
    GroupName,
    CASE 
        WHEN r.RestrictionTypeId =  1 THEN TypeKeyId 
        ELSE NULL END AS TrackId,    
    CASE 
        WHEN r.RestrictionTypeId =  2 THEN TypeKeyId 
        ELSE NULL END AS CourseId,
    CASE 
        WHEN r.RestrictionTypeId =  3 THEN TypeKeyId 
        ELSE NULL END AS LevelUpId,
    CASE 
        WHEN r.RestrictionTypeId =  4 THEN TypeKeyId 
        ELSE NULL END AS SideQuestId    
    from RestrictionTypes r 
  INNER JOIN ContentRestrictions cr on cr.RestrictionTypeId = r.RestrictionTypeId
  order by r.RestrictionTypeId
    `;

  const request = await db();
  const results = await request.timed_query(q, 'all_restrictions');
  return fixCase(results.recordset);
};

module.exports = {
  all_restrictions,
  DeleteExistingRestrictions,
  InsertRestrictions,
};
