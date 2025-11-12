import {
    CLAIM_PARTS_CHOSEN,
    claimPartsChosen
  } from '../../../src/actions/claim-parts-chosen.action.js';
  
  import { expect } from '@open-wc/testing';
  
  describe('Action - CLAIM_PARTS_CHOSEN', () => {
    it('returns an new action', async () => {
      // TODO: Make this more reflective of the actual part data
      // that we're expecting. - Mike Geyser, 2019-09-10
      let parts = [1, 2, 3];
  
      const action = claimPartsChosen(parts);
  
      expect(action.type).to.equal(CLAIM_PARTS_CHOSEN);
      expect(action).to.deep.equal({
        type: CLAIM_PARTS_CHOSEN,
        parts
      });
    });
  });
  