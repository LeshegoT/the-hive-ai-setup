import {
    UPDATE_VERSION,
    updateVersion
  } from '../../../src/actions/update-version.action';
  
  import { expect } from '@open-wc/testing';
  
  describe('Action - UPDATE_VERSION', () => {
    it('returns an new action', async () => {
      const action = updateVersion();
  
      expect(action.type).to.equal(UPDATE_VERSION);
      expect(action).to.deep.equal({
        type: UPDATE_VERSION
      });
    });
  });
  