import {
  USER_AVATAR_RECEIVED,
  userAvatarReceived
} from '../../../src/actions/user-avatar-received.action.js';

import { expect } from '@open-wc/testing';

describe('Action - USER_AVATAR_RECEIVED', () => {
  it('returns an new action', async () => {
    let avatar = {
      avatarId: 1
    };
    let parts = [1, 2, 3];

    const action = userAvatarReceived(avatar, parts);

    expect(action.type).to.equal(USER_AVATAR_RECEIVED);
    expect(action).to.deep.equal({
      type: USER_AVATAR_RECEIVED,
      avatar,
      parts
    });
  });
});
