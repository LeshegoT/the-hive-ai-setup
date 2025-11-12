import {
  USER_ANSWERS_UPDATED,
  userAnswersUpdated
} from '../../../src/actions/user-answers-updated.action';

import { expect } from '@open-wc/testing';

describe('Action - USER_ANSWERS_UPDATED', () => {
  it('returns an new action', async () => {
    let user = [
      { answerId: 1, questionId: 1 },
      { answerId: 2, questionId: 1 },
      { answerId: 3, questionId: 2 },
      { answerId: 4, questionId: 2 }
    ];

    const action = userAnswersUpdated(user);

    expect(action.type).to.equal(USER_ANSWERS_UPDATED);
    expect(action).to.deep.equal({
      type: USER_ANSWERS_UPDATED,
      user
    });
  });
});
