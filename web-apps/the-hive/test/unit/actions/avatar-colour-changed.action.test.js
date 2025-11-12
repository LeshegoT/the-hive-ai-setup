import {
  AVATAR_COLOUR_CHANGED,
  avatarColourChanged
} from '../../../src/actions/avatar-colour-changed.action.js';

import { expect } from '@open-wc/testing';

describe('Action - AVATAR_COLOUR_CHANGED', () => {
  it('returns an new action', async () => {
    let red = 1;
    let green = 2;
    let blue = 3;

    const action = avatarColourChanged(red, green, blue);

    expect(action.type).to.equal(AVATAR_COLOUR_CHANGED);

    expect(action).to.deep.equal({
      type: AVATAR_COLOUR_CHANGED,
      red,
      green,
      blue
    });
  });
});
