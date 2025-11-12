import { expect } from '@open-wc/testing';
import { selectAllTracks, selectTracks } from '../../../src/selectors/track.selectors';

describe('Selector - Track', () => {
  it('should return all tracks', () => {
    let state = {
      tracks: {
        all: [{ trackId: 1 }, { trackId: 2 }]
      }
    };

    let tracks = selectAllTracks(state);

    expect(tracks).to.deep.equal(state.tracks.all);
  });

  it('should return tracks with courses', () => {
    let tracks = [{ trackId: 1, courseIds: [1, 2] }, { trackId: 2, courseIds: [3, 4] }];
    let courses = [{ courseId: 1 }, { courseId: 2 }, { courseId: 3 }, { courseId: 4 }];

    let expected_tracks = [
      { trackId: 1, courseIds: [1, 2], courses: [{ courseId: 1 }, { courseId: 2 }] },
      { trackId: 2, courseIds: [3, 4], courses: [{ courseId: 3 }, { courseId: 4 }] }
    ];

    let actual_tracks = selectTracks.resultFunc(tracks, courses);

    expect(actual_tracks).to.deep.equal(expected_tracks);
  });

  it('should return tracks with empty array if no courses', () => {
    let tracks = [{ trackId: 1, courseIds: [1, 2] }, { trackId: 2, courseIds: [3, 4] }];

    let expected_tracks = [
      { trackId: 1, courseIds: [1, 2], courses: [] },
      { trackId: 2, courseIds: [3, 4], courses: [] }
    ];

    let actual_tracks = selectTracks.resultFunc(tracks, undefined);

    expect(actual_tracks).to.deep.equal(expected_tracks);
  });
});
