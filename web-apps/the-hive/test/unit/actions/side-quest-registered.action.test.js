import {
    SIDE_QUEST_REGISTERED,
    sideQuestRegistered
  } from '../../../src/actions/side-quest-registered.action.js';
  
  import { expect } from '@open-wc/testing';
  
  describe('Action - SIDE_QUEST_REGISTERED', () => {
    it('returns an new action', async () => {
      let sideQuest = { sideQuestId: 1 };
  
      const action = sideQuestRegistered(sideQuest);
  
      expect(action.type).to.equal(SIDE_QUEST_REGISTERED);
      expect(action).to.deep.equal({
        type: SIDE_QUEST_REGISTERED,
        sideQuest
      });
    });
  });
  