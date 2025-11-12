import { expect } from '@open-wc/testing';
import { initialise_reducer_test, test_reducer_action } from '../shared/reducer';
import { questions } from '../../../src/reducers/questions.reducer';
import { QUESTIONS_AND_ANSWERS_RECEIVED } from '../../../src/actions/questions-and-answers-received.action';
import { USER_ANSWERS_UPDATED } from '../../../src/actions/user-answers-updated.action';
import { USER_ANSWER_ERROR_UPDATED } from '../../../src/actions/user-answer-error-updated.action';

describe('Reducer - Questions', () => {
  let initial_state = {
    all: [],
    answers: [],
    user: [],
    hasError: false
  };

  let test_reducer_state = initialise_reducer_test(questions, initial_state);

  it('should initialise correctly.', () => {
    let state = questions(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it(`should update the state on a QUESTIONS_AND_ANSWERS_RECEIVED action.`, () => {
    let action = {
      type: QUESTIONS_AND_ANSWERS_RECEIVED,
      questions: [{ questionId: 1 }, { questionId: 2 }],
      answers: [
        { answerId: 1, questionId: 1 },
        { answerId: 2, questionId: 1 },
        { answerId: 3, questionId: 2 },
        { answerId: 4, questionId: 2 }
      ],
      user: [{ answerId: 1, questionId: 1 }]
    };

    let delta = {
      all: action.questions,
      answers: action.answers,
      user: action.user
    };

    test_reducer_state(action, delta);
  });

  test_reducer_action(questions, initial_state, USER_ANSWERS_UPDATED, {
    user: [{ answerId: 1, questionId: 1 }]
  });

  test_reducer_action(questions, initial_state, USER_ANSWER_ERROR_UPDATED, { hasError: true });
});
