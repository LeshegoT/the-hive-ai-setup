import { post, get } from './shared.js';
import { questionsAndAnswersReceived } from '../actions/questions-and-answers-received.action.js';
import { userAnswersUpdated } from '../actions/user-answers-updated.action.js';
import { userAnswerErrorUpdated } from '../actions/user-answer-error-updated.action.js';
import { BaseService } from './base.service.js';

export class QuestionService extends BaseService{
  constructor() {
    super();
  }

  async getQuestionsAndAnswers() {
    let response = await get(this.buildApiUrl('questions'));
    let data = await response.json();

    this.store.dispatch(questionsAndAnswersReceived(data));
  }

  updateUserAnswer(userAnswers, questionId, questionAnswerId) {
    let alreadyAttempted = userAnswers.find((a) => a.questionId === questionId);

    let newAnswers = [];
    if (alreadyAttempted) {
      newAnswers = userAnswers.map((answer) => {
        if (answer.questionId !== questionId) return answer;

        return {
          ...answer,
          questionAnswerId: questionAnswerId
        };
      });
    } else {
      newAnswers = [...userAnswers, { questionId, questionAnswerId }]
    }

    this.store.dispatch(userAnswersUpdated(newAnswers));
  }

  checkUserAnswers(sectionQuestions) {
    let answeredQuestions = sectionQuestions
      .filter((q) => q.userAnswer)
      .map((q) => q.userAnswer);

    post(this.buildApiUrl('answerQuestions'), { answeredQuestions });

    if (answeredQuestions.length !== sectionQuestions.length) {
      this.store.dispatch(userAnswerErrorUpdated(true));
      return false;
    }

    let incorrectAnswers = sectionQuestions.filter((q) => !q.correct);
    if (incorrectAnswers.length) {
      this.store.dispatch(userAnswerErrorUpdated(true));
      return false;
    }

    this.store.dispatch(userAnswerErrorUpdated(false));
    return true;
  }
}

export default new QuestionService();
