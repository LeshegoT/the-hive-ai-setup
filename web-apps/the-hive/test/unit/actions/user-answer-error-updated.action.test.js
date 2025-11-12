import {
    USER_ANSWER_ERROR_UPDATED,
    userAnswerErrorUpdated
  } from '../../../src/actions/user-answer-error-updated.action';
  
  import { expect } from '@open-wc/testing';
  
  describe('Action - USER_ANSWER_ERROR_UPDATED', () => {
    it('returns an new action', async () => {
      let hasError = true;
  
      const action = userAnswerErrorUpdated(hasError);
  
      expect(action.type).to.equal(USER_ANSWER_ERROR_UPDATED);
      expect(action).to.deep.equal({
        type: USER_ANSWER_ERROR_UPDATED,
        hasError
      });
    });
  });
  