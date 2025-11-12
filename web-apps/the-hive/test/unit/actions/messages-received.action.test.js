import {
  MESSAGES_RECEIVED,
  messagesReceived
} from '../../../src/actions/messages-received.action.js';

import { expect } from '@open-wc/testing';

describe('Action - MESSAGES_RECEIVED', () => {
  it('returns an new action', async () => {
    // TODO: Make this more reflective of the actual part data
    // that we're expecting. - Mike Geyser, 2019-09-10
    let messages = [1, 2, 3];

    const action = messagesReceived(messages);

    expect(action.type).to.equal(MESSAGES_RECEIVED);
    expect(action).to.deep.equal({
      type: MESSAGES_RECEIVED,
      messages
    });
  });
});
