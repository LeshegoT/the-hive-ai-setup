import { createSelector } from 'reselect';

export const selectAllQuestions = (state) => state.questions.all;

export const selectAllAnswers = (state) => state.questions.answers;

export const selectUserAnswers = (state) => state.questions.user;

export const selectUserAnswerHasError = (state) => state.questions.hasError;

export const selectQuestions = createSelector(
  selectAllQuestions,
  selectAllAnswers,
  selectUserAnswers,
  (allQuestions, allAnswers, userAnswers) => {
    return allQuestions.map((question) => {
      let answers = allAnswers.filter((a) => a.questionId === question.questionId);
      let userAnswer = userAnswers.find((u) => u.questionId === question.questionId);
      let correct = userAnswer && answers.find((a) => a.correctAnswer).questionAnswerId === userAnswer.questionAnswerId;

      return {
        ...question,
        answers,
        userAnswer,
        correct
      };
    });
  }
);
