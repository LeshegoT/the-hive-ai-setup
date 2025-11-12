import {
  LAST_MONTH_POINTS_RECEIVED,
  lastMonthPointsReceived
} from '../../../src/actions/last-month-points-received.action';

import { expect } from '@open-wc/testing';

describe('Action - LAST_MONTH_POINTS_RECEIVED', () => {
  it('returns an new action', async () => {
    let points = {total: 100};

    const action = lastMonthPointsReceived(points);

    expect(action.type).to.equal(LAST_MONTH_POINTS_RECEIVED);
    expect(action).to.deep.equal({
      type: LAST_MONTH_POINTS_RECEIVED,
      points
    });
  });
});
