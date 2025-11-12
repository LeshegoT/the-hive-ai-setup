import {
    PARTS_RECEIVED,
    partsReceived
  } from '../../../src/actions/parts-received.action.js';
  
  import { expect } from '@open-wc/testing';
  
  describe('Action - PARTS_RECEIVED', () => {
    it('returns an new action', async () => {
      // TODO: Make this more reflective of the actual part data
      // that we're expecting. - Mike Geyser, 2019-09-10
      let parts = [1, 2, 3];
  
      const action = partsReceived(parts);
  
      expect(action.type).to.equal(PARTS_RECEIVED);
      expect(action).to.deep.equal({
        type: PARTS_RECEIVED,
        parts
      });
    });
  });
  