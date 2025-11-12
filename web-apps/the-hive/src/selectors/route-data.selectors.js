import { createSelector } from 'reselect';

export const selectRouteData = (state) => state.app.routeData;

export const createRouteDataSelector = (i) =>
  createSelector(
    selectRouteData,
    (routeData) => routeData && routeData[i]
  );

export const selectCourseCode = createRouteDataSelector(0);
export const selectSectionCode = createRouteDataSelector(1);
export const selectStatusCode = createRouteDataSelector(1);
export const selectMissionId = createRouteDataSelector(1);
export const selectQuestId = createRouteDataSelector(0);
export const selectSideQuestId = createRouteDataSelector(0);
export const selectLevelUpId = createRouteDataSelector(0);
export const selectLevelUpActivityTypeCode = createRouteDataSelector(0);
export const selectLevelUpActivityId = createRouteDataSelector(1);
export const selectVotingEventId = createRouteDataSelector(0);
export const selectGuid = createRouteDataSelector(0);

export const selectHeroUserPrincipleName = createSelector(
  selectRouteData,
  (routeData) => {
    if (!routeData || !routeData[0]) {
      return undefined;
    }

    let decodedString;
    try {
      decodedString = atob(routeData[0]);
    } catch (ex) {
      return undefined;
    }

    if (decodedString && decodedString.match(/.*@.*/)) {
      return decodedString;
    }

    return undefined;
  }
);
