import { expect } from '@open-wc/testing';
import { courses } from '../../../src/reducers/courses.reducer';
import { COURSES_RECEIVED } from '../../../src/actions/courses-received.action';
import { USER_PRESCRIBED_COURSES_RECEIVED } from '../../../src/actions/user-prescribed-courses-received.action';
import { USER_COMPLETED_COURSES_RECEIVED } from '../../../src/actions/completed-courses-received.action';
import { initialise_reducer_test } from '../shared/reducer';


describe('Reducer - Courses', () => {
  let initial_state = {
    all: [],
    completed: [],
    prescribed: []
  };

  let test_reducer_state = initialise_reducer_test(courses, initial_state);

  it('should initialise correctly.', () => {
    let state = courses(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it(`should update the state on a COURSES_RECEIVED action.`, () => {
    let action = {
      type: COURSES_RECEIVED,
      courses: [{ courseId: 1 }]
    };

    let delta = {
        all: action.courses
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a USER_PRESCRIBED_COURSES_RECEIVED action.`, () => {
    let action = {
      type: USER_PRESCRIBED_COURSES_RECEIVED,
      courses: [{ courseId: 1 }]
    };

    let delta = {
        prescribed: action.courses
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a USER_COMPLETED_COURSES_RECEIVED action.`, () => {
    let action = {
      type: USER_COMPLETED_COURSES_RECEIVED,
      courses: [{ courseId: 1 }]
    };

    let delta = {
        completed: action.courses
    };

    test_reducer_state(action, delta);
  });
});
