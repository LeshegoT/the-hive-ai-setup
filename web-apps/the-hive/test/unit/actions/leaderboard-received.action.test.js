import {
  LEADERBOARD_RECEIVED,
  leaderboardReceived
} from '../../../src/actions/leaderboard-received.action';

import { expect } from '@open-wc/testing';

describe('Action - LEADERBOARD_RECEIVED', () => {
  it('returns an new action', async () => {
    let heroes = [{upn: 'test1@bbd.co.za', score: 100}, {upn: 'test2@bbd.co.za', score: 50}, {upn: 'test3@bbd.co.za', score: 0}];

    const action = leaderboardReceived(heroes);

    expect(action.type).to.equal(LEADERBOARD_RECEIVED);
    expect(action).to.deep.equal({
      type: LEADERBOARD_RECEIVED,
      heroes
    });
  });
});