const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const guide_requests = async (upn) => {
  const q = `
    SELECT g.NewGuideRequestsId, g.Bio, s.Name AS Specialisation, r.RequestStatusType, g.DateRequested
    FROM NewGuideRequests AS g
    INNER JOIN RequestStatusTypes AS r
    ON g.RequestStatusTypeId = r.RequestStatusTypeId
    INNER JOIN Specialisations AS s
    ON g.SpecialisationId = s.SpecialisationId
    WHERE UPN = LOWER(@UPN)
  `;

  const request = await db();
  const results = await request
    .input('UPN', upn)
    .timed_query(q, 'new-guide-requests');
  return fixCase(results.recordset);
};

const create_guide_request = async (req) => {
  const q = `
    INSERT INTO NewGuideRequests(UPN, Bio, SpecialisationId, RequestStatusTypeId)
    VALUES(LOWER(@UPN), @Bio, @Specialisation, (SELECT RequestStatusTypeId FROM RequestStatusTypes WHERE RequestStatusType = 'PENDING'))
  `;

  const request = await db();
  await request
    .input('UPN', req.upn)
    .input('Bio', req.bio)
    .input('Specialisation', req.specialisation)
    .timed_query(q, 'create-new-guide-request');
};

const changeGuideRequest = async (tx, requestId, newStatus) => {
  const q = `
    UPDATE NewGuideRequests
    SET RequestStatusTypeId = (SELECT RequestStatusTypeId FROM RequestStatusTypes WHERE RequestStatusType = @RequestStatus)
    WHERE NewGuideRequestsId = @RequestId
  `;

  const request = await tx.timed_request();
  await request
    .input('RequestId', requestId)
    .input('RequestStatus', newStatus)
    .timed_query(q, 'change-new-guide-request');
};

const getAllNewGuideRequests = async () => {
  const query = `
    SELECT
      ngr.NewGuideRequestsId,
      ngr.UPN,
      ngr.Bio,
      ngr.DateRequested,
      ngr.RequestStatusTypeId,
      rst.RequestStatusType,
      s.SpecialisationId,
      s.Name AS Specialisation
    FROM NewGuideRequests ngr
    INNER JOIN RequestStatusTypes AS rst
    ON rst.RequestStatusTypeId = ngr.RequestStatusTypeId
    INNER JOIN Specialisations AS s
    ON s.SpecialisationId = ngr.SpecialisationId
  `;

  const connection = await db();
  const result = await connection.timed_query(query, 'allNewGuideRequests');

  return fixCase(result.recordset);
};

const getNewGuideRequestById = async (newGuideRequestId) => {
  const query = `
    SELECT
      NewGuideRequestsId,
      UPN,
      Bio,
      SpecialisationId,
      RequestStatusTypeId,
      DateRequested
    FROM NewGuideRequests
    WHERE NewGuideRequestsId = @newGuideRequestsID
  `;

  const connection = await db();
  const result = await connection
    .input('newGuideRequestsID', newGuideRequestId)
    .timed_query(query, 'getGuideRequestById');

  return fixCase(result.recordset)[0];
};

const getRequestStatusTypes = async () => {
  const query = `
    SELECT
      RequestStatusTypeId,
      RequestStatusType
    FROM RequestStatusTypes
  `;

  const connection = await db();
  const result = await connection.timed_query(
    query,
    'getGuideApplicationStatuses'
  );

  return fixCase(result.recordset);
};

const getRequestStatusType = async (requestStatusType) => {
  const query = `
    SELECT
      RequestStatusTypeId,
      RequestStatusType
    FROM RequestStatusTypes
    WHERE RequestStatusType = @requestStatusType
  `;

  const connection = await db();
  const result = await connection
    .input('requestStatusType', requestStatusType)
    .timed_query(query, 'getRequestStatusType');

  return fixCase(result.recordset)[0];
};

const getSpecialisationById = async (specialisationId) => {
  const query = `
    SELECT
      SpecialisationId,
      Name
    FROM Specialisations
    WHERE SpecialisationId = @specialisationId
  `;

  const connection = await db();
  const result = await connection
    .input('specialisationId', specialisationId)
    .timed_query(query, 'getSpecialisationById');

  return fixCase(result.recordset)[0];
};

const getGuideSpecialisation = async (userPrincipleName, specialisationId) => {
  const query = `
    SELECT
      gs.GuideSpecialisationId,
      gs.UserPrincipleName,
      gs.SpecialisationId,
      gss.StatusDescription AS GuideStatus
    FROM GuideSpecialisations gs
    INNER JOIN GuideSpecialisationStatus gss
    ON gss.GuideSpecialisationStatusId = gs.GuideSpecialisationStatusId
    WHERE gs.UserPrincipleName = @userPrincipleName AND gs.SpecialisationId = @specialisationID
  `;

  const connection = await db();
  const result = await connection
    .input('userPrincipleName', userPrincipleName)
    .input('specialisationID', specialisationId)
    .timed_query(query, 'getGuideSpecialisation');

  return fixCase(result.recordset)[0];
};

const addGuideSpecialisation = async (
  tx,
  userPrincipleName,
  guideSpecialisationId
) => {
  const query = `
    INSERT INTO GuideSpecialisations (UserPrincipleName, SpecialisationId)
    VALUES (@userPrincipleName, @specialisationID)
  `;

  const connection = await tx.timed_request();
  await connection
    .input('userPrincipleName', userPrincipleName)
    .input('specialisationID', guideSpecialisationId)
    .timed_query(query, 'addGuideSpecialisation');
};

const updateGuideSpecialisation = async (
  tx,
  userPrincipleName,
  guideSpecialisationId,
  status
) => {
  const query = `
    UPDATE GuideSpecialisations
    SET GuideSpecialisationStatusId = (SELECT GuideSpecialisationStatusId FROM GuideSpecialisationStatus WHERE StatusDescription = @status)
    WHERE UserPrincipleName = @userPrincipleName AND SpecialisationId = @guideSpecialisationID
  `;

  const connection = await tx.timed_request();
  await connection
    .input('userPrincipleName', userPrincipleName)
    .input('guideSpecialisationID', guideSpecialisationId)
    .input('status', status)
    .timed_query(query, 'updateGuideSpecialisation');
};

module.exports = {
  guide_requests,
  create_guide_request,
  changeGuideRequest,
  getAllNewGuideRequests,
  getNewGuideRequestById,
  getRequestStatusTypes,
  getRequestStatusType,
  getSpecialisationById,
  getGuideSpecialisation,
  addGuideSpecialisation,
  updateGuideSpecialisation,
};
