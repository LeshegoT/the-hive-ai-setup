import {
    NEW_VERSION_PROMPT,
    newVersionPrompt
  } from '../../../src/actions/new-version-prompt.action';
  
  import { expect } from '@open-wc/testing';
  
  describe('Action - NEW_VERSION_PROMPT', () => {
    it('returns an new action', async () => {
      // TODO: Make this more reflective of the actual part data
      // that we're expecting. - Mike Geyser, 2019-09-10
      let callback = {};
  
      const action = newVersionPrompt(callback);
  
      expect(action.type).to.equal(NEW_VERSION_PROMPT);
      expect(action).to.deep.equal({
        type: NEW_VERSION_PROMPT,
        callback
      });
    });
  });
  