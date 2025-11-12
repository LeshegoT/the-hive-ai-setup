/**
 * Express router providing batch related api routes
 * @module routers/batch
 * @requires express
 */

/**
 * express module
 * @const
 */
const express = require('express');
import { router as skillsEmails } from './skills-emails';

const router = express.Router();

// let existing_functions = [
//   'sendNotification',
//   'invitations',
//   'recordProfileRanking',
//   'complete_level_up_missions',
//   'award_course_mission_part',
//   'complete_course_mission',
//   'quest_log_system_update',
//   'register_users_for_courses',
//   'import-staff-info',
//   'ensure_guides_exist',
//   'clear_login_cache',
//   'peer_feedback_assignment',
//   'peerFeedbackPrediction',
//   'import-additional-staff-info',
//   'scheduled-reviews',
//   'prescribeCourses',
//   'staff/staff-review-dates',
//   'review/clean-up-in-progress-assignment-blobs',
//   'contract-recommendations'
// ];

// existing_functions.forEach((route) => router.use(require(`./${route}`)));
router.use(require('./sendNotification'));
router.use(require('./invitations'));
router.use(require('./recordProfileRanking'));
router.use(require('./complete_level_up_missions'));
router.use(require('./award_course_mission_part'));
router.use(require('./complete_course_mission'));
router.use(require('./quest_log_system_update'));
router.use(require('./register_users_for_courses'));
router.use(require('./ensure_guides_exist'));
router.use(require('./clear_login_cache'));
router.use(require('./peer_feedback_assignment'));
router.use(require('./peerFeedbackPrediction'));
router.use(require('./scheduled-reviews'));
router.use(require('./prescribeCourses'));
router.use(require('./review/clean-up-in-progress-assignment-blobs'));
router.use(require('./contract-recommendations'));
router.use(skillsEmails);
router.use('/import', require('./import'));

module.exports = router;
