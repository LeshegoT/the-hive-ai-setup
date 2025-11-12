const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const {
  available_tracks,
  all_tracks_with_courses,
  get_tracks_Icons,
  get_all_tracks,
} = require('../queries/track.queries');

router.get(
  '/tracks',
  handle_errors(async (req, res) => {
    const tracks = await available_tracks(res.locals.upn);

    res.json(tracks);
  })
);

router.get(
  '/allTracks',
  handle_errors(async (req, res) => {
    const tracks = await all_tracks_with_courses();
    res.json(tracks);
  })
);
router.get(
  '/track',
  handle_errors(async (req, res) => {
    const tracks = await get_all_tracks();
    res.json(tracks);
  })
);

router.get(
  '/getTracksIcons',
  handle_errors(async (req, res) => {
    const iconPaths = await get_tracks_Icons();
    const icons = [];

    for (const path of iconPaths) {
      icons.push({
        name: path.icon.substring(
          path.icon.lastIndexOf('/') + 1,
          path.icon.lastIndexOf('.')
        ),
        path: path.icon,
      });
    }

    res.json(icons);
  })
);

module.exports = router;
