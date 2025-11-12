import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { QuestionService } from '../../../src/services/question.service';
import { QUESTIONS_AND_ANSWERS_RECEIVED } from '../../../src/actions/questions-and-answers-received.action';
import { USER_ANSWERS_UPDATED } from '../../../src/actions/user-answers-updated.action';
import { USER_ANSWER_ERROR_UPDATED } from '../../../src/actions/user-answer-error-updated.action';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';
import { StoreStub } from '../shared/stubs/store.stub';

describe('Service - QuestionService', () => {
  let questionService;
  let dispatch_spy;

  before(() => {
    questionService = new QuestionService();
    questionService._store=new StoreStub();
    dispatch_spy = sinon.spy(questionService.store, 'dispatch');
  });

  afterEach(() => dispatch_spy.resetHistory());

  it('should initialise correctly.', () => {
    expect(questionService.config).to.be.ok;
    expect(questionService.store).to.be.ok;
  });

  describe('getQuestionsAndAnswers', () => {
    let data = { questions: [], answers: [], user: [] };

    before(() => fetch_stub_returns_json(data));

    after(() => fetch_stub.reset());

    it('should dispatch action when data returns', async () => {
      let expected_action = {
        type: QUESTIONS_AND_ANSWERS_RECEIVED,
        ...data
      };

      await questionService.getQuestionsAndAnswers();

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('updateUserAnswer', () => {
    let userAnswers = [
      { questionId: 1, questionAnswerId: 1 },
      { questionId: 2, questionAnswerId: 2 }
    ];

    it('should update the user answer if previously answered', () => {
      let user = [
        { questionId: 1, questionAnswerId: 3 },
        { questionId: 2, questionAnswerId: 2 }
      ];
      let questionId = 1;
      let questionAnswerId = 3;
      let expected_action = {
        type: USER_ANSWERS_UPDATED,
        user
      };

      questionService.updateUserAnswer(userAnswers, questionId, questionAnswerId);

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });

    it('should add the new user answer if not answered', () => {
      let user = [
        { questionId: 1, questionAnswerId: 1 },
        { questionId: 2, questionAnswerId: 2 },
        { questionId: 3, questionAnswerId: 3 }
      ];
      let questionId = 3;
      let questionAnswerId = 3;
      let expected_action = {
        type: USER_ANSWERS_UPDATED,
        user
      };

      questionService.updateUserAnswer(userAnswers, questionId, questionAnswerId);

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('checkUserAnswers', () => {
    before(() => fetch_stub_returns_json({}));

    after(() => {
      fetch_stub.reset();
    });

    it('should return false if not all questions are answered', () => {
      let sectionQuestions = [
        { questionId: 1, userAnswer: { questionId: 1 } },
        { questionId: 2, userAnswer: undefined }
      ];
      let expected_action = {
        type: USER_ANSWER_ERROR_UPDATED,
        hasError: true
      };

      let actual = questionService.checkUserAnswers(sectionQuestions);

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
      expect(actual).to.be.false;
    });

    it('should return false if questions have the wrong answer', () => {
      let sectionQuestions = [
        {
          questionId: 1,
          userAnswer: { questionId: 1, questionAnswerId: 1 },
          correct: true
        },
        {
          questionId: 2,
          userAnswer: { questionId: 2, questionAnswerId: 2 },
          correct: false
        }
      ];
      let expected_action = {
        type: USER_ANSWER_ERROR_UPDATED,
        hasError: true
      };

      let actual = questionService.checkUserAnswers(sectionQuestions);

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
      expect(actual).to.be.false;
    });

    it('should return true if questions have correct answers', () => {
        let sectionQuestions = [
          {
            questionId: 1,
            userAnswer: { questionId: 1, questionAnswerId: 1 },
            correct: true
          },
          {
            questionId: 2,
            userAnswer: { questionId: 2, questionAnswerId: 2 },
            correct: true
          }
        ];
        let expected_action = {
          type: USER_ANSWER_ERROR_UPDATED,
          hasError: false
        };

        let actual = questionService.checkUserAnswers(sectionQuestions);

        expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
        expect(actual).to.be.true;
      });
  });
});
