import {
  USER_PRESCRIBED_COURSES_RECEIVED,
  userPrescribedCoursesReceived
} from '../../../src/actions/user-prescribed-courses-received.action';

import { expect } from '@open-wc/testing';

describe('Action - USER_PRESCRIBED_COURSES_RECEIVED', () => {
  it('returns an new action', async () => {
    let courses = [
      { courseId: 100, dateCompleted: '2019-01-01' },
      { courseId: 101, dateCompleted: null },
    ];

    const action = userPrescribedCoursesReceived(courses);

    expect(action.type).to.equal(USER_PRESCRIBED_COURSES_RECEIVED);
    expect(action).to.deep.equal({
      type: USER_PRESCRIBED_COURSES_RECEIVED,
      courses
    });
  });
});
