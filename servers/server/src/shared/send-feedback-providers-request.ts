import { FeedbackLogic } from '@the-hive/lib-reviews-logic';
import { FeedbackProvidersRequest } from '@the-hive/lib-reviews-shared';
import { BadRequestDetail, isError } from '@the-hive/lib-shared';
import { validateNonEmptyString } from '@the-hive/lib-staff-logic';
import { db, withTransaction } from './db';
import { makeEmailAddress, send } from './email';
import { prepareFeedbackProvidersRequestEmailContent } from './peer-feedback';
import { persistReviewCommunication, REVIEW_COMMUNICATION_REASON_MANUAL_NUDGE, REVIEW_COMMUNICATION_TYPE_FEEDBACK_PROVIDERS_REQUEST } from './review';

const feedbackLogic = new FeedbackLogic(db);

const validateFeedbackProviderRequest = (feedbackProviderRequest: FeedbackProvidersRequest): FeedbackProvidersRequest | BadRequestDetail => {
  const validatedOrErrors = [
    validateNonEmptyString('revieweeName', feedbackProviderRequest.revieweeName),
    validateNonEmptyString('reviewerName', feedbackProviderRequest.reviewerName),
    validateNonEmptyString('hrRepName', feedbackProviderRequest.hrRepName),
    validateNonEmptyString('hrRepEmail', feedbackProviderRequest.hrRepEmail),
    validateNonEmptyString('reviewerEmail', feedbackProviderRequest.reviewerEmail),
    validateNonEmptyString('reviewMonth', feedbackProviderRequest.reviewMonth),
    validateNonEmptyString('reviewType', feedbackProviderRequest.reviewType),
    Number.isInteger(feedbackProviderRequest.reviewId) && feedbackProviderRequest.reviewId > 0 ? feedbackProviderRequest.reviewId : { message: 'reviewId must be a positive integer' },
  ];

  if (validatedOrErrors.some(error => isError(error))) {
    return {
      message: validatedOrErrors.filter(error => isError(error))
        .map(error => error.message)
        .join(', ')
      };
  } else {
    return feedbackProviderRequest;
  }
}

export async function sendFeedbackProvidersRequest(feedbackProviderRequest: FeedbackProvidersRequest, nudgeReason = REVIEW_COMMUNICATION_REASON_MANUAL_NUDGE): Promise<boolean> {
  const validatedFeedbackProviderRequestOrError = feedbackProviderRequest ? validateFeedbackProviderRequest(feedbackProviderRequest) : { message: 'Cannot send feedback providers request email. Missing feedback providers request details.' };

  if (isError(validatedFeedbackProviderRequestOrError)) {
    throw new Error(validatedFeedbackProviderRequestOrError.message);
  } else {
    return await withTransaction(async (tx) => {
      const {revieweeName, reviewerName, hrRepName, hrRepEmail, reviewerEmail, reviewMonth, reviewType, reviewId} = validatedFeedbackProviderRequestOrError;
      const {from, to, subject, context, message, image, templateFile, url} = await prepareFeedbackProvidersRequestEmailContent(
        revieweeName,
        reviewerName,
        hrRepName,
        hrRepEmail,
        reviewerEmail,
        reviewMonth,
        reviewType
      );

      const wasEmailSent = await send(from, to, subject, context, message, url, { templateFile, image, ccRecipients: [makeEmailAddress(hrRepEmail)] });

      if (wasEmailSent){
        const reviewCommunicationId = await persistReviewCommunication(
          tx,
          from,
          to,
          new Date(),
          REVIEW_COMMUNICATION_TYPE_FEEDBACK_PROVIDERS_REQUEST,
          nudgeReason
        );

        const wasReviewCommunicationReviewLinkCreated = await feedbackLogic.createReviewCommunicationReviewLink(tx, reviewId, reviewCommunicationId);

        if (wasReviewCommunicationReviewLinkCreated) {
          return true;
        } else {
          throw new Error('Failed to create review communication review link. An unexpected database error occurred when trying to create the review communication review link.');
        }
      } else {
        // Email failed to send; therefore, do not record the communication.
        return false;
      }
    });
  }
}
