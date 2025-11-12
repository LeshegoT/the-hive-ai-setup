import {
    HERO_MISSIONS_RECEIVED,
    heroMissionsReceived
  } from '../../../src/actions/hero-missions-received.action';
  
  import { expect } from '@open-wc/testing';
  
  describe('Action - HERO_MISSIONS_RECEIVED', () => {
    it('returns an new action', async () => {
      // TODO: Make this more reflective of the actual part data
      // that we're expecting. - Mike Geyser, 2019-09-10
      let missions = [1, 2, 3];
  
      const action = heroMissionsReceived(missions);
  
      expect(action.type).to.equal(HERO_MISSIONS_RECEIVED);
      expect(action).to.deep.equal({
        type: HERO_MISSIONS_RECEIVED,
        missions
      });
    });
  });
  