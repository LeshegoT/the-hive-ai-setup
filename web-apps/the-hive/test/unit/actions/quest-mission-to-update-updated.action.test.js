import {
  QUEST_MISSION_TO_UPDATE_UPDATED,
  questMissionToUpdateUpdated
} from '../../../src/actions/quest-mission-to-update-updated.action.js';

import { expect } from '@open-wc/testing';

describe('Action - QUEST_MISSION_TO_UPDATE_UPDATED', () => {
  it('returns an new action', async () => {
    let mission = { missionId: 1 };

    const action = questMissionToUpdateUpdated(mission);

    expect(action.type).to.equal(QUEST_MISSION_TO_UPDATE_UPDATED);
    expect(action).to.deep.equal({
      type: QUEST_MISSION_TO_UPDATE_UPDATED,
      mission
    });
  });
});
