import {
  TRACKS_RECEIVED,
  tracksReceived
} from '../../../src/actions/tracks-received.action.js';

import { expect } from '@open-wc/testing';

describe('Action - TRACKS_RECEIVED', () => {
  it('returns an new action', async () => {
    // TODO: Make this more reflective of the actual part data
    // that we're expecting. - Mike Geyser, 2019-09-10
    let tracks = [1, 2, 3];

    const action = tracksReceived(tracks);

    expect(action.type).to.equal(TRACKS_RECEIVED);
    expect(action).to.deep.equal({
      type: TRACKS_RECEIVED,
      tracks
    });
  });
});
