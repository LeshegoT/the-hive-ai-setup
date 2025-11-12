import {
  REFERENCE_DATA_RECEIVED,
  referenceDataReceived
} from '../../../src/actions/reference-data-received.action.js';

import { expect } from '@open-wc/testing';

describe('Action - REFERENCE_DATA_RECEIVED', () => {
  it('returns an new action', async () => {
    // TODO: Make this more reflective of the actual part data
    // that we're expecting. - Mike Geyser, 2019-09-10
    let referenceData = [1, 2, 3];

    const action = referenceDataReceived(referenceData);

    expect(action.type).to.equal(REFERENCE_DATA_RECEIVED);
    expect(action).to.deep.equal({
      type: REFERENCE_DATA_RECEIVED,
      referenceData
    });
  });
});
