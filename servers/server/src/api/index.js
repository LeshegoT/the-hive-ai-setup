/**
 * Express router providing api related routes
 * @module routers/api
 * @requires express
 */
import { router as securityRouter } from './security';
import { unsecureRouter } from './unsecure';
const { bbdDomains } = require('@the-hive/lib-core');
const express = require('express');
const { auth, registerLogin } = require('../shared/auth');
const checkAdmin = require('../shared/admin-auth');
const batchRouter = require('../batch');
const {
  isProduction,
  parseIfSetElseDefault,
  getEnvironmentName,
} = require('@the-hive/lib-core');


/**
 * Extract config for client consumption from current node environment variables
 * DO NOT EXPOSE SECRETS HERE!!!
 */
function prepareConfig() {
  return {
    BBD_DOMAINS: bbdDomains,
    PRODUCTION: isProduction(),
    LOAD_SERVICEWORKER: parseIfSetElseDefault('LOAD_SERVICEWORKER', true),
    ENABLE_ANALYTICS: parseIfSetElseDefault('ENABLE_ANALYTICS', true),
    DEBUG: parseIfSetElseDefault('DEBUG', false),
    BASE_SERVER_URL: process.env.BASE_SERVER_URL,
    API_URL: process.env.API_URL,
    CLIENT_ID: process.env.CLIENT_ID,
    AUTHORITY_BASE: process.env.AUTHORITY_BASE,
    TENANT_ID: process.env.TENANT_ID,
    REDIRECT_URI: process.env.REDIRECT_URI,
    ADMIN_REDIRECT_URI: process.env.ADMIN_REDIRECT_URI,
    MSGRAPHAPI: process.env.MSGRAPHAPI,
    SCOPES: JSON.parse(process.env.SCOPES),
    INSTRUMENTATION_KEY: process.env.INSTRUMENTATION_KEY,
    EVENT_SERVER_URL: process.env.EVENT_SERVER_URL,
    STORE_ENABLED: parseIfSetElseDefault('STORE_ENABLED', true),
    SUBMIT_COMMENT_ENABLED: parseIfSetElseDefault('SUBMIT_COMMENT_ENABLED', true),
    QUEST_TUTORIAL_ENABLED: parseIfSetElseDefault('QUEST_TUTORIAL_ENABLED',false),
    PEER_FEEDBACK_ENABLED: parseIfSetElseDefault(
      'PEER_FEEDBACK_ENABLED',
      false
    ),
    APP_COMPONENTS_ENABLED: parseIfSetElseDefault(
      'APP_COMPONENTS_ENABLED',
      false
    ),
    LEADERBOARD_ENABLED: parseIfSetElseDefault('LEADERBOARD_ENABLED', false),
    EVENTS_ENABLED: parseIfSetElseDefault('EVENTS_ENABLED', false),
    SURVEYS_ENABLED: parseIfSetElseDefault('SURVEYS_ENABLED', false),
    EASTER_EGG_ENABLED: parseIfSetElseDefault('EASTER_EGG_ENABLED', false),
    REFRESH_TIMEOUT: parseIfSetElseDefault('REFRESH_TIMEOUT', 5000),
    SKILLS_ENABLED: parseIfSetElseDefault('SKILLS_ENABLED', false),
    RAFFLE_ENTRY_COST: parseIfSetElseDefault('RAFFLE_ENTRY_COST', 10),
    PEER_FEEDBACK_LOCAL_SAVE_ENABLED: parseIfSetElseDefault(
      'PEER_FEEDBACK_LOCAL_SAVE_ENABLED',
      false
    ),
    PEER_FEEDBACK_NEW_DESIGN_ENABLED: parseIfSetElseDefault(
      'PEER_FEEDBACK_NEW_DESIGN_ENABLED',
      false
    ),
    HR_REVIEW_DASHBOARD_ENABLED: parseIfSetElseDefault(
      'HR_REVIEW_DASHBOARD_ENABLED',
      false
    ),
    CONTRACTS_DASHBOARD_ENABLED: parseIfSetElseDefault(
      'CONTRACTS_DASHBOARD_ENABLED',
      false
    ),
    HR_REVIEW_DASHBOARD_MINIMUM_PERIODS: parseIfSetElseDefault(
      'HR_REVIEW_DASHBOARD_MINIMUM_PERIODS',
      2
    ),
    HR_REVIEW_DASHBOARD_MAXIMUM_PERIODS: parseIfSetElseDefault(
      'HR_REVIEW_DASHBOARD_MAXIMUM_PERIODS',
      12
    ),
    HR_REVIEW_DASHBOARD_DEFAULT_PERIOD_LENGTH: parseIfSetElseDefault(
      'HR_REVIEW_DASHBOARD_DEFAULT_PERIOD_LENGTH',
      'month'
    ),
    REVIEW_CANARY_GROUPS: parseIfSetElseDefault('REVIEW_CANARY_GROUPS', []),
    LOGIN_RELOAD_COUNTDOWN_SECONDS: parseIfSetElseDefault(
      'LOGIN_RELOAD_COUNTDOWN_SECONDS',
      10
    ),
    ALLOW_HR_OWN_REVIEW: parseIfSetElseDefault('ALLOW_HR_OWN_REVIEW', false),
    ENVIRONMENT_NAME: getEnvironmentName(true),
    STORAGE_ACCOUNT_BASE_URL: process.env.STORAGE_ACCOUNT_PROXY_URL,
    EVENT_IMAGES_STORAGE_CONTAINER: process.env.EVENT_IMAGES_STORAGE_CONTAINER,
    MAXIMUM_IMAGE_FILE_SIZE_MB: process.env.MAXIMUM_IMAGE_FILE_SIZE_MB,
    PROGRAMMES_ENABLED: parseIfSetElseDefault('PROGRAMMES_ENABLED', false),
    FEEDBACK_FORM_DEBOUNCE_THRESHOLD_IN_MILLISECONDS: parseIfSetElseDefault(
      'FEEDBACK_FORM_DEBOUNCE_THRESHOLD_IN_MILLISECONDS',
      5000
    ),
    SEARCH_DEBOUNCE_TIME_IN_MILLISECONDS: parseIfSetElseDefault(
      'SEARCH_DEBOUNCE_TIME_IN_MILLISECONDS',
      500
    ),
    MAXIMUM_FILE_SIZE_MB: parseIfSetElseDefault('MAXIMUM_FILE_SIZE_MB', 4),
    SKILL_YEAR_CUT_OFF: parseIfSetElseDefault('SKILL_YEAR_CUT_OFF', 55),
    DEFAULT_YEAR_CUT_OFF: parseIfSetElseDefault('DEFAULT_YEAR_CUT_OFF', 100),
    SNACKBAR_DURATION: parseIfSetElseDefault('SNACKBAR_DURATION', 3000),
    FEEDBACK_DAY_IN_MONTH_DUE: parseIfSetElseDefault(
      'FEEDBACK_DAY_IN_MONTH_DUE',
      10
    ),
    SKILL_FILE_DEFAULT: parseIfSetElseDefault('SKILL_FILE_DEFAULT', 'NoFile'),
    SKILL_MAX_CHARACTER_LIMIT: parseIfSetElseDefault(
      'SKILL_MAX_CHARACTER_LIMIT',
      250
    ),
    SKILL_CERTIFICATION_EXPIRY_THRESHOLD: parseIfSetElseDefault('SKILL_CERTIFICATION_EXPIRY_THRESHOLD', 90),
    MINIMUM_CONTRACT_DURATION: parseIfSetElseDefault(
      'MINIMUM_CONTRACT_DURATION',
      3
    ),
    MAXIMUM_REVIEW_MINUTES_NOTE_CHARACTERS: parseIfSetElseDefault(
      'MAXIMUM_REVIEW_MINUTES_NOTE_CHARACTERS',
      2700
    ),
    SKILL_CURRENT_DATE: parseIfSetElseDefault('SKILL_CURRENT_DATE', 'current'),
    SKILL_MIN_SEARCH_CHARACTERS: parseIfSetElseDefault('SKILL_MIN_SEARCH_CHARACTERS', 3),
    MINIMUM_ALLOWED_YEARS_OF_EXPERIENCE: parseIfSetElseDefault('MINIMUM_ALLOWED_YEARS_OF_EXPERIENCE', 0.5),
    MAXIMUM_ALLOWED_YEARS_OF_EXPERIENCE: parseIfSetElseDefault('MAXIMUM_ALLOWED_YEARS_OF_EXPERIENCE', 60),
    COURSE_SEARCH_ENABLED: parseIfSetElseDefault('COURSE_SEARCH_ENABLED', false),
    RATING_CONTENT_ENABLED: parseIfSetElseDefault('RATING_CONTENT_ENABLED', false),
    TAG_CONTENT_ENABLED: parseIfSetElseDefault('TAG_CONTENT_ENABLED', false),
    POP_UPS_ENABLED: parseIfSetElseDefault('POP_UPS_ENABLED', false),
    ALLOWED_CORE_ATTRIBUTE_TYPES: parseIfSetElseDefault('ALLOWED_CORE_ATTRIBUTE_TYPES', [
      "skill",
      "industry-knowledge",
    ]),
    REVIEW_SYSTEM_LAUNCH_DATE: parseIfSetElseDefault('REVIEW_SYSTEM_LAUNCH_DATE', '2024-01-01T00:00:00.000Z'),
    ADDITIONAL_INFO_USERS: parseIfSetElseDefault('ADDITIONAL_INFO_USERS', '[]'),
    MAXIMUM_CORE_ATTRIBUTES_FOR_USER: parseIfSetElseDefault("MAXIMUM_CORE_ATTRIBUTES_FOR_USER", 3),
    EARLIEST_ALLOWED_STAFF_ON_SUPPLY_AS_OF_DATE: parseIfSetElseDefault("EARLIEST_ALLOWED_STAFF_ON_SUPPLY_AS_OF_DATE", '2024-01-01T00:00:00.000Z'),
    UNIT_CHANGE_REVIEWS_ENABLED: parseIfSetElseDefault('UNIT_CHANGE_REVIEWS_ENABLED', false),
    UNIT_CHANGE_REVIEW_DEADLINE_DAYS: parseIfSetElseDefault('UNIT_CHANGE_REVIEW_DEADLINE_DAYS', 14),
    REVIEWS_DASHBOARD_SUPPORTED_GROUPING_CATEGORIES: parseIfSetElseDefault('REVIEWS_DASHBOARD_SUPPORTED_GROUPING_CATEGORIES', {reviews: ["templateName", "lateness", "status", "hrRep"], contracts: ["lateness", "status", "hrRep"]}),
    LIMITED_REVIEW_USERS: parseIfSetElseDefault('LIMITED_REVIEW_USERS', []),
    UNIT_CORRECTIONS_ENABLED: parseIfSetElseDefault('UNIT_CORRECTIONS_ENABLED', false),
    ONBOARDING_ENABLED:  parseIfSetElseDefault('ONBOARDING_ENABLED', false),
    TERMINATION_ENABLED:  parseIfSetElseDefault('TERMINATION_ENABLED', false),
    SKILLS_SEARCH_SIMILARITY_SCORE_FACTOR: parseIfSetElseDefault('SKILLS_SEARCH_SIMILARITY_SCORE_FACTOR', 0.8),
    GENERATE_BIO_AD_GROUPS: parseIfSetElseDefault('GENERATE_BIO_AD_GROUPS', []),
    UNIT_MOVE_HR_REPS: parseIfSetElseDefault('UNIT_MOVE_HR_REPS', []),
    MONTHS_FROM_EMPLOYMENT_DATE_FOR_PROBATIONARY_REVIEW: parseIfSetElseDefault('MONTHS_FROM_EMPLOYMENT_DATE_FOR_PROBATIONARY_REVIEW', 6),
    DISPLAY_SKILLS_SEARCH_BY_STAFF_TABS: parseIfSetElseDefault('DISPLAY_SKILLS_SEARCH_BY_STAFF_TABS', false),
    WORK_EXPERIENCE_MIN_DATE_YEARS: parseIfSetElseDefault('WORK_EXPERIENCE_MIN_DATE_YEARS', 100),
    DISPLAY_PROOF_VALIDATION_INDICATOR_ON_SKILLS_CARDS: parseIfSetElseDefault('DISPLAY_PROOF_VALIDATION_INDICATOR_ON_SKILLS_CARDS', false),
    DISPLAY_PENDING_PROOF_VALIDATION_SKILLSHR_TAB: parseIfSetElseDefault('DISPLAY_PENDING_PROOF_VALIDATION_SKILLSHR_TAB', false),
    WORK_EXPERIENCE_MAXIMUM_OUTCOME_CHARACTER_LENGTH: parseIfSetElseDefault('WORK_EXPERIENCE_MAXIMUM_OUTCOME_CHARACTER_LENGTH', 500),
    FEEDBACK_PROVIDER_REQUEST_EMAIL_ENABLED: parseIfSetElseDefault('FEEDBACK_PROVIDER_REQUEST_EMAIL_ENABLED', false),
    MODIFY_BIO_INFORMATION_USERS: parseIfSetElseDefault('MODIFY_BIO_INFORMATION_USERS', []),
    WORK_EXPERIENCE_MAXIMUM_PROJECT_DESCRIPTION_CHARACTER_LENGTH: parseIfSetElseDefault('WORK_EXPERIENCE_MAXIMUM_PROJECT_DESCRIPTION_CHARACTER_LENGTH', 2000),
    MAXIMUM_NUMBER_OF_ALLOWED_SPOKEN_LANGUAGES: parseIfSetElseDefault('MAXIMUM_NUMBER_OF_ALLOWED_SPOKEN_LANGUAGES', 3),
  };
}

/**
 * Extract config for admin client consumption from current node environment variables
 * DO NOT EXPOSE SECRETS HERE!!!
 */
function prepareAdminConfig() {
  const config = prepareConfig();
  return config;
}

const config = express.Router();
config.get('/config.json', (req, res) => {
  const config = prepareConfig();
  res.json(config);
});

config.get('/admin.json', (req, res) => {
  const config = prepareAdminConfig();
  res.json(config);
});

const authenticated = express.Router();
authenticated.use(auth);
authenticated.use(registerLogin);
authenticated.use('/batch', batchRouter);

// TODO: RE - we still have to correct the below
// const register_routes = (router, routes) => {
//   routes.forEach((route) => router.use(require(`./${route}`)));
// };

// const register_routes_with_path = (router, path, routes) => {
//   routes.forEach((route) => router.use(require(`./${path}/${route}`)));
// };

// register_routes(authenticated, [
//   'chooseParts',
//   'claimParts',
//   'completeMission',
//   'completePrescribedCourse',
//   'quest',
//   'courses',
//   'createMessage',
//   'referenceData',
//   'createQuest',
//   'sections',
//   'messages',
//   'tracks',
//   'updateAvatar',
//   'updateQuest',
//   'userData',
//   'parts',
//   'heroes',
//   'missions',
//   'heroQuest',
//   'sideQuests',
//   'registerForSideQuest',
//   'leaderboard',
//   'addTimeToSection',
//   'learningTasks',
//   'settings',
//   'levelUps',
//   'levelUpRegister',
//   'questStatus',
//   'security',
//   'guideNotifications',
//   'guides',
//   'lastActiveDate',
//   'resumeQuest',
//   'questions',
//   'points',
//   'userPrescribedCourses',
//   'levelUpActivityAttend',
//   'groups',
//   'userPrescribedCoursesProgress',
//   'canaryRelease',
//   'votes',
//   'userInteractions',
//   'syndicates',
//   'multiplier',
//   'pointsConversion',
//   'store',
//   'rewards',
//   'addPeerFeedbackReply',
//   'peerSearch',
//   'peerFeedback',
//   'staff-overview',
//   'assignment-tracking',
//   'token',
//   'icons',
//   'tags',
//   'mediaTypes',
//   'sites',
//   'content',
//   'ratings',
//   'raffle',
//   'feedbackRetractionReason',
//   'review',
//   'staff',
//   'guideRequest',
//   'events',
//   'survey',
//   'namesAndFaces',
//   'permissions',
//   'programmes',
//   'vehicles',
//   'skills'
// ]);
authenticated.use(require('./chooseParts'));
authenticated.use(require('./claimParts'));
authenticated.use(require('./completeMission'));
authenticated.use(require('./completePrescribedCourse'));
authenticated.use(require('./quest'));
authenticated.use(require('./courses'));
authenticated.use(require('./createMessage'));
authenticated.use(require('./referenceData'));
authenticated.use(require('./createQuest'));
authenticated.use(require('./sections'));
authenticated.use(require('./messages'));
authenticated.use(require('./tracks'));
authenticated.use(require('./updateAvatar'));
authenticated.use(require('./updateQuest'));
authenticated.use(require('./userData'));
authenticated.use(require('./parts'));
authenticated.use(require('./heroes'));
authenticated.use(require('./missions'));
authenticated.use(require('./heroQuest'));
authenticated.use(require('./sideQuests'));
authenticated.use(require('./registerForSideQuest'));
authenticated.use(require('./leaderboard'));
authenticated.use(require('./addTimeToSection'));
authenticated.use(require('./learningTasks'));
authenticated.use(require('./settings'));
authenticated.use(require('./levelUps'));
authenticated.use(require('./levelUpRegister'));
authenticated.use(require('./questStatus'));
authenticated.use(securityRouter);
authenticated.use(require('./guideNotifications'));
authenticated.use(require('./guides'));
authenticated.use(require('./lastActiveDate'));
authenticated.use(require('./resumeQuest'));
authenticated.use(require('./questions'));
authenticated.use(require('./points'));
authenticated.use(require('./userPrescribedCourses'));
authenticated.use(require('./levelUpActivityAttend'));
authenticated.use(require('./groups'));
authenticated.use(require('./userPrescribedCoursesProgress'));
authenticated.use(require('./canaryRelease'));
authenticated.use(require('./votes'));
authenticated.use(require('./userInteractions'));
authenticated.use(require('./syndicates'));
authenticated.use(require('./multiplier'));
authenticated.use(require('./pointsConversion'));
authenticated.use(require('./store'));
authenticated.use(require('./rewards'));
authenticated.use(require('./addPeerFeedbackReply'));
authenticated.use(require('./peerSearch'));
authenticated.use(require('./peerFeedback'));
authenticated.use(require('./staff-overview'));
authenticated.use(require('./assignment-tracking'));
authenticated.use(require('./token'));
authenticated.use(require('./icons'));
authenticated.use(require('./tags'));
authenticated.use(require('./mediaTypes'));
authenticated.use(require('./sites'));
authenticated.use(require('./content'));
authenticated.use(require('./ratings'));
authenticated.use(require('./raffle'));
authenticated.use(require('./feedbackRetractionReason'));
authenticated.use(require('./review'));
authenticated.use(require('./staff'));
authenticated.use(require('./guideRequest'));
authenticated.use(require('./events'));
authenticated.use(require('./survey'));
authenticated.use(require('./namesAndFaces'));
authenticated.use(require('./permissions'));
authenticated.use(require('./programmes'));
authenticated.use(require('./vehicles'));
authenticated.use(require('./skills'));
authenticated.use(require('./company-entity'));
authenticated.use(require('./quest-templates'));
authenticated.use(require('./skillsProfiles'));

const admin = express.Router();
admin.use(auth);
admin.use(checkAdmin);
// register_routes_with_path(admin, 'admin', [
//   'tags.admin',
//   'mediaTypes.admin',
//   'sites.admin',
//   'content.admin'
// ]);
admin.use(require('./admin/tags.admin'));
admin.use(require('./admin/mediaTypes.admin'));
admin.use(require('./admin/sites.admin'));
admin.use(require('./admin/content.admin'));
admin.use(require('./admin/contracts.dashboard.admin'));

// register_routes(admin, [
//   'admin/userCourseProgress.admin',
//   'admin/unassignedQuests.admin',
//   'admin/allQuests.admin',
//   'admin/finishedQuests.admin',
//   'admin/adminQuest.admin',
//   'admin/allGuides.admin',
//   'admin/guidesHeroes.admin',
//   'admin/heroDetails.admin',
//   'admin/hive-calendar.admin',
//   'admin/specialisations.admin',
//   'admin/guideSpecialisations.admin',
//   'admin/allHeroMessages.admin',
//   'admin/updateQuestEndDate.admin',
//   'admin/setQuestSpecialisation.admin',
//   'admin/adminQuestComment.admin',
//   'admin/allLevelUps.admin',
//   'admin/allBBDUsers.admin',
//   'admin/restrictions.admin',
//   'admin/levelUpFacilitators.admin',
//   'admin/addSpecialisations.admin',
//   'admin/assignGuide.admin',
//   'admin/courses.admin',
//   'admin/groups.admin',
//   'admin/guideDetails.admin',
//   'admin/levelUps.admin',
//   'admin/users.admin',
//   'admin/prescribeCourses.admin',
//   'admin/rewards.admin',
//   'admin/security.admin',
//   'admin/send-email.admin',
//   'admin/sideQuests.admin',
//   'admin/staff.admin',
//   'admin/tracks.admin',
//   'admin/voting.admin',
//   'admin/peer-feedback.admin',
//   'admin/syndicates.admin',
//   'admin/vacWork.admin',
//   'admin/levelUpSyndicates',
//   'admin/programmes.admin',
//   'admin/bursarAssessment.admin',
//   'admin/retractionReason.admin',
//   'admin/orderItems.admin',
//   'admin/review.admin',
//   'admin/skills.admin',
//   'admin/events.admin',
//   'admin/survey.admin',
//   'admin/units.admin',
//   'admin/contracts.admin',
// ]);
admin.use(require('./admin/userCourseProgress.admin'));
admin.use(require('./admin/unassignedQuests.admin'));
admin.use(require('./admin/allQuests.admin'));
admin.use(require('./admin/finishedQuests.admin'));
admin.use(require('./admin/adminQuest.admin'));
admin.use(require('./admin/allGuides.admin'));
admin.use(require('./admin/guidesHeroes.admin'));
admin.use(require('./admin/heroDetails.admin'));
admin.use(require('./admin/hive-calendar.admin'));
admin.use(require('./admin/specialisations.admin'));
admin.use(require('./admin/guideSpecialisations.admin'));
admin.use(require('./admin/allHeroMessages.admin'));
admin.use(require('./admin/updateQuestEndDate.admin'));
admin.use(require('./admin/setQuestSpecialisation.admin'));
admin.use(require('./admin/adminQuestComment.admin'));
admin.use(require('./admin/allLevelUps.admin'));
admin.use(require('./admin/allBBDUsers.admin'));
admin.use(require('./admin/restrictions.admin'));
admin.use(require('./admin/levelUpFacilitators.admin'));
admin.use(require('./admin/addSpecialisations.admin'));
admin.use(require('./admin/assignGuide.admin'));
admin.use(require('./admin/courses.admin'));
admin.use(require('./admin/groups.admin'));
admin.use(require('./admin/guideDetails.admin'));
admin.use(require('./admin/levelUps.admin'));
admin.use(require('./admin/users.admin'));
admin.use(require('./admin/prescribeCourses.admin'));
admin.use(require('./admin/rewards.admin'));
admin.use(require('./admin/security.admin'));
admin.use(require('./admin/send-email.admin'));
admin.use(require('./admin/sideQuests.admin'));
admin.use(require('./admin/staff.admin'));
admin.use(require('./admin/tracks.admin'));
admin.use(require('./admin/voting.admin'));
admin.use(require('./admin/peer-feedback.admin'));
admin.use(require('./admin/syndicates.admin'));
admin.use(require('./admin/vacWork.admin'));
admin.use(require('./admin/levelUpSyndicates'));
admin.use(require('./admin/programmes.admin'));
admin.use(require('./admin/bursarAssessment.admin'));
admin.use(require('./admin/retractionReason.admin'));
admin.use(require('./admin/orderItems.admin'));
admin.use(require('./admin/review.admin'));
admin.use(require('./admin/skills.admin'));
admin.use(require('./admin/supply.admin'));
admin.use(require('./admin/events.admin'));
admin.use(require('./admin/survey.admin'));
admin.use(require('./admin/units.admin'));
admin.use(require('./admin/contracts.admin'));
admin.use(require('./admin/workExperience.admin'));

const api = express.Router();

api.use('/unsecure/', unsecureRouter);
api.use('/config/', config);
api.use(authenticated);
api.use(admin);

module.exports = api;
