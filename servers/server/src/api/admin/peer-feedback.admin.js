const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { randomUUID } = require('crypto');
const { send } = require('../../shared/email');
const {
  createReviewWithAssignments,
  insertIntoReviewCommunication,
  REVIEW_COMMUNICATION_TYPE_REVIEWER_EMAIL,
  REVIEW_COMMUNICATION_REASON_MANUAL_NUDGE,
} = require('../../shared/review');

const {
  addOrUpdateFeedbackAssignments,
  allFeedbackAssignments,
  all_reviewee_feedback_messages_bar_graph_visualisation,
  updateStatusOfReviewBasedOnFeedbackAssignments,
  allRevieweeAssignedFeedbackMessages,
  allRevieweeVoluntaryFeedbackMessages,
  allFeedback,
  getFeedbackAssignmentTemplate,
  getSyndicateIdeaTeamMembers,
  addGuestReviewer,
  createNewFeedbackTemplate,
  updateFeedbackTemplate,
  addNewLevelUpFeedbackAssignment,
  getOutstandingLevelUpFeedbackAssignments,
  getLevelUpFeedbackAssignments,
  removeAssignedFeedback,
  findReviewerInStaff,
  findReviewerForFeedbackAssignment,
  removeFeedbackTemplateQuestion,
  addFeedbackTemplateQuestion,
  retrieveFilteredReviews,
  allReviewAssignments,
  updateStaffReviewDeadline,
  getPreviousReviewId,
  updateReviewRepresentative,
  getReviewComments,
  getReviewMeetingMinutes,
  getCurrentDayAssignmentNudges,
  getAssignmentAllowedStatusProgressions,
  createReview,
  reviewPeerMessages,
  getReview,
  reviewSelfMessages,
  retrieveTemplateReviewsInRange,
  voluntaryFeedbackMessagesInRange,
  archiveReview,
  retractFeedbackAssignment,
  getNewStatusId,
  getUpcomingReviewComments,
  addUpcomingReviewComment,
  updateUpcomingReviewType,
  addStaffMemberComment,
  getStaffMemberComments,
  getAllStaffReviewComments,
  getAllReviewsComments,
  addOrUpdateReviewNotes,
  addTemporaryReviewHrRep,
  getStaffMemberLatestComment,
  getUPN,
  deleteStaffMemberComment,
  retrieveReviewMeetingMinutesAttendees,
  deleteMeetingMinutesAttendees,
  insertMeetingMinutesAttendees,
} = require('../../queries/peer-feedback.queries');
const { withTransaction } = require('../../shared/db');
const { allDeletedFeedback } = require('../../queries/peer-feedback.queries');
const queue = require('../../shared/queue');
const { prepareFeedbackEmailContent } = require('../../shared/peer-feedback');

const {
  updateReviewStatus,
} = require('../../queries/review.queries');
const { parseIfSetElseDefault } = require('@the-hive/lib-core');
const { ReviewsLogic } = require('@the-hive/lib-reviews-logic');
require('core-js/actual/set');
const feedbackDayInMonthDue = parseIfSetElseDefault(
  'FEEDBACK_DAY_IN_MONTH_DUE',
  10
);
const { db } = require('../../shared/db');
const { isError } = require('@the-hive/lib-shared');
const { calculateFeedbackDeadline } = require('@the-hive/lib-reviews-shared');

const MAXIMUM_REVIEW_MINUTES_NOTE_CHARACTERS = parseIfSetElseDefault("MAXIMUM_REVIEW_MINUTES_NOTE_CHARACTERS", 4000);
const reviewsLogic = new ReviewsLogic(db);

const addOrUpdateReviewFeedbackAssignment = async (
  tx,
  reviewer,
  review,
  feedbackAssignmentTemplate,
  feedbackDeadline,
  createdBy,
  reviewId
) => {
  const newStatusId = (await getNewStatusId())?.feedbackAssignmentStatusId;

  if (newStatusId) {
    const feedbackAssignmentId = await addOrUpdateFeedbackAssignments(
      tx,
      reviewer.reviewer.toLowerCase(),
      createdBy.toLowerCase(),
      feedbackDeadline,
      reviewId,
      newStatusId,
      reviewer.clientEmail
    );

    const findReviewer = await findReviewerInStaff(
      reviewer.reviewer.toLowerCase()
    );
    if (!findReviewer) {
      const uuid = randomUUID();
      await addGuestReviewer(tx, feedbackAssignmentId, uuid);
    } else {
      // Reviewer is staff do not add as guest
    }

    return {
      reviewee: review.reviewee,
      reviewer: reviewer.reviewer.toLowerCase(),
      assignedBy: createdBy.toLowerCase(),
      feedbackAssignmentTemplate,
      dueBy: feedbackDeadline,
      clientEmail: reviewer.clientEmail,
      feedbackAssignmentId,
    };
  } else {
    throw new Error(
      `Failed to retrieve the feedbackAssignmentStatusId, to save the feedback assignment of review ${reviewId}`
    );
  }
};

router.post(
  '/reviews/:reviewId/assignments',
  handle_errors(async (req, res) => {
    try {
      const { assignedTo: reviewers, feedbackAssignmentTemplateId } = req.body;

      const reviewId = Number(req.params.reviewId);
      const feedbackAssignmentTemplateNumber = Number(feedbackAssignmentTemplateId);
      const createdBy = res.locals.upn;

      if (!Number.isInteger(reviewId) || reviewId < 1) {
        res.status(400).send({ message: 'Review ID must be a positive integer.' });
      } else if (!Number.isInteger(feedbackAssignmentTemplateNumber) || feedbackAssignmentTemplateNumber < 1) {
        res.status(400).send({ message: 'Feedback template ID must a positive integer.' });
      } else if (reviewers === undefined || reviewers.length === 0) {
        res.status(400).send({ message: 'Feedback provider(s) details are required.' });
      } else {
        const review = await getReview(reviewId);
        if (review) {
          if (review.exclusiveToReviewer && reviewers.some((assignment) => assignment.reviewer !== review.manager)) {
            res.status(400).json({ message: 'Only reviewer may be assigned' });
          } else {
            const feedbackAssignmentTemplate = await getFeedbackAssignmentTemplate(feedbackAssignmentTemplateNumber);
            if(feedbackAssignmentTemplate.requiresFeedback) {
              const feedbackDeadline = calculateFeedbackDeadline(new Date(review.dueDate), feedbackAssignmentTemplate.templateName, feedbackDayInMonthDue);

              await withTransaction(async (tx) => {
                for (const reviewer of reviewers) {
                  const data = await addOrUpdateReviewFeedbackAssignment(
                    tx,
                    reviewer,
                    review,
                    feedbackAssignmentTemplate,
                    feedbackDeadline,
                    createdBy,
                    reviewId
                  );

                  await updateStatusOfReviewBasedOnFeedbackAssignments(
                    tx,
                    reviewId,
                    data.assignedBy.toLowerCase()
                  );

                  await queue.enqueue('assignment-queue', data);
                }
              });
              res.status(201).send();
            } else {
              res.status(400).json({ message: 'This review type does not allow for feedback assignments.' });
            }
          }
        } else {
          res.status(404).json({ message: 'Cannot find given review.' });
        }
      }
    } catch (error) {
      res.status(500).json({ error });
    }
  })
);

router.post(
  '/review',
  handle_errors(async (req, res) => {
    const {
      about,
      assignedTo: reviewers,
      dueBy,
      feedbackAssignmentTemplateId,
    } = req.body;

    const createdBy = res.locals.upn;
    const reviewDeadline = new Date(dueBy);

    await withTransaction(async (tx) => {
      await createReviewWithAssignments(
        tx,
        about,
        reviewers,
        createdBy,
        createdBy,
        reviewDeadline,
        feedbackAssignmentTemplateId
      );
    });

    res.status(201).send();
  })
);

router.post(
  '/assignment/syndicate',
  handle_errors(async (req, res) => {
    const assignedBy = res.locals.upn;
    const feedbackAssignmentTemplateId = 4;
    const twoWeeksInMilliseconds = 1000 * 60 * 60 * 24 * 14;
    const dueBy = new Date(Date.now() + twoWeeksInMilliseconds);
    try {
      const { levelUpID, syndicateIdeaIds } = req.body;
      const feedbackAssignmentTemplate = await getFeedbackAssignmentTemplate(
        feedbackAssignmentTemplateId
      );
      const checkLevelUpAssignmentExists = await getLevelUpFeedbackAssignments(
        levelUpID
      );

      await withTransaction(async (tx) => {
        for (const id of syndicateIdeaIds) {
          const teamMembers = await getSyndicateIdeaTeamMembers(id);
          const members = teamMembers.map((member) => member.userPrincipleName);

          for (let i = 0; i < members.length; i++) {
            const revieweeMember = members[i];

            let reviewId;
            if (checkLevelUpAssignmentExists.length == 0) {
              reviewId = await createReview(
                tx,
                assignedBy,
                assignedBy,
                dueBy,
                revieweeMember,
                feedbackAssignmentTemplateId,
                3 // TODO - RE - Fix
              );
            } else {
              reviewId = checkLevelUpAssignmentExists.find(
                (assignment) => assignment.reviewee == revieweeMember
              ).reviewId;
            }

            for (const reviewer of members) {
              const data = {
                reviewee: revieweeMember,
                reviewer: reviewer,
                assignedBy: assignedBy,
                feedbackAssignmentTemplate: feedbackAssignmentTemplate,
              };
              if (checkLevelUpAssignmentExists.length == 0) {
                const feedbackAssignmentId = await addOrUpdateFeedbackAssignments(
                  tx,
                  data.reviewer.toLowerCase(),
                  data.assignedBy.toLowerCase(),
                  new Date(dueBy),
                  reviewId,
                  1 // TODO - RE - Fix
                );
                await addNewLevelUpFeedbackAssignment(
                  tx,
                  levelUpID,
                  feedbackAssignmentId
                );
                data.feedbackAssignmentId = feedbackAssignmentId;
              }
              const outstandingFeedback =
                await getOutstandingLevelUpFeedbackAssignments(
                  levelUpID,
                  reviewer,
                  members[i]
                );
              if (outstandingFeedback[0] != undefined) {
                data.feedbackAssignmentId =
                  outstandingFeedback[0].feedbackAssignmentID;
                await queue.enqueue('assignment-queue', data);
              }
            }
          }
        }
      });

      res.status(201).send();
    } catch (error) {
      res.status(400).send(error);
    }
  })
);

router.get(
  '/assignment/',
  handle_errors(async (req, res) => {
    let assignments = {};
    const {
      page,
      size,
      status = null,
      dueBy = null,
      template = null,
      assignedBy = null,
      general = null,
    } = req.query;

    if (page && size) {
      assignments = await allFeedbackAssignments(
        page,
        size,
        status,
        dueBy,
        template,
        assignedBy,
        general
      );
      const overallAssignmentCount = assignments[0]
        ? assignments[0].overallCount
        : 0;
      const result = {
        pageInfo: {
          pageNumber: page,
          pageSize: size,
          resultSetSize: overallAssignmentCount,
          totalPages: Math.ceil(overallAssignmentCount / size),
        },
        data: assignments,
      };

      res.json(result);
    }

    res.status(404).send();
  })
);

router.get(
  '/review',
  handle_errors(async (req, res) => {
    const {
      page,
      size,
      statusId,
      createdBy,
      searchText,
      archived,
    } = req.query;

    let {
      from,
      to,
    } = req.query;

    if (page && size) {
      if (from) {
        from = new Date(from).toISOString();
      }
      if (to) {
        to = new Date(to).toISOString();
      }

      let reviews = await retrieveFilteredReviews(
        page,
        size,
        statusId,
        createdBy,
        from,
        to,
        searchText,
        archived
      );
      const overallAssignmentCount = reviews[0] ? reviews[0].overallCount : 0;

      assignments = await allAssignmentsForReviews(reviews);
      reviews = await structuredReviews(reviews, assignments);

      const result = {
        pageInfo: {
          pageNumber: page,
          pageSize: size,
          resultSetSize: overallAssignmentCount,
          totalPages: Math.ceil(overallAssignmentCount / size),
        },
        data: reviews,
      };

      res.json(result);
    } else {
      res
        .status(400)
        .send(
          'Failed to retrieve reviews: Missing parameters for page and size '
        );
    }
  })
);

const structuredReviews = async (reviews, assignments) => {
  return reviews.map((review) => {
    return {
      reviewID: review.reviewId,
      active: false,
      reviewee: review.reviewee,
      template: {
        id: review.feedbackAssignmentTemplateId,
        name: review.templateName,
      },
      dateCreated: review.dateCreated,
      hrRep: review.hrRep,
      dueDate: review.dueDate,
      status: review.status,
      currentlyBeingEdited: false,
      feedbackAssignments: assignments[review.reviewId],
    };
  });
};

const allAssignmentsForReviews = async (reviews) => {
  const assignments = [];

  for (const review of reviews) {
    const reviewAssignments = await allReviewAssignments(review.reviewId);
    assignments[review.reviewId] = reviewAssignments.map((assignment) => ({
      feedbackAssignmentId: assignment.feedbackAssignmentId,
      assignedBy: assignment.assignedBy,
      dueBy: assignment.dueBy,
      status: assignment.status,
      reviewer: assignment.reviewer,
    }));
  }

  return assignments;
};

router.get(
  '/review/:id/assignments/',
  handle_errors(async (req, res) => {
    const id = req.params.id;
    const assignments = await allReviewAssignments(id);
    res.json(assignments);
  })
);

router.get(
  '/review/:id/report/',
  handle_errors(async (req, res) => {
    const {
      levelupFrom = null,
      levelupTo = null,
      voluntaryFrom = null,
      voluntaryTo = null,
    } = req.query;
    const id = req.params.id;

    const review = await getReview(id);
    if(review.reviewee.toLowerCase() === res.locals.upn.toLowerCase()){
      res.status(403).json({message: 'Report cannot be downloaded for own review'});
    } else {
      const taggedFeedback = await reviewPeerMessages(id, review.reviewee);
      const selfFeedback = await reviewSelfMessages(id, review.reviewee);

      const selfTagged = taggedFeedback.find(
        (feedback) => feedback.by == review.displayName
      );
      const peerFeedback = taggedFeedback.filter(
        (feedback) => feedback.by != review.displayName
      );

      let formattedSelfFeedback;

      if (selfTagged) {
        formattedSelfFeedback = {
          feedbackDeadline: selfTagged.createdAt,
          tagged: {
            comment: selfTagged.comment,
            tags: selfTagged.tags,
          },
          questions: selfFeedback.map((feedback) => {
            return {
              question: feedback.question,
              answer: feedback.answer,
            };
          }),
        };
      } else {
        formattedSelfFeedback = undefined;
      }

      let levelUpData = [];
      let voluntaryData = [];

      if (levelupFrom && levelupTo) {
        const levelUpTemplateID = 4;
        levelUpData = await retrieveTemplateReviewsInRange(
          levelUpTemplateID,
          review.reviewee,
          levelupFrom,
          levelupTo
        );
      }

      if (voluntaryFrom && voluntaryTo) {
        voluntaryData = await voluntaryFeedbackMessagesInRange(
          review.reviewee,
          voluntaryFrom,
          voluntaryTo
        );
      }

      const result = {
        template: review.template,
        peer: peerFeedback,
        self: formattedSelfFeedback,
        levelUp: levelUpData,
        voluntary: voluntaryData,
      };

      res.json(result);
    }
  })
);

router.patch(
  '/review/:id/archive',
  handle_errors(async (req, res) => {
    try {
      withTransaction(async (tx) => {
        const reviewId = Number(req.params.id);
        const archived = req.body.archived;
        if (Number.isInteger(reviewId) && reviewId > 0) {
          await archiveReview(tx, reviewId, archived, res.locals.upn);
          res.status(200).send();
        } else {
          throw new Error('Review ID has to be a positive integer');
        }
      });
    } catch (error) {
      res.status(400).send(error);
    }
  })
);

router.get(
  '/review/:id/comment/',
  handle_errors(async (req, res) => {
    const id = req.params.id;
    const comments = await getReviewComments(id);
    res.json(comments);
  })
);

router.post(
  '/review/:id/comment/',
  handle_errors(async (req, res) => {
    const { id } = req.params;
    const comment = req.body.comment;
    const assignedBy = res.locals.upn;

    await withTransaction(
      async (tx) => await reviewsLogic.addReviewComment(tx, id, assignedBy, comment)
    );
    res.status(201).send();
  })
);

router.get(
  '/review/:reviewId/meeting-minutes/',
  handle_errors(async (req, res) => {
    const reviewId = req.params.reviewId;
    const review = await getReview(reviewId);
    if(review.reviewee.toLowerCase() !== res.locals.upn.toLowerCase()){
      const meetingMinutes = await getReviewMeetingMinutes(reviewId);
      res.json(meetingMinutes);
    } else {
      res.status(403).json({message: 'Unable to view self meeting minutes'});
    }
  })
);

const moveReviewToFinaliseSalaryStatus = async (tx, reviewId, updatedBy) => {
  const finaliseSalaryReviewStatus = await reviewsLogic.getStatusIdByActionName('SalaryFinalised');
  await updateReviewStatus(tx, reviewId, finaliseSalaryReviewStatus.reviewStatusId, updatedBy);
}

router.patch(
  '/review/:reviewId/meeting-minutes/',
  handle_errors(async (req, res) => {
    try {
      const reviewId = req.params.reviewId;
      const createdBy = res.locals.upn;
      const { meetingTimeslot, meetingAttendees, notes, finaliseReviewMeetingMinutes } = req.body;
      const review = await getReview(reviewId);
      if(review.reviewee.toLowerCase() === res.locals.upn.toLowerCase()){
        res.status(403).json({message: 'Unable to view self meeting minutes'})
      } else if (notes.length > MAXIMUM_REVIEW_MINUTES_NOTE_CHARACTERS) {
        res
          .status(400)
          .json({ error: `Meeting notes should be less than '${MAXIMUM_REVIEW_MINUTES_NOTE_CHARACTERS}' characters.` });
      } else {
        await withTransaction(async (tx) => {
          const reviewMeetingMinutesId = await addOrUpdateReviewNotes(tx, {
            createdBy,
            meetingTimeslot,
            notes,
            meetingAttendees,
            reviewId,
          });

          const existingAttendeesUpns = new Set(
            (await retrieveReviewMeetingMinutesAttendees(reviewMeetingMinutesId))
            .map(meetingAttendee => meetingAttendee.attendeeUPN)
          );
          const updatedAttendeesUpns = new Set(
            meetingAttendees.map(meetingAttendee => meetingAttendee.attendeeUPN)
          );

          const removedAttendeesUpns = Array.from(existingAttendeesUpns.difference(updatedAttendeesUpns));
          const addedAttendeesUpns = Array.from(updatedAttendeesUpns.difference(existingAttendeesUpns));

          if (removedAttendeesUpns.length > 0) {
            await deleteMeetingMinutesAttendees(tx, reviewMeetingMinutesId, removedAttendeesUpns, res.locals.upn)
          } else {
            // no attendees were removed, no need to execute the query
          }

          if (addedAttendeesUpns.length > 0) {
            await insertMeetingMinutesAttendees(tx, reviewMeetingMinutesId, addedAttendeesUpns, res.locals.upn)
          } else {
            // no new attendees were added, no need to execute the query
          }

          if (finaliseReviewMeetingMinutes === true) {
            await moveReviewToFinaliseSalaryStatus(tx, reviewId, createdBy);
          } else {
            // Review will not be moved to 'Finalise Salary' status
          }
        });
        res.status(204).send();
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.patch(
  '/review/:id/delete',
  handle_errors(async (req, res) => {
    const reviewId = Number(req.params.id);
    const comment = req.body.comment;
    const assignedBy = res.locals.upn;
    const nextReviewDetails = req.body.nextReviewDetails;
    try {
      await withTransaction(async (tx) => {
        const updatedReviewIdOrError = await reviewsLogic.cancelReviewAndCascadeUpdates(
          tx,
          reviewId,
          comment,
          assignedBy,
          nextReviewDetails
        );

        if (isError(updatedReviewIdOrError)) {
          res.status(400).json(updatedReviewIdOrError);
        } else {
          res.status(200).json({ message: `Review ${updatedReviewIdOrError} was successfully cancelled.` });
        }
      });
    } catch (error) {
      res.status(500).json({ message: `Failed to delete review: ${error.message}` });
    }
  })
);

router.patch(
  '/review/:id',
  handle_errors(async (req, res) => {
    const reviewId = req.params.id;
    const upn = res.locals.upn;
    const { createdBy, temporaryHrRepEndDate } = req.body;

    try {
      const assignmentId = Number(req.params.id);
      if (Number.isInteger(assignmentId) && assignmentId > 0) {
        if (req.body.dueDate) {
          withTransaction(
            async (tx) =>
              await updateReviewDeadline(tx, req.params.id, req.body.dueDate)
          );
          res.status(200).send();
        } else if (
          req.body.createdBy &&
          req.body.createdBy.toLowerCase() === upn.toLowerCase()
        ) {
          const review = await getReview(req.params.id);
          if (
            review.reviewee.toLowerCase() !==
              req.body.createdBy.toLowerCase() &&
            req.body.comment !== undefined
          ) {
            await withTransaction(async (tx) => {
              await reviewsLogic.addReviewComment(
                tx,
                req.params.id,
                req.body.createdBy,
                req.body.comment
              );

              if (temporaryHrRepEndDate) {
                const tempHrRepEndDate = new Date(temporaryHrRepEndDate);
                const currentDate = new Date();

                if (tempHrRepEndDate < currentDate) {
                  throw new Error(`The temporary HR representative's end date must be set for a future date.`);
                } else {
                  await addTemporaryReviewHrRep(tx, reviewId, createdBy, temporaryHrRepEndDate, upn);
                }
              } else {
                await updateReviewRepresentative(
                  tx,
                  req.params.id,
                  req.body.createdBy,
                  upn
                );
              }
              res.status(200).send();
            });
          } else if (req.body.comment === undefined) {
            throw new Error(
              'Please provide a reason for changing the HR representative.'
            );
          } else {
            throw new Error('You cannot take your own review');
          }
        } else {
          throw new Error(
            'Please provide a new due date or a new HR representative.'
          );
        }
      } else {
        throw new Error('Review ID has to be a positive integer');
      }
    } catch (error) {
      res.status(400).json({ message: `Update failed: ${error.message}` });
    }
  })
);

router.patch(
  '/staff-reviews/:id',
  handle_errors(async (req, res) => {
    try {
      const assignmentId = Number(req.params.id);
      if (Number.isInteger(assignmentId) && assignmentId > 0) {
        await withTransaction(async (tx) => {
          await updateStaffReviewDeadline(tx, req.params.id, req.body.dueDate);
          const previousReviewId = await getPreviousReviewId(req.params.id);
          if (previousReviewId && previousReviewId.reviewId) {
            await reviewsLogic.addReviewComment(
              tx,
              previousReviewId.reviewId,
              res.locals.upn.toLowerCase(),
              req.body.comment
            );
          }
          res.status(200).send();
        });
      } else {
        throw new Error('Review ID has to be a positive integer');
      }
    } catch (error) {
      res.status(400).send(error);
    }
  })
);

router.get(
  '/peer-feedbacks/visual-bar-graph/:upn',
  handle_errors(async (req, res) => {
    const tagAverages =
      await all_reviewee_feedback_messages_bar_graph_visualisation(
        req.params.upn
      );

    if (tagAverages[0] == undefined) {
      res.send();
    } else {
      const seriesData = [];

      tagAverages.forEach((tag) => {
        seriesData.push({
          data: [tag.tagRating.toFixed(2)],
          name: tag.tagName,
        });
      });

      res.json({
        labels: ['(' + tagAverages[0].reviewCount + ') ' + req.params.upn],
        seriesData: seriesData,
      });
    }
  })
);

router.delete(
  '/assignment/:id',
  handle_errors(async (req, res) => {
    try {
      const parsedReasonId = Number(req.query.reasonId);
      const reasonIdOrError = Number.isInteger(parsedReasonId) && parsedReasonId > 0 ?
        parsedReasonId : { message: "reasonId is required and must be a positive integer" };

      if (isError(reasonIdOrError)) {
        res.status(400).json(reasonIdOrError);
      } else {
        await withTransaction(async (tx) => {
          await removeAssignedFeedback(tx, req.params.id, res.locals.upn, reasonIdOrError);
          const { reviewId } = await reviewsLogic.getReviewIdBasedOnFeedbackAssignmentId(
            tx,
            req.params.id
          );
          await updateStatusOfReviewBasedOnFeedbackAssignments(
            tx,
            reviewId,
            res.locals.upn
          );
        });
        res.status(200).send();
      }
    } catch (error) {
      const detail = error.causedBy ? `${error.message} caused by: ${error.causedBy}` : error.message;
      res.status(400).send({ message: `Failed to remove feedback assignment.`, detail: detail});
    }
  })
);

router.get(
  '/assignment/:id/nudge',
  handle_errors(async (req, res) => {
    const feedbackAssignmentId = req.params.id;
    const feedbackAssignmentNudge = await getCurrentDayAssignmentNudges(
      feedbackAssignmentId
    );
    res.json(feedbackAssignmentNudge);
  })
);

router.post(
  '/assignment/:id/nudge',
  handle_errors(async (req, res) => {
    const assignmentId = req.params.id;
    try {
      await withTransaction(async (tx) => {
        if (
          Number.isInteger(Number(assignmentId)) &&
          Number(assignmentId) > 0
        ) {
          const emailData = await prepareFeedbackEmailContent(tx, assignmentId);
          const {
            from,
            to,
            subject,
            context,
            message,
            url,
            callToAction,
            image,
            templateFile,
            clientEmail,
          } = emailData;
          await send(from, to, subject, context, message, url, {
            callToAction,
            image,
            templateFile,
            clientEmail,
          });
          await insertIntoReviewCommunication(
            tx,
            assignmentId,
            res.locals.upn,
            to,
            new Date(),
            REVIEW_COMMUNICATION_TYPE_REVIEWER_EMAIL,
            REVIEW_COMMUNICATION_REASON_MANUAL_NUDGE
          );
          res.status(201).send();
        } else {
          throw new Error('Assignment ID has to be a positive integer');
        }
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  })
);

router.put(
  '/assignment/:assignmentId/',
  handle_errors(async (req, res) => {
    const assignmentId = req.params.assignmentId;
    const upn = res.locals.upn;
    const retractedReasonId = req.body.retractedReasonId;
    const dueBy = req.body.dueBy;
    try {
      if (retractedReasonId) {
        let newAssignmentId;
        await withTransaction(async (tx) => {
          const newAssignmentData = await retractFeedbackAssignment(
            tx,
            assignmentId,
            upn,
            retractedReasonId,
            dueBy
          );
          newAssignmentId = newAssignmentData[0].feedbackAssignmentId;

          const reviewer = await findReviewerForFeedbackAssignment(
            assignmentId
          );
          const reviewInStaffTable = await findReviewerInStaff(reviewer);
          if (!reviewInStaffTable) {
            const uuid = randomUUID();
            await addGuestReviewer(tx, newAssignmentId, uuid);
          }

          const { reviewId } = await reviewsLogic.getReviewIdBasedOnFeedbackAssignmentId(
            tx,
            assignmentId
          );
          await updateStatusOfReviewBasedOnFeedbackAssignments(
            tx,
            reviewId,
            upn
          );
        });

        try {
          await withTransaction(async (tx) => {
            const emailData = await prepareFeedbackEmailContent(
              tx,
              newAssignmentId.toString()
            );
            await send(
              emailData.from,
              emailData.to,
              emailData.subject,
              emailData.context,
              emailData.message,
              emailData.url,
              {
                callToAction: emailData.callToAction,
                image: emailData.image,
                templateFile: emailData.templateFile,
                clientEmail: emailData.clientEmail,
              }
            );

            await insertIntoReviewCommunication(
              tx,
              newAssignmentId,
              upn,
              emailData.to,
              new Date(),
              REVIEW_COMMUNICATION_TYPE_REVIEWER_EMAIL,
              REVIEW_COMMUNICATION_REASON_MANUAL_NUDGE
            );
          });

          res.status(201).send();
        } catch (error) {
          res.status(201).send({ message: 'The feedback was retracted but we could not send an email to the feedback provider.', cause: { message: error.message, error } });
        }
      } else {
        res.status(400).json({ message: 'Please ensure the reason for retraction is provided.' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Something went wrong. Please try again later.', cause: { message: error.message, error } });
    }
  })
);

router.get(
  '/allowed-assignment-status-progressions/',
  handle_errors(async (req, res) => {
    const allowedStatusProgressions =
      await getAssignmentAllowedStatusProgressions();
    res.json(allowedStatusProgressions);
  })
);

router.get(
  '/feedback/',
  handle_errors(async (req, res) => {
    const { published, upn } = req.query;
    let messages = [];

    if (published == 'false' && upn != undefined) {
      const voluntaryMessages = await allRevieweeVoluntaryFeedbackMessages(
        upn,
        res.locals.upn
      );
      let assignedMessages = await allRevieweeAssignedFeedbackMessages(upn);
      assignedMessages = await structuredAssignedFeedback(assignedMessages);

      messages = {
        reviewee: upn,
        voluntary: voluntaryMessages.sort(
          (message1, message2) =>
            message2.createdAt.getTime() - message1.createdAt.getTime()
        ),
        assigned: assignedMessages.sort(
          (message1, message2) =>
            message2.dueDate.getTime() - message1.dueDate.getTime()
        ),
      };
    } else {
      messages = await allFeedback();
      messages = messages.sort(
        (message1, message2) =>
          message2.createdAt.getTime() - message1.createdAt.getTime()
      );
    }

    res.json(messages);
  })
);

const structuredAssignedFeedback = async (assignedMessages) => {
  const data = [];

  for (const feedbackResponse of assignedMessages) {
    if (
      data.length == 0 ||
      !data.find((review) => review.reviewId == feedbackResponse.reviewId)
    ) {
      data.push({
        reviewId: feedbackResponse.reviewId,
        template: feedbackResponse.templateName,
        about: feedbackResponse.heroUserPrincipleName,
        dueDate: feedbackResponse.dueDate,
        status: feedbackResponse.status,
        feedback: await structureRelatedAssignedFeedback(
          assignedMessages.filter(
            (feedback) => feedback.reviewId == feedbackResponse.reviewId
          )
        ),
      });
    }
  }

  return data;
};

const structureRelatedAssignedFeedback = async (assignedMessages) => {
  const data = [];

  assignedMessages.forEach((feedbackResponse) => {
    if (
      !data.find(
        (feedback) =>
          feedback.feedbackAssignmentId == feedbackResponse.feedbackAssignmentId
      )
    ) {
      const assignmentGroup = assignedMessages.filter(
        (assignment) =>
          assignment.feedbackAssignmentId ==
          feedbackResponse.feedbackAssignmentId
      );
      const tags = assignmentGroup
        .filter((message) => message.tagName)
        .map((message) => {
          return { name: message.tagName, rating: message.tagRating };
        });
      const answers =
        feedbackResponse.question == null
          ? []
          : assignmentGroup.map((message) => {
              return { question: message.question, answer: message.answer };
            });
      const comments = structureAssignedFeedbackComment(assignmentGroup);
      data.push({
        messageId: feedbackResponse.messageId,
        feedbackAssignmentId: feedbackResponse.feedbackAssignmentId,
        comment: feedbackResponse.text,
        type: 'assigned',
        by: feedbackResponse.createdByUserPrincipleName,
        about: feedbackResponse.heroUserPrincipleName,
        dueBy: feedbackResponse.feedbackDeadline,
        createdAt: feedbackResponse.creationDate,
        comments: comments,
        tags: [...new Map(tags.map((item) => [item['name'], item])).values()],
        answers: [
          ...new Map(answers.map((item) => [item['question'], item])).values(),
        ],
      });
    }
  });

  return data;
};

const structureAssignedFeedbackComment = (comments) => {
  const structuredComments = [
    ...new Map(
      comments
        .map((message) => {
          if (message.tagId) {
            return { type: 'Positive Comment', text: message.text };
          } else {
            return { type: 'Constructive Comment', text: message.text };
          }
        })
        .map((comment) => [comment.type, comment])
    ).values(),
  ];

  if (structuredComments.length == 1) {
    structuredComments[0].type = 'General Comment';
  }

  return structuredComments;
};

router.post(
  '/feedback/template',
  handle_errors(async (req, res) => {
    try {
      const {
        templateName,
        subjectLineTemplate,
        textContentTemplate,
        urlTemplate,
        titleTemplate,
        manualFeedbackAssignment,
        questions,
      } = req.body;

      const templateId = await createNewFeedbackTemplate(
        templateName,
        subjectLineTemplate,
        textContentTemplate,
        urlTemplate,
        titleTemplate,
        manualFeedbackAssignment
      );

      withTransaction((tx) =>
        modifyFeedbackTemplateQuestions(
          tx,
          questions,
          templateId,
          res.locals.upn
        )
      );

      res.status(201).send();
    } catch (error) {
      res.status(400).send(error);
    }
  })
);

router.put(
  '/feedback/template/:id',
  handle_errors(async (req, res) => {
    try {
      const {
        templateName,
        subjectLineTemplate,
        textContentTemplate,
        urlTemplate,
        titleTemplate,
        feedbackAssignmentTemplateId,
        manualFeedbackAssignment,
        questions,
      } = req.body;

      await updateFeedbackTemplate(
        templateName,
        subjectLineTemplate,
        textContentTemplate,
        urlTemplate,
        titleTemplate,
        manualFeedbackAssignment,
        req.params.id
      );

      withTransaction((tx) =>
        modifyFeedbackTemplateQuestions(
          tx,
          questions,
          feedbackAssignmentTemplateId,
          res.locals.upn
        )
      );

      res.status(200).send();
    } catch (error) {
      res.status(400).send(error);
    }
  })
);
module.exports = router.get(
  '/feedbacks/retracted',
  handle_errors(async (req, res) => {
    try {
      const reasons = await allDeletedFeedback();
      res.status(200).json(reasons);
    } catch (error) {
      res
        .status(400)
        .json({
          message: 'Failed to retrieve feedbacks with their retracted reasons',
          error,
        });
    }
  })
);

const modifyFeedbackTemplateQuestions = async (
  tx,
  questions,
  feedbackAssignmentTemplateId,
  upn
) => {
  for (const question of questions) {
    if (question.question === undefined) {
      //remove question by id
      await removeFeedbackTemplateQuestion(tx, question.questionId, upn);
    } else if (question.questionId === undefined) {
      //new question
      await addFeedbackTemplateQuestion(
        tx,
        feedbackAssignmentTemplateId,
        question.question
      );
    }
  }
};

router.patch(
  '/upcoming-review-type',
  handle_errors(async (req, res) => {
    try {
      const { staffReviewId, nextFeedbackTypeId } = req.body;
      await withTransaction(
        async (tx) =>
          await updateUpcomingReviewType(tx, staffReviewId, nextFeedbackTypeId)
      );
      res
        .status(200)
        .send({ message: 'upcoming review type successfully updated' });
    } catch (error) {
      res.status(400).send(error);
    }
  })
);

router.post(
  '/staff-review/:staffReviewId/comment',
  handle_errors(async (req, res) => {
    const staffReviewId = req.params.staffReviewId;
    const comment = req.body.comment;
    const createdBy = res.locals.upn;
    await withTransaction(
      async (tx) =>
        await addUpcomingReviewComment(tx, staffReviewId, createdBy, comment)
    );
    res.status(201).send();
  })
);

router.get(
  '/staff-review/:staffReviewId/comment',
  handle_errors(async (req, res) => {
    const staffReviewId = req.params.staffReviewId;
    const comments = await getUpcomingReviewComments(staffReviewId);
    res.json(comments);
  })
);

router.post(
  '/staff-member/:staffId/comments',
  handle_errors(async (req, res) => {
    const staffId = req.params.staffId;
    const comment = req.body.comment;
    const createdBy = res.locals.upn;
    await withTransaction(
      async (tx) => await addStaffMemberComment(tx, staffId, createdBy, comment)
    );
    res.status(201).send();
  })
);

router.delete(
  '/staff-member/comments/:staffMemberCommentId',
  handle_errors(async (req, res) => {
    const upn = res.locals.upn;
    await deleteStaffMemberComment(req.params.staffMemberCommentId, upn)
    res.status(204).send();
  })
);

router.get(
  '/staff-member/:staffId/comments',
  handle_errors(async (req, res) => {
    const staffId = req.params.staffId;
    const upn = await getUPN(staffId);
    const { newest } = req.query;
    if (upn === undefined){
      res.status(404).json({message: 'staffId not found'});
    }
    else if(upn.toLowerCase() === res.locals.upn.toLowerCase()){
      res.status(403).json({message: 'You cannot view own comments'});
    } else if (newest === 'true') {
      const comment = await getStaffMemberLatestComment(staffId);
      res.json(comment);
    }else {
      const comments = await getStaffMemberComments(staffId);
      res.json(comments);
    }
  })
);

router.get(
  '/staff-reviews/:userPrincipleName/comments',
  handle_errors(async (req, res) => {
    const staffUPN = req.params.userPrincipleName;
    if(staffUPN.toLowerCase() !== res.locals.upn.toLowerCase()){
      const comments = await getAllStaffReviewComments(staffUPN);
      res.json(comments);
    } else {
      res.status(403).json({message: 'cannot view own comments'});
    }
  })
);

router.get(
  '/reviews/:userPrincipleName/comments',
  handle_errors(async (req, res) => {
    const staffUPN = req.params.userPrincipleName;
    if(staffUPN.toLowerCase() !== res.locals.upn.toLowerCase()){
      const comments = await getAllReviewsComments(staffUPN);
      res.json(comments);
    } else {
      res.status(403).json({message: 'cannot view own comments'});
    }
  })
);

module.exports = router;
