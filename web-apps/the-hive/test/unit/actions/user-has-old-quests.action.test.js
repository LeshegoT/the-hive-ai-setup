import {
    USER_HAS_OLD_QUESTS,
    userHasOldQuests
  } from '../../../src/actions/user-has-old-quests.action';
  
  import { expect } from '@open-wc/testing';
  
  describe('Action - USER_HAS_OLD_QUESTS', () => {
    it('returns an new action', async () => {
      let quests = [
        { questId: 1 },
        { questId: 2 },
        { questId: 3 }
      ];
  
      const action = userHasOldQuests(quests);
  
      expect(action.type).to.equal(USER_HAS_OLD_QUESTS);
      expect(action).to.deep.equal({
        type: USER_HAS_OLD_QUESTS,
        quests
      });
    });
  });
  