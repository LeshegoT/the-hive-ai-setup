import {
  HERO_QUESTS_RECEIVED,
  heroQuestsReceived
} from '../../../src/actions/hero-quests-received.action';

import { expect } from '@open-wc/testing';

describe('Action - HERO_QUESTS_RECEIVED', () => {
  it('returns an new action', async () => {
    let quests = [{questId: 1}, {questId: 2}, {questId: 3}];

    const action = heroQuestsReceived(quests);

    expect(action.type).to.equal(HERO_QUESTS_RECEIVED);
    expect(action).to.deep.equal({
      type: HERO_QUESTS_RECEIVED,
      quests
    });
  });
});