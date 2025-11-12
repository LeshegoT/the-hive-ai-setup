import {
  AVATAR_PARTS_CHANGED,
  avatarPartsChanged
} from '../../../src/actions/avatar-parts-changed.action.js';

import { expect } from '@open-wc/testing';

describe('Action - AVATAR_PARTS_CHANGED', () => {
  it('returns an new action', async () => {
    // TODO: Make this more reflective of the actual part data
    // that we're expecting. - Mike Geyser, 2019-09-10
    let parts = [1, 2, 3];

    const action = avatarPartsChanged(parts);

    expect(action.type).to.equal(AVATAR_PARTS_CHANGED);
    expect(action).to.deep.equal({
      type: AVATAR_PARTS_CHANGED,
      parts
    });
  });
});
