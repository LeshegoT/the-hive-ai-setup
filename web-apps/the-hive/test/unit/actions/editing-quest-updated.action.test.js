import {
  EDITING_QUEST_UPDATED,
  editingQuestUpdated
} from '../../../src/actions/editing-quest-updated.action.js';

import { expect } from '@open-wc/testing';

describe('Action - EDITING_QUEST_UPDATED', () => {
  it('returns an new action', async () => {
    let quest = {
      startDate: new Date('2019/01/01'),
      endDate: new Date('2019/04/01')
    };

    const action = editingQuestUpdated(quest);

    expect(action.type).to.equal(EDITING_QUEST_UPDATED);
    expect(action).to.deep.equal({
      type: EDITING_QUEST_UPDATED,
      quest
    });
  });

  /* 
    This test assumes that endDate is stored as a string in a specific format, which it shouldn't be.
    This test should be reinstated once dates are stored correctly and consistently. 
    I have logged a ticket for this.
    -- Pieter 2022
  */
  // it('sets the endDate correctly', () => {
  //   let quest = {
  //     startDate: new Date('2019/01/01'),
  //     months: 3
  //   };
  //   let endDate = '2019/04/01';

  //   const action = editingQuestUpdated(quest);

  //   expect(action.type).to.equal(EDITING_QUEST_UPDATED);
  //   expect(action).to.deep.equal({
  //     type: EDITING_QUEST_UPDATED,
  //     quest: {
  //       ...quest,
  //       endDate
  //     }
  //   });
  // })
});
