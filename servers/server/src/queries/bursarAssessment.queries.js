const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const insertBursarAssessment = async (tx, name, email, dueDate, uuid) => {
  const q = `
       INSERT INTO BursarAssessment (Name, Email, DueDate, UUID)
       VALUES (@Name, @Email, @DueDate, @UUID)

       SELECT scope_identity() AS BursarAssessmentId;
    `;

  const connection = await tx.timed_request();
  const results = await connection
    .input('Name', name)
    .input('Email', email)
    .input('DueDate', dueDate)
    .input('UUID', uuid)
    .timed_query(q, 'insertBursarAssessment');

  return results.recordset[0].BursarAssessmentId;
};

const insertAssessmentStatusProgression = async (
  tx,
  bursarAssessmentId,
  statusId,
  by
) => {
  const q = `
       INSERT INTO BursarAssessmentStatusProgression (BursarAssessmentId, BursarAssessmentStatusId, ActionBy, ActionDate)
       VALUES (@BursarAssessmentId, @StatusId, @By, GETDATE())
    `;

  const connection = await tx.timed_request();
  results = await connection
    .input('BursarAssessmentId', bursarAssessmentId)
    .input('StatusId', statusId)
    .input('By', by)
    .timed_query(q, 'insertBursarAssessment');
};

const retrieveBursarAssessments = async (page, size, searchText) => {
  const q = `
        SELECT overallCount = COUNT(*) OVER(), a.BursarAssessmentId, a.Name , a.Email, a.DueDate, a.GameState , progress.Status, progress.BursarAssessmentStatusId , progress.BursarAssessmentStatusProgressionId, progress.ActionBy, progress.ActionDate
        FROM BursarAssessment a
        OUTER APPLY (

            SELECT top(1) p.BursarAssessmentStatusProgressionId, p.ActionBy, p.ActionDate, s.BursarAssessmentStatusId, s.Status
            FROM BursarAssessmentStatusProgression p
                INNER JOIN BursarAssessmentStatus s ON s.BursarAssessmentStatusId = p.BursarAssessmentStatusId
            WHERE p.BursarAssessmentId = a.BursarAssessmentId
            ORDER BY p.BursarAssessmentStatusProgressionId DESC

        ) as progress
        WHERE (@searchText IS NULL
                OR (LOWER(a.Name) LIKE '%' + LOWER(@searchText) + '%')
                OR (LOWER(a.Email) LIKE '%' + LOWER(@searchText) + '%')
             )
        ORDER BY a.DueDate ASC
        OFFSET (( (cast(@page as int)) - 1)*  (cast(@size as int))) ROWS FETCH NEXT  (cast(@size as int)) ROWS ONLY
    `;

  const connection = await db();
  const results = await connection
    .input('page', page)
    .input('size', size)
    .input('searchText', searchText)
    .timed_query(q, 'retrieveBursarAssessment');

  return fixCase(results.recordset);
};

const retrieveAllBursarAssessmentStatusses = async () => {
  const q = `
        SELECT BursarAssessmentStatusId AS Id , Status AS Name
        FROM BursarAssessmentStatus
    `;

  const connection = await db();
  const results = await connection.timed_query(
    q,
    'retrieveAllBursarAssessmentStatusses'
  );

  return fixCase(results.recordset);
};

const retrieveBursarAssessmentProgression = async (id) => {
  const q = `
        SELECT bsp.BursarAssessmentStatusProgressionId, bsp.ActionBy, bsp.ActionDate, bs.Status
        FROM BursarAssessmentStatusProgression bsp
          INNER JOIN BursarAssessment ba ON ba.BursarAssessmentId = bsp.BursarAssessmentId
          INNER JOIN BursarAssessmentStatus bs ON bs.BursarAssessmentStatusId = bsp.BursarAssessmentStatusId
        WHERE ba.BursarAssessmentId = @ID
    `;

  const connection = await db();
  const results = await connection
    .input('ID', id)
    .timed_query(q, 'retrieveBursarAssessmentProgression');

  return fixCase(results.recordset);
};

const updateBursarAssessmentDueDate = async (id, dueDate) => {
  const q = `
       UPDATE BursarAssessment
       SET DueDate = @DueDate
       WHERE BursarAssessmentId = @ID
    `;

  const connection = await tx.timed_request();
  await connection
    .input('ID', id)
    .input('DueDate', dueDate)
    .timed_query(q, 'updateBursarAssessmentDueDate');
};

module.exports = {
  insertBursarAssessment,
  retrieveBursarAssessments,
  insertAssessmentStatusProgression,
  retrieveAllBursarAssessmentStatusses,
  retrieveBursarAssessmentProgression,
  updateBursarAssessmentDueDate,
};
