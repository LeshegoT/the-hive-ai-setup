import { createSelector } from 'reselect';
import { selectLevels } from './reference-data.selectors';

export const selectCurrentAvatarBody = (state) => state.avatar.body;

export const selectAvatarBody = createSelector(
  selectCurrentAvatarBody,
  selectLevels,
  (body, levels) => {
    if (!body) return;

    const level = levels.find((l) => l.levelId === body.levelId);
    return {
      ...body,
      level
    };
  }
);

export const selectAllParts = (state) => state.avatar.all;

export const selectAllLevelParts = createSelector(
  selectAllParts,
  selectCurrentAvatarBody,
  (all, body) => all.filter((p) => p.levelId === body.levelId)
);

export const selectCurrentUserParts = (state) => state.avatar.parts;

const partsObject = {
  right: [],
  accessory: [],
  pattern: [],
  left: []
};

const reducePartsArray = (grouped, current) => {
  let partsOfType = grouped[current.partType] || [];

  partsOfType = [...partsOfType, current];
  grouped[current.partType] = partsOfType;

  return grouped;
};

export const selectUserParts = createSelector(
  selectAllParts,
  selectCurrentUserParts,
  selectCurrentAvatarBody,
  (all, userParts, body) => {
    return userParts
      .map((user) => {
        let part = all.find((p) => p.partId === user.partId);

        return {
          ...user,
          ...part
        };
      })
      .filter((p) => p.levelId === body.levelId)
      .reduce(reducePartsArray, { ...partsObject });
  }
);

export const selectActiveParts = createSelector(selectUserParts, (parts) => {
  let wat = Object.keys(parts)
    .map((key) => ({
      [key]: parts[key].find((p) => p.active)
    }))
    .reduce((g, c) => ({ ...g, ...c }), {});

  return wat;
});

export const selectNumberOfPartsAvailable = (state) =>
  state.avatar.numberOfPartsAvailable;

export const selectAllClaimParts = (state) => state.avatar.claimParts;

export const selectClaimParts = createSelector(
  selectAllClaimParts,
  selectAllLevelParts,
  (claimParts, allParts) =>
    claimParts.map((claimPart) => {
      let part = allParts.find((p) => p.partId === claimPart.partId) || {};
      return { ...claimPart, ...part };
    })
);

export const selectAvailableParts = createSelector(
  selectAllLevelParts,
  selectCurrentUserParts,
  selectAllClaimParts,
  (allParts, userParts, claimParts) =>
    allParts
      .map((part) => {
        let user = userParts.find((p) => p.partId === part.partId);
        if (user) return;

        let selectable = claimParts.find(
          (p) => (p.partId === part.partId || !p.partId) && p.partType == part.partType
        );

        return {
          ...part,
          selectable
        };
      })
      .filter((p) => p)
      .reduce(reducePartsArray, { ...partsObject })
);
