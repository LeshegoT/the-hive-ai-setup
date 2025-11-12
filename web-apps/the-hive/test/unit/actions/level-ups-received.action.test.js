import {
  LEVEL_UPS_RECEIVED,
  levelUpsReceived
} from '../../../src/actions/level-ups-received.action.js';

import { expect } from '@open-wc/testing';

describe('Action - LEVEL_UPS_RECEIVED', () => {
  it('returns an new action', async () => {
    let levelUps = [
      { levelUpsId: 1 },
      { levelUpsId: 2 },
      { levelUpsId: 3 }
    ];

    const action = levelUpsReceived(levelUps);

    expect(action.type).to.equal(LEVEL_UPS_RECEIVED);
    expect(action).to.deep.equal({
      type: LEVEL_UPS_RECEIVED,
      levelUps
    });
  });
});
