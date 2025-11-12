import {
  COURSES_RECEIVED,
  coursesReceived
} from '../../../src/actions/courses-received.action.js';

import { expect } from '@open-wc/testing';

describe('Action - COURSES_RECEIVED', () => {
  it('returns an new action', async () => {
    // TODO: Make this more reflective of the actual part data
    // that we're expecting. - Mike Geyser, 2019-09-10
    let courses = [1, 2, 3];

    const action = coursesReceived(courses);

    expect(action.type).to.equal(COURSES_RECEIVED);
    expect(action).to.deep.equal({
      type: COURSES_RECEIVED,
      courses
    });
  });
});
