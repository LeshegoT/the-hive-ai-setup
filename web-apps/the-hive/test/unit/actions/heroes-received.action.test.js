import {
    HEROES_RECEIVED,
    heroesReceived
  } from '../../../src/actions/heroes-received.action.js';
  
  import { expect } from '@open-wc/testing';
  
  describe('Action - HEROES_RECEIVED', () => {
    it('returns an new action', async () => {
      // TODO: Make this more reflective of the actual part data
      // that we're expecting. - Mike Geyser, 2019-09-10
      let heroes = [1, 2, 3];
  
      const action = heroesReceived(heroes);
  
      expect(action.type).to.equal(HEROES_RECEIVED);
      expect(action).to.deep.equal({
        type: HEROES_RECEIVED,
        heroes
      });
    });
  });
  