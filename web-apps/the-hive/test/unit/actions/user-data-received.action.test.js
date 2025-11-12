import {
  USER_DATA_RECEIVED,
  userDataReceived
} from '../../../src/actions/user-data-received.action.js';

import { expect } from '@open-wc/testing';

describe('Action - USER_DATA_RECEIVED', () => {
  it('returns an new action', async () => {
    let userData = { userCourses: [1], userSections: [1] };

    const action = userDataReceived(userData);

    expect(action.type).to.equal(USER_DATA_RECEIVED);
    expect(action).to.deep.equal({
      type: USER_DATA_RECEIVED,
      ...userData
    });
  });
});
