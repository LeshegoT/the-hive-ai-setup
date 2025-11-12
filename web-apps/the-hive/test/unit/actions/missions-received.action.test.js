import {
    MISSIONS_RECEIVED,
    missionsReceived
  } from '../../../src/actions/missions-received.action.js';
  
  import { expect } from '@open-wc/testing';
  
  describe('Action - MISSIONS_RECEIVED', () => {
    it('returns an new action', async () => {
      // TODO: Make this more reflective of the actual part data
      // that we're expecting. - Mike Geyser, 2019-09-10
      let missions = [1, 2, 3];
  
      const action = missionsReceived(missions);
  
      expect(action.type).to.equal(MISSIONS_RECEIVED);
      expect(action).to.deep.equal({
        type: MISSIONS_RECEIVED,
        missions
      });
    });
  });
  