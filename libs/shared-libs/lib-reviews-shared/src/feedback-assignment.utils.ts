import { UNIT_MOVE_REVIEW_TEMPLATE_NAME } from "./reviews-types";

export const calculateFeedbackDeadline = (reviewDueDate: Date, feedbackAssignmentTemplateName: string, feedbackDayInMonthDue: number = undefined) => {
  const feedbackDeadline = new Date(reviewDueDate);
  if (feedbackAssignmentTemplateName === UNIT_MOVE_REVIEW_TEMPLATE_NAME) {
    // Feedback is due on the same day that the review is due. No need to modify the date here.
  } else if (feedbackDayInMonthDue !== undefined) {
    feedbackDeadline.setMonth(feedbackDeadline.getMonth() - 1);
    feedbackDeadline.setDate(feedbackDayInMonthDue);
  } else {
    feedbackDeadline.setDate(feedbackDeadline.getDate() - 1);
  }
  return feedbackDeadline;
};
