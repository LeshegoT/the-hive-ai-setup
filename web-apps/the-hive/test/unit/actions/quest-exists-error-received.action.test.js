import {
    QUEST_EXISTS_ERROR_RECEIVED,
    questExistsErrorReceived
  } from '../../../src/actions/quest-exists-error-received.action.js';
  
  import { expect } from '@open-wc/testing';
  
  describe('Action - QUEST_EXISTS_ERROR_RECEIVED', () => {
    it('returns an new action', async () => {
      let quest = { questId: 1 };
  
      const action = questExistsErrorReceived(quest);
  
      expect(action.type).to.equal(QUEST_EXISTS_ERROR_RECEIVED);
      expect(action).to.deep.equal({
        type: QUEST_EXISTS_ERROR_RECEIVED,
        quest
      });
    });
  });
  