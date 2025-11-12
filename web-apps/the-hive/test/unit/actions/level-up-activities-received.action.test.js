import {
  LEVEL_UP_ACTIVITIES_RECEIVED,
  levelUpActivitiesReceived
} from '../../../src/actions/level-up-activities-received.action.js';

import { expect } from '@open-wc/testing';

describe('Action - LEVEL_UP_ACTIVITIES_RECEIVED', () => {
  it('returns an new action', async () => {
    let levelUpActivities = [
      { levelUpActivityId: 1 },
      { levelUpActivityId: 2 },
      { levelUpActivityId: 3 }
    ];

    const action = levelUpActivitiesReceived(levelUpActivities);

    expect(action.type).to.equal(LEVEL_UP_ACTIVITIES_RECEIVED);
    expect(action).to.deep.equal({
      type: LEVEL_UP_ACTIVITIES_RECEIVED,
      levelUpActivities
    });
  });
});
