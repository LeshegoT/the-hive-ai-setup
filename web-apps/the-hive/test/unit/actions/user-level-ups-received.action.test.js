import {
  USER_LEVEL_UPS_RECEIVED,
  userLevelUpsReceived
} from '../../../src/actions/user-level-ups-received.action';

import { expect } from '@open-wc/testing';

describe('Action - USER_LEVEL_UPS_RECEIVED', () => {
  it('returns an new action', async () => {
    let userLevelUps = [{levelUpId: 1}, {levelUpId: 2}];

    const action = userLevelUpsReceived(userLevelUps);

    expect(action.type).to.equal(USER_LEVEL_UPS_RECEIVED);
    expect(action).to.deep.equal({
      type: USER_LEVEL_UPS_RECEIVED,
      userLevelUps
    });
  });
});