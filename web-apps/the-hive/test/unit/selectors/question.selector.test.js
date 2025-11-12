import { expect } from '@open-wc/testing';
import {
  selectAllQuestions,
  selectAllAnswers,
  selectUserAnswers,
  selectUserAnswerHasError,
  selectQuestions
} from '../../../src/selectors/question.selector';

describe('Selector - Question', () => {
  it('should return questions array', () => {
    let state = {
      questions: {
        all: [{ questionId: 1 }, { questionId: 2 }]
      }
    };

    let questions = selectAllQuestions(state);

    expect(questions).to.deep.equal(state.questions.all);
  });

  it('should return answers array', () => {
    let state = {
      questions: {
        answers: [{ questionAnswerId: 1 }, { questionAnswerId: 2 }]
      }
    };

    let answers = selectAllAnswers(state);

    expect(answers).to.deep.equal(state.questions.answers);
  });

  it('should return user answers array', () => {
    let state = {
      questions: {
        user: [
          { questionId: 1, questionAnswerId: 1 },
          { questionId: 2, questionAnswerId: 2 }
        ]
      }
    };

    let user = selectUserAnswers(state);

    expect(user).to.deep.equal(state.questions.user);
  });

  it('should return has error', () => {
    let state = {
      questions: {
        hasError: true
      }
    };

    let error = selectUserAnswerHasError(state);

    expect(error).to.deep.equal(state.questions.hasError);
  });

  it('should return questions with answers and user answers', () => {
    let questions = [{ questionId: 1 }, { questionId: 2 }, { questionId: 3 }];
    let answers = [
      { questionId: 1, questionAnswerId: 1, correctAnswer: true },
      { questionId: 1, questionAnswerId: 2, correctAnswer: false },
      { questionId: 2, questionAnswerId: 3, correctAnswer: false },
      { questionId: 2, questionAnswerId: 4, correctAnswer: false },
      { questionId: 2, questionAnswerId: 5, correctAnswer: true },
      { questionId: 3, questionAnswerId: 6, correctAnswer: false },
      { questionId: 3, questionAnswerId: 7, correctAnswer: true },
      { questionId: 3, questionAnswerId: 8, correctAnswer: false }
    ];
    let user = [
      { questionId: 1, questionAnswerId: 1 },
      { questionId: 3, questionAnswerId: 8 }
    ];

    let expected = [
      {
        questionId: 1,
        answers: [
          { questionId: 1, questionAnswerId: 1, correctAnswer: true },
          { questionId: 1, questionAnswerId: 2, correctAnswer: false }
        ],
        userAnswer: { questionId: 1, questionAnswerId: 1 },
        correct: true
      },
      {
        questionId: 2,
        answers: [
          { questionId: 2, questionAnswerId: 3, correctAnswer: false },
          { questionId: 2, questionAnswerId: 4, correctAnswer: false },
          { questionId: 2, questionAnswerId: 5, correctAnswer: true }
        ],
        userAnswer: undefined,
        correct: undefined
      },
      {
        questionId: 3,
        answers: [
          { questionId: 3, questionAnswerId: 6, correctAnswer: false },
          { questionId: 3, questionAnswerId: 7, correctAnswer: true },
          { questionId: 3, questionAnswerId: 8, correctAnswer: false }
        ],
        userAnswer: { questionId: 3, questionAnswerId: 8 },
        correct: false
      }
    ];

    let actual = selectQuestions.resultFunc(questions, answers, user);

    expect(actual).to.deep.equal(expected);
  });
});
