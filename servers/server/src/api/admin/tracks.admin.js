const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { transaction } = require('../../shared/db');

const {
  DeleteExistingRestrictions,
  InsertRestrictions,
} = require('../../queries/restrictions.queries');
const {
  updateTrack,
  DeleteTrackCoursesByTrackId,
  updateTrackCourses,
  create_track,
  delete_track,
} = require('../../queries/track.queries');

router.post(
  '/updateTrack',
  handle_errors(async (req, res) => {
    const track = req.body.track;

    const restrictions = {
      trackId: track.trackId,
      restrictions: track.restrictions,
    };
    const tx = await transaction();

    try {
      await tx.begin();

      await updateTrack(track);
      await DeleteTrackCoursesByTrackId(track.trackId);
      await updateTrackCourses(track.trackId, track.code, track.courses);

      await DeleteExistingRestrictions(restrictions);

      if (track.restricted) {
        const restrictions = {
          trackId: track.trackId,
          restrictions: track.restrictions.map((r) => {
            return {
              groupName: r.groupName,
              upn: r.upn,
            };
          }),
        };

        await InsertRestrictions(restrictions, tx);
      }

      await tx.commit();
    } catch (error) {
      console.error(error);
      await tx.rollback();
    }

    res.status(201).send();
  })
);

router.post(
  '/createTrack',
  handle_errors(async (req, res) => {
    await create_track(req.body);
    res.status(204).send();
  })
);
router.delete(
  '/deleteTrack/:id',
  handle_errors(async (req, res) => {
    const id = parseInt(req.params.id);
    await delete_track(id);
    res.status(204).send();
  })
);
module.exports = router;
