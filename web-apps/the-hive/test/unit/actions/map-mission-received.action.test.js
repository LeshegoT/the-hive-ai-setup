import {
  MAP_MISSION_RECEIVED,
  mapMissionReceived
} from '../../../src/actions/map-mission-received.action.js';

  import { expect } from '@open-wc/testing';

  describe('Action - MISSION_RECEIVED', () => {
    it('returns an new action', async () => {

      let mapMission = {type:"Empty"}
      const action = mapMissionReceived(mapMission);

      expect(action).to.deep.equal({
        type: MAP_MISSION_RECEIVED,
        mapMission
      });
    });
  });
