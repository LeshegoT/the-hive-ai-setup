import { createSelector } from 'reselect';

export const selectMapMission = (state) => {
  if (state.map && state.map.mission)
    return state.map.mission
}
