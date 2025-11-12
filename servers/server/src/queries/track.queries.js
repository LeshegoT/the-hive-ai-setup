const { db, transaction } = require('../shared/db');
const fixCase = require('../shared/fix-case');
const { groupItems } = require('../shared/group-items');
const {
  restrict_content,
  restrict_content_to_individual,
} = require('./groups.queries');

const InsertTrackCourse = async (trackCourse) => {
  const q = `
    INSERT INTO TrackCourses
      ([TrackId], [CourseId], [Grouping], [SortOrder])
    VALUES
      (@TRACKID, @COURSEID, @GROUPING, @SORTORDER)
  `;

  const request = await db();
  await request
    .input('TRACKID', trackCourse.trackId)
    .input('COURSEID', trackCourse.courseId)
    .input('GROUPING', trackCourse.grouping)
    .input('SORTORDER', trackCourse.sortOrder)
    .timed_query(q, 'InsertTrackCourse');
};
const DeleteTrackCoursesByTrackId = async (trackId) => {
  const q = `
    DELETE FROM TrackCourses WHERE TrackId = @TRACKID
  `;

  const request = await db();

  await request
    .input('TRACKID', trackId)
    .timed_query(q, 'DeleteTrackCoursesByTrackId');
};

const updateTrackCourses = async (trackId, grouping, courses) => {
  await DeleteTrackCoursesByTrackId(trackId);
  const trackCourses = courses.map((course) => {
    return {
      trackId,
      courseId: course.courseId,
      grouping: grouping,
      sortOrder: course.sortOrder,
    };
  });

  trackCourses.forEach(async (element) => {
    await InsertTrackCourse(element);
  });
};

const updateTrack = async (track) => {
  const q = `
    UPDATE Tracks
    SET Name = @NAME,
        Icon = @ICON,
        Code = @CODE,
        Restricted = @RESTRICTED
    WHERE TrackId = @TRACKID
  `;
  const request = await db();
  await request
    .input('ICON', track.icon)
    .input('NAME', track.name)
    .input('CODE', track.code)
    .input('TRACKID', track.trackId)
    .input('RESTRICTED', track.restricted)
    .timed_query(q, 'updateTrack');
};

const RESTRICTION_TYPE_ID = 1;

const all_tracks_with_courses = async () => {
  const q = `
    select
      t.TrackId,
      t.Code,
      t.Name,
      t.Icon,
      t.Restricted,
      tc.CourseId
    from Tracks t
      inner join TrackCourses tc on t.TrackId = tc.TrackId
    order by t.SortOrder, tc.SortOrder
  `;

  const request = await db();
  const results = await request.timed_query(q, 'all-tracks-with-courses');

  return groupItems(fixCase(results.recordset), 'code', 'courseId');
};

const get_tracks_Icons = async () => {
  const q = `
      SELECT DISTINCT Icon
      FROM Tracks
      WHERE  Icon != ''
    `;

  const connection = await db();
  const results = await connection.timed_query(q, 'get_tracks_Icons');

  return fixCase(results.recordset);
};

const available_tracks = async (upn) => {
  const q = `
  SELECT
    tr.TrackId,
    COALESCE(tr.Code,'default') AS Code,
    COALESCE(tr.Name,'Additional Courses') AS Name,
    COALESCE(tr.Icon,'images/logos/wizard.svg') AS Icon,
    COALESCE(tr.Restricted, c.Restricted) AS Restricted,
    c.CourseId
  FROM Courses c
  LEFT JOIN TrackCourses tc
    ON c.CourseId = tc.CourseId
  LEFT JOIN Tracks tr
    ON tr.TrackId = tc.TrackId
  WHERE tr.Restricted = 0
    OR (tr.Restricted IS NULL AND c.Restricted = 0)
    OR tr.TrackId IN (
        SELECT ContentId
        FROM ufnGetUserRestrictedContentIDs(@ContentTypeId,@UPN)
        WHERE permission = 'permitted'
    )
  ORDER BY CASE WHEN tr.SortOrder IS NULL THEN 1 ELSE 0 END, tr.SortOrder, tc.SortOrder
  `;

  const request = await db();
  const results = await request
    .input('UPN', upn)
    .input('ContentTypeId', 1) //1 is Tracks - Found on RestrictionTypes
    .timed_query(q, 'available_tracks');

  return groupItems(fixCase(results.recordset), 'code', 'courseId');
};

const get_all_tracks = async () => {
  const q = `
    SELECT
      TrackId,
      Code,
      Name,
      Icon,
      Restricted
      FROM Tracks
  `;

  const request = await db();
  const results = await request.timed_query(q, 'get-all-tracks');
  return fixCase(results.recordset);
};
const delete_track = async (trackId) => {
  const q = `
    DELETE FROM Tracks
    WHERE TrackId = @trackId
    `;

  const request = await db();
  await DeleteTrackCoursesByTrackId(trackId);
  await request.input('TrackId', trackId).query(q, 'delete-track');
};
const create_track = async (track) => {
  const tx = await transaction();

  try {
    await tx.begin();

    let q = `
      SELECT TOP 1 TrackId
      FROM Tracks
      ORDER BY TrackId DESC
    `;
    let request = await tx.timed_request();
    let results = await request.timed_query(q, 'get-last-track-id');
    const newTrackId = fixCase(results.recordset)[0].trackId + 1;

    q = `
      SELECT TOP 1 SortOrder
      FROM Tracks
      ORDER BY SortOrder DESC
    `;
    request = await tx.timed_request();
    results = await request.timed_query(q, 'get-last-track-sort-order');
    const newSortOrder = fixCase(results.recordset)[0].sortOrder + 1;

    if (!newTrackId || !newSortOrder) {
      console.error('Error retrieving existing track details.');
      await tx.rollback();
      return;
    }

    q = `
      INSERT INTO Tracks (TrackId, Code, Name, Icon, SortOrder, Restricted)
      VALUES
      (@TrackId, @Code, @Name, @Icon, @SortOrder, @Restricted)
    `;

    request = await tx.request();
    await request
      .input('TrackId', newTrackId)
      .input('Code', track.code)
      .input('Name', track.name)
      .input('Icon', track.icon)
      .input('SortOrder', newSortOrder)
      .input('Restricted', track.restrictions.length ? true : false)
      .query(q, 'create-track');
    if (track.courses.length > 0) {
      q = `
      INSERT INTO TrackCourses (TrackId, CourseId, [Grouping], SortOrder)
      VALUES
      (@TrackId, @CourseId, @Grouping, @SortOrder)
    `;

      for (let i = 0; i < track.courses.length; i++) {
        request = await tx.request();
        await request
          .input('TrackId', newTrackId)
          .input('CourseId', track.courses[i].courseId)
          .input('Grouping', track.code)
          .input('SortOrder', i + 1)
          .query(q, 'create-track-course');
      }
    }
    for (const group of track.restrictions) {
      await restrict_content(
        tx,
        group.groupName,
        newTrackId,
        RESTRICTION_TYPE_ID
      );
    }

    if (track.restrictions.length) {
      await restrict_content_to_individual(
        tx,
        track.creator,
        newTrackId,
        RESTRICTION_TYPE_ID
      );
    }

    await tx.commit();
  } catch (error) {
    console.error(error);

    await tx.rollback();
  }
};

module.exports = {
  available_tracks,
  get_tracks_Icons,
  updateTrack,
  updateTrackCourses,
  InsertTrackCourse,
  DeleteTrackCoursesByTrackId,
  all_tracks_with_courses,
  get_all_tracks,
  create_track,
  delete_track,
};
