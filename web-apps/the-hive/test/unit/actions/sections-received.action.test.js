import {
  SECTIONS_RECEIVED,
  sectionsReceived
} from '../../../src/actions/sections-received.action';

import { expect } from '@open-wc/testing';

describe('Action - SECTIONS_RECEIVED', () => {
  it('returns an new action', async () => {
    // TODO: Make this more reflective of the actual part data
    // that we're expecting. - Mike Geyser, 2019-09-10
    let sections = [1, 2, 3];

    const action = sectionsReceived(sections);

    expect(action.type).to.equal(SECTIONS_RECEIVED);
    expect(action).to.deep.equal({
      type: SECTIONS_RECEIVED,
      sections
    });
  });
});
