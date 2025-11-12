import ConfigService from '../services/config.service';

export const UPDATE_PAGE = 'UPDATE_PAGE';
export const UPDATE_OFFLINE = 'UPDATE_OFFLINE';
export const UPDATE_DRAWER_STATE = 'UPDATE_DRAWER_STATE';
export const OPEN_SNACKBAR = 'OPEN_SNACKBAR';
export const CLOSE_SNACKBAR = 'CLOSE_SNACKBAR';

export const navigateComponent = (path) => (dispatch) => {
  window.history.pushState({}, '', path);
  dispatch(navigate(path));
};

export const navigate = (path) => (dispatch) => {
  // Extract the page name from path.
  const page = path === '/' ? 'home' : path.slice(1);

  // Any other info you might want to extract from the path (like page type),
  // you can do here
  dispatch(loadPage(page));

  // Close the drawer - in case the *path* change came from a link in the drawer.
  dispatch(updateDrawerState(false));
};

/*
   We are explicitly ignoring the loadPage code for code coverage,
   because we can't *actually* stub out dynamic import - so the test
   would have a lot of side-effects. - Mike, 2019-09-30
*/
/* istanbul ignore next */
const loadPage = (page) => (dispatch) => {
  const rootPath = /^$/;
  const homePath = /^home$/;
  const mapPath = /^map$/;
  const tracksPath = /^tracks$/;
  const sideQuestsPath = /^side-quests$/;
  const sideQuestPath = /^side-quest\/?([0-9]+)*$/;
  const coursePath = /^course\/([^\/]+)(?:$|\/$)$/;
  const sectionPath = /^course\/([^\/]+)\/section\/([^\/]+)$/;
  const missionPath = /^hero\/([^\/]*)\/mission\/([^\/]+)$/;
  const aboutPath = /^about$/;
  const logPath = /^log(?:$|\/$|\/([^\/]*))$/;
  const questEditorPath = /^quest\/?([0-9]+)*$/;
  const claimPartsPath = /^claim$/;
  const heroesPath = /^heroes$/;
  const heroMissionsPath = /^missions\/([^\/]+)$/;
  const noPermissionPath = /^permission$/;
  const leaderboardPath = /^leaderboard$/;
  const settingsPath = /^settings$/;
  const levelUpsPath = /^level-ups$/;
  const levelUpPath = /^level-up\/?([0-9]+)*$/;
  const activityTypePath = /^activity-type\/([^\/]+)$/;
  const questHistoryPath = /^quest-history$/;
  const changeQuestStatusPath = /^quest\/?([0-9]+)\/([^\/]+)$/;
  const guideFeedbackPath = /^guide-feedback\/?([0-9]+)*$/;
  const attendActivityPath = /^attend-level-up\/?([0-9]+)\/activity\/?([0-9]+)$/;
  const guideRequestPath = /^guide-request$/;
  const votePath = /^vote\/?([0-9]+)*$/;
  const voteEventsPath = /^voting$/;
  const syndicatePath = /^syndicate\/?([0-9]+)*$/;
  const storePath = /^store\/?([0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12})*$/;
  const peerFeedbackPathView = /^peer-feedback\/?$/;
  const becomeGuideView = /^become-guide$/;
  const surveyView = /^surveys$/;
  const faceWall = /^facewall$/;
  const eventDetails = /^events\/([0-9]+)$/;
  const events = /^events$/;
  const skills = /^skills\/?$/;
  const programmes = /^programmes$/;
  const components = /^components$/;

  //This is a temporary workaround to a bug in the MSAL library
  //We have logged a trello card to maybe move away from MSAL: https://trello.com/c/r4gsxIXh/255-spike-move-to-hellojs-instead-of-msal
  //This workaround must be removed when that is done
  //Gery, 2019/08/28
  const nullPath = /null/;

  let match;
  let routeData = () => (match.length > 1 ? match.slice(1) : null);

  if ((match = page.match(homePath)) || (match = page.match(rootPath))) {
    import('../pages/map-home.page.js');
    dispatch(updatePage('home', routeData()));
  } else if ((match = page.match(votePath))) {
    import('../pages/voting.page.js');
    dispatch(updatePage('vote', routeData()));
  }else if ((match = page.match(voteEventsPath))) {
    import('../pages/voting-events.page.js');
    dispatch(updatePage('voting', routeData()));
  }else if ((match = page.match(tracksPath))) {
    import('../pages/tracks.page.js');
    dispatch(updatePage('tracks', routeData()));
  } else if ((match = page.match(mapPath))) {
    import('../pages/map.page.js');
    dispatch(updatePage('map', routeData()));
  } else if ((match = page.match(sideQuestsPath))) {
    import('../pages/side-quests.page.js');
    dispatch(updatePage('side-quests', routeData()));
  } else if ((match = page.match(sideQuestPath))) {
    import('../pages/side-quest.page.js');
    dispatch(updatePage('side-quest', routeData()));
  } else if ((match = page.match(coursePath))) {
    import('../pages/course.page.js');
    dispatch(updatePage('course', routeData()));
  } else if ((match = page.match(sectionPath))) {
    import('../pages/section.page.js');
    dispatch(updatePage('section', routeData()));
  } else if ((match = page.match(skills))) {
    import('../pages/skills.page.js');
    dispatch(updatePage('skills', routeData()));
  } else if ((match = page.match(aboutPath))) {
    import('../pages/about.page.js');
    dispatch(updatePage('about', routeData()));
  } else if ((match = page.match(missionPath))) {
    import('../pages/mission.page.js');
    dispatch(updatePage('mission', routeData()));
  } else if ((match = page.match(logPath))) {
    import('../pages/log.page.js');
    dispatch(updatePage('log', routeData()));
  } else if ((match = page.match(questHistoryPath))) {
    import('../pages/quest-history.page');
    dispatch(updatePage('quest-history'), routeData());
  } else if ((match = page.match(changeQuestStatusPath))) {
    import('../pages/change-quest-status.page');
    let status = routeData()[1];
    dispatch(updatePage(`${status}-quest`, routeData()));
  } else if ((match = page.match(guideFeedbackPath))) {
    import('../pages/guide-feedback.page');
    dispatch(updatePage('guide-feedback', routeData()));
  } else if ((match = page.match(guideRequestPath))) {
    import('../pages/guide-request.page');
    dispatch(updatePage('guide-request', routeData()));
  } else if ((match = page.match(questEditorPath))) {
    import('../pages/quest-editor.page.js');
    dispatch(updatePage('quest', routeData()));
  } else if ((match = page.match(claimPartsPath))) {
    import('../pages/claim-parts.page.js');
    dispatch(updatePage('claim', routeData()));
  } else if ((match = page.match(heroesPath))) {
    import('../pages/hero-quest-summary.page.js');
    dispatch(updatePage('heroes', routeData()));
  } else if ((match = page.match(heroMissionsPath))) {
    import('../pages/hero-missions.page.js');
    dispatch(updatePage('heroMissions', routeData()));
  } else if ((match = page.match(noPermissionPath))) {
    import('../pages/no-permission.page');
    dispatch(updatePage('permission', routeData()));
  } else if (ConfigService.config.LEADERBOARD_ENABLED && (match = page.match(leaderboardPath))) {
    import('../pages/leaderboard.page');
    dispatch(updatePage('leaderboard', routeData()));
  } else if ((match = page.match(storePath))) {
    import('../pages/store.page');
    dispatch(updatePage('store', routeData()));
  } else if ((match = page.match(settingsPath))) {
    import('../pages/settings.page');
    dispatch(updatePage('settings', routeData()));
  } else if ((match = page.match(attendActivityPath))) {
    import('../pages/attend-activity.page');
    dispatch(updatePage('attend-activity', routeData()));
  } else if ((match = page.match(levelUpsPath))) {
    import('../pages/level-ups.page');
    dispatch(updatePage('level-ups', routeData()));
  } else if ((match = page.match(levelUpPath))) {
    import('../pages/level-up-details.page');
    dispatch(updatePage('level-up-details', routeData()));
  } else if ((match = page.match(activityTypePath))) {
    import('../pages/activity-type.page');
    dispatch(updatePage('activity-type', routeData()));
  }
  else if ((match = page.match(peerFeedbackPathView))) {
    import('../pages/peer-feedback.page');
    import('../pages/review.page');
    import('../pages/waiting.page');
    dispatch(updatePage('peer-feedback', routeData()));
  }
  else if ((match = page.match(syndicatePath))) {
    import('../pages/level-up-syndicates.page');
    dispatch(updatePage('syndicate', routeData()));
  } else if ((match = page.match(nullPath))) {
    dispatch(navigateComponent('/'));
  } else if ((match = page.match(becomeGuideView))) {
    import('../pages/become-guide.page');
    dispatch(updatePage('become-guide', routeData()));
  } else if ((match = page.match(surveyView))) {
    import('../pages/surveys.page');
    dispatch(updatePage('surveys', routeData()));
  } else if ((match = page.match(faceWall))) {
    import('../pages/namesAndFaces.page');
    dispatch(updatePage('names-and-faces', routeData()));
  }else if ((match = page.match(eventDetails))) {
    import('../pages/events-details.page.js');
    dispatch(updatePage('events-details', routeData()));
  } else if ((match = page.match(events))) {
    import('../pages/events.page');
    dispatch(updatePage('events', routeData()));
  } else if ((match = page.match(programmes))) {
    import('../pages/programmes.page');
    dispatch(updatePage('programmes', routeData()));
  } else if ((match = page.match(components))) {
    import('../pages/app-components.page');
    dispatch(updatePage('components', routeData()));
  } else {
    page = 'view404';
    import('../pages/not-found.page.js');
    dispatch(updatePage(page));
  }

  if (window.ga) {
    window.ga('set', 'page', page);
  }

  // Scroll to the top of the screen.
  window.scroll({
    top: 0,
    left: 0
  });
};

const updatePage = (page, routeData) => {
  return {
    type: UPDATE_PAGE,
    page,
    routeData
  };
};

let snackbarTimer;

export const showSnackbar = () => (dispatch) => {
  dispatch({
    type: OPEN_SNACKBAR
  });
  window.clearTimeout(snackbarTimer);
  snackbarTimer = window.setTimeout(
    () =>
      dispatch({
        type: CLOSE_SNACKBAR
      }),
    3000
  );
};

export const updateOffline = (offline) => (dispatch, getState) => {
  // Show the snackbar only if offline status changes.
  if (offline !== getState().app.offline) {
    dispatch(showSnackbar());
  }
  dispatch({
    type: UPDATE_OFFLINE,
    offline
  });
};

export const updateDrawerState = (opened) => {
  return {
    type: UPDATE_DRAWER_STATE,
    opened
  };
};
