import {
    EDITING_MISSSIONS_UPDATED,
    editingMissionsUpdated
  } from '../../../src/actions/editing-missions-updated.action.js';
  
  import { expect } from '@open-wc/testing';
  
  describe('Action - EDITING_MISSSIONS_UPDATED', () => {
    it('returns an new action', async () => {
      // TODO: Make this more reflective of the actual part data
      // that we're expecting. - Mike Geyser, 2019-09-10
      let missions = [1, 2, 3];
  
      const action = editingMissionsUpdated(missions);
  
      expect(action.type).to.equal(EDITING_MISSSIONS_UPDATED);
      expect(action).to.deep.equal({
        type: EDITING_MISSSIONS_UPDATED,
        missions
      });
    });
  });
  