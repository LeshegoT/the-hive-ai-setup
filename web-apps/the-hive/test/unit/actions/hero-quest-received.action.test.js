import {
    HERO_QUEST_RECEIVED,
    heroQuestReceived
  } from '../../../src/actions/hero-quest-received.action';
  
  import { expect } from '@open-wc/testing';
  
  describe('Action - HERO_QUEST_RECEIVED', () => {
    it('returns an new action', async () => {
      // TODO: Make this more reflective of the actual part data
      // that we're expecting. - Mike Geyser, 2019-09-10
      let quest = [1, 2, 3];
  
      const action = heroQuestReceived(quest);
  
      expect(action.type).to.equal(HERO_QUEST_RECEIVED);
      expect(action).to.deep.equal({
        type: HERO_QUEST_RECEIVED,
        quest
      });
    });
  });
  