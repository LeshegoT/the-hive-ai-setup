import {
  QUESTIONS_AND_ANSWERS_RECEIVED,
  questionsAndAnswersReceived
} from '../../../src/actions/questions-and-answers-received.action';

import { expect } from '@open-wc/testing';

describe('Action - QUESTIONS_AND_ANSWERS_RECEIVED', () => {
  it('returns an new action', async () => {
    let data = {
      questions: [{ questionId: 1 }, { questionId: 2 }],
      answers: [
        { answerId: 1, questionId: 1 },
        { answerId: 2, questionId: 1 },
        { answerId: 3, questionId: 2 },
        { answerId: 4, questionId: 2 }
      ],
      user: [{ answerId: 1, questionId: 1 }]
    };

    const action = questionsAndAnswersReceived(data);

    expect(action.type).to.equal(QUESTIONS_AND_ANSWERS_RECEIVED);
    expect(action).to.deep.equal({
      type: QUESTIONS_AND_ANSWERS_RECEIVED,
      ...data
    });
  });
});
