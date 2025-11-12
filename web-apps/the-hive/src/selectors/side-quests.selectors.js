import { createSelector } from 'reselect';
import { selectSideQuestId } from './route-data.selectors';
import { selectMissions } from './quest.selectors';
import { selectSideQuestTypes } from './reference-data.selectors';

export const selectAllSideQuests = (state) => state.sideQuests.all;
export const selectUserSideQuests = (state) => state.sideQuests.user;

export const selectSideQuestById = (state, sideQuestId) => {
  if (!state.sideQuests || !sideQuestId || !state.sideQuests.all || !state.sideQuests.user) return;


  let sideQuest = state.sideQuests.all.find((sideQuest) => sideQuest.id == sideQuestId);
  let userSideQuest = state.sideQuests.user.find(
    (s) => s.sideQuestId == sideQuestId
  );

  return {
    ...sideQuest,
    userSideQuest,
    hasRSVPed: !!userSideQuest,
    hasAttended: !!userSideQuest && userSideQuest.dateCompleted
  };
};

const getUserSideQuest = (sideQuest, user) => {
  return user.find((userSideQuest) => userSideQuest.sideQuestId == sideQuest.id);
};

export const selectSideQuests = createSelector(
  selectAllSideQuests,
  selectUserSideQuests,
  (all, user) => {
    if (!all) return;
    return all.map((sideQuest) => {
      let userSideQuest = getUserSideQuest(sideQuest, user);

      return {
        ...sideQuest,
        userSideQuest,
        hasRSVPed: !!userSideQuest,
        hasAttended: !!userSideQuest && !!userSideQuest.dateCompleted
      };
    });
  }
);

export const selectActiveSideQuests = createSelector(
  selectSideQuests,
  selectSideQuestTypes,
  (sideQuests, sideQuestTypes) => {
    if (!sideQuests) return;
    return sideQuests
      .filter((sideQuest) => sideQuest.startDate >= Date.now())
      .map((sideQuest) => {
        const type = sideQuestTypes.find((t) => t.sideQuestTypeId === sideQuest.sideQuestTypeId);

        return {
          ...sideQuest,
          type
        };
      });
  }
);

export const selectPastSideQuests = createSelector(
  selectSideQuests,
  selectSideQuestTypes,
  (sideQuests, sideQuestTypes) => {
    if (!sideQuests) return;
    return sideQuests
      .filter((sideQuest) => sideQuest.startDate < Date.now())
      .map((sideQuest) => {
        const type = sideQuestTypes.find((t) => t.sideQuestTypeId === sideQuest.sideQuestTypeId);

        return {
          ...sideQuest,
          type
        };
      });
  }
);

export const selectSideQuest = createSelector(
  selectSideQuests,
  selectSideQuestId,
  (sideQuests, sideQuestId) => {
    if (!sideQuests) return;
    return sideQuests.find((sideQuest) => sideQuest.id == sideQuestId);
  }
);
export const selectSideQuestMission = createSelector(
  selectMissions,
  selectSideQuestId,
  (missions, sideQuestId) => {
    if (!missions) return;
    return missions.find((mission) => {
      return (
        !!mission.type &&
        mission.type.sideQuestMission &&
        mission.sideQuestId == sideQuestId
      );
    });
  }
);
