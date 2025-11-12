import {
  QUEST_CREATED,
  questCreated
} from '../../../src/actions/quest-created.action.js';

import { expect } from '@open-wc/testing';

describe('Action - QUEST_CREATED', () => {
  it('returns an new action', async () => {
    let quest = { questId: 1 };

    const action = questCreated(quest);

    expect(action.type).to.equal(QUEST_CREATED);
    expect(action).to.deep.equal({
      type: QUEST_CREATED,
      ...quest
    });
  });
});
