import {
  CLAIM_PARTS_RECEIVED,
  claimPartsReceived
} from '../../../src/actions/claim-parts-received.action.js';

import { expect } from '@open-wc/testing';

describe('Action - CLAIM_PARTS_RECEIVED', () => {
  it('returns an new action', async () => {
    // TODO: Make this more reflective of the actual part data
    // that we're expecting. - Mike Geyser, 2019-09-10
    let claimParts = [1, 2, 3];

    const action = claimPartsReceived(claimParts);

    expect(action.type).to.equal(CLAIM_PARTS_RECEIVED);
    expect(action).to.deep.equal({
      type: CLAIM_PARTS_RECEIVED,
      claimParts
    });
  });
});
