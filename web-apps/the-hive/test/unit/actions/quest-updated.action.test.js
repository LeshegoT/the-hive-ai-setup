import {
  QUEST_UPDATED,
  questUpdated
} from '../../../src/actions/quest-updated.action.js';

import { expect } from '@open-wc/testing';

describe('Action - QUEST_UPDATED', () => {
  it('returns an new action', async () => {
    let quest = { questId: 1 };

    const action = questUpdated(quest);

    expect(action.type).to.equal(QUEST_UPDATED);
    expect(action).to.deep.equal({
      type: QUEST_UPDATED,
      ...quest
    });
  });
});
