import {
    SIDE_QUESTS_RECEIVED,
    sideQuestsReceived
  } from '../../../src/actions/side-quests-received.action';
  
  import { expect } from '@open-wc/testing';
  
  describe('Action - SIDE_QUESTS_RECEIVED', () => {
    it('returns an new action', async () => {
  
      let sideQuests = [
        { sideQuestId: 1, sideQuestTypeId: 1, startDate: '3000-01-01' },
        { sideQuestId: 2, sideQuestTypeId: 2, startDate: '2000-01-03' },
        { sideQuestId: 3, sideQuestTypeId: 2, startDate: '3000-01-04' }
      ];

      let expectedResults = [
        {
          sideQuestId: 1,
          sideQuestTypeId: 1,
          startDate: new Date('3000-01-01')
        },
        {
          sideQuestId: 2,
          sideQuestTypeId: 2,
          startDate: new Date('2000-01-03')
        },
        {
          sideQuestId: 3,
          sideQuestTypeId: 2,
          startDate: new Date('3000-01-04')
        }
      ];

      const action = sideQuestsReceived(sideQuests);
  
      expect(action.type).to.equal(SIDE_QUESTS_RECEIVED);
      expect(action).to.deep.equal({
        type: SIDE_QUESTS_RECEIVED,
        sideQuests: expectedResults
      });
    });
  });
  