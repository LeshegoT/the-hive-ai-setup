import { RAFFLE_STATE_UPDATED, raffleStateUpdated } from '../../../src/actions/raffle.action';

import { expect } from '@open-wc/testing';

describe('Action - RAFFLE_STATE_UPDATED', () => {
  it('returns a new raffle state', async () => {

    let raffleState = 'home';
    const action = raffleStateUpdated(raffleState);


    expect(action.type).to.equal(RAFFLE_STATE_UPDATED);
    expect(action).to.deep.equal({
      type: RAFFLE_STATE_UPDATED,
      raffleState,
    });
  });
});
