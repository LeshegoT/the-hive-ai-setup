import { expect } from '@open-wc/testing';
import { tracks } from '../../../src/reducers/tracks.reducer';
import { TRACKS_RECEIVED } from '../../../src/actions/tracks-received.action';
import { initialise_reducer_test } from '../shared/reducer';


describe('Reducer - Tracks', () => {
  let initial_state = {
    all: []
  };

  let test_reducer_state = initialise_reducer_test(tracks, initial_state);

  it('should initialise correctly.', () => {
    let state = tracks(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it(`should update the state on a TRACKS_RECEIVED action.`, () => {
    let action = {
      type: TRACKS_RECEIVED,
      tracks: [{ trackId: 1 }]
    };

    let delta = {
        all: action.tracks
    };

    test_reducer_state(action, delta);
  });
});
