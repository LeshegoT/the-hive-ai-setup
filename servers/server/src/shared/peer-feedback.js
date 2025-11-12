/**
 *
 * Module containing functions related to peer-feedback logic that do not belong
 * in API or queries modules.
 * @module shared/peer-feedback
 */

const { isEmailAllowed } = require('./email');
const {
  retrieveFeedbackAssignmentDetailsForNudge,
  getGuestReviewerUuid,
} = require('../queries/peer-feedback.queries');
const { prepareTemplateFromFile } = require('./html-template');

// TODO - RE the template engine should handle this rendering of the template
// Trello ticket link: https://trello.com/c/WbCu1ba1

/**
 * @typedef {Object} RenderData
 * @property {number} feedbackAssignmentId the call to action text
 * @property {string} reviewerName the name of the reviewer (may be an email address if external)
 * @property {string} revieweeName tjhe name of the reviewee, should be complete name and not an email address
 * @property {Date} dueBy the due date
 * @property {number} daysUntilAssignmentIsDue the days until the assignment is due
 * @property {string} reviewType the type of review
 * @property {boolean} isExternalReview whether the review is external
 * @property {string} host the compiled URL for the call to action
 * @property {string} [manager] the manager of the reviewee
 * @property {string} [department] the manager of the reviewee
 * @property {string} [jobTitle] the job title of the reviewee
 * @property {string} [levelUpName] the name of the level-up which is the reason for review
 * @property {string} [teamName] the name of the team the reviewee was part of for the level up
 */

const prepareFeedbackEmailContent = async (tx, assignmentId) => {
  const {
    reviewer,
    reviewee,
    assignedBy,
    feedbackDeadline,
    templateName,
    textContentTemplate,
    clientEmail,
    revieweeName,
    isReview,
  } = await retrieveFeedbackAssignmentDetailsForNudge(tx, assignmentId);

  if (await isEmailAllowed(reviewer)) {
    let isExternal = false;
    let host = process.env.REDIRECT_URI + '/peer-feedback?id=' + assignmentId;
    const guestReviewerUuid = await getGuestReviewerUuid(tx, assignmentId);

    if (guestReviewerUuid != undefined) {
      isExternal = true;
      host = process.env.EXTERNAL_REDIRECT_URI + '?id=' + guestReviewerUuid;
    } else {
      // defaults have already been set
    }

    let reviewType = 'peer';
    let image = 'peer';

    if (reviewee.toLowerCase() === reviewer.toLowerCase()) {
      reviewType = 'self';
    }

    const dueDate = new Date(feedbackDeadline).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const overdue =
      new Date(feedbackDeadline) < new Date(new Date().toDateString());

    const feedbackEmailGuideline = prepareTemplateFromFile(
      'email-templates',
      'feedback-email-guidelines.html.hbs'
    );
    let titleTemplate;
    let subjectLineTemplate;
    let configuredTextContentTemplate = feedbackEmailGuideline({ dueDate, textContentTemplate });

    if (isExternal) {
      titleTemplate = `How do you rate <b style='color:#C72026'>our employee:<br/> ${revieweeName}</b>`;
      subjectLineTemplate = `BBD Employee Review for ${revieweeName}`;
      configuredTextContentTemplate = `<section style='font-size:16pt;'>
        <p>The BBD Client/Colleague 360&deg; feedback review is a process in which our employees receive feedback
          in their reviews. An important part of this feedback process is ensuring you, our client, can comment and provide input.</p>
        <p><b>Please note:</b></p><ul><li style='margin-bottom:20px;'>If you can't complete your review in one sitting, you can click the save for later button.</li>
          <li style='margin-bottom:20px;'>When you're done with your review, make sure you click the submit button.</li>
          <li style='margin-bottom:30px;'>Please complete your review <b>before</b> ${dueDate}.</li></ul>
        <p style='font-size:12pt;font-weight:500;'>Thank you for taking the time to assist us with this.<br>For any questions, contact
        <a href='mailto:hr@bbdsoftware.com' style='color:#C72026;font-weight:700;'>hr@bbdsoftware.com</a></p>
      </section>`;
      image = 'client';
    } else if (reviewType == 'self') {
      if (overdue) {
        titleTemplate =
          `You have an <b style="color:#C72026">overdue</b>:<br><b style="color:#C72026">${isReview ? 'Self Review': templateName}</b>`;
      } else {
        titleTemplate =
          `Time for your <b style="color:#C72026">${isReview ? 'Self Review': templateName}</b>`;
      }

      subjectLineTemplate = `${isReview ? 'Self Review': templateName} for ${revieweeName}`;
      image = 'self';
    } else {
      if (overdue) {
        if (templateName === 'Unit Move') {
          titleTemplate = `You have an <b style='color:#C72026'>overdue ${templateName.trim()} review</b> for your colleague:<br><b style='color:#C72026'>${revieweeName}</b>`;
        } else {
          titleTemplate = `You have an <b style='color:#C72026'>overdue review</b> for your colleague:<br><b style='color:#C72026'>${revieweeName}</b>`;
        }
      } else {
        if (templateName === 'Unit Move') {
          titleTemplate = `You've been selected to do a ${templateName.trim()} review on your colleague:<br><b style='color:#C72026'>${revieweeName}</b>`;
        } else {
          titleTemplate = `You've been selected to review your colleague:<br><b style='color:#C72026'>${revieweeName}</b>`;
        }
      }
      
      if (templateName === 'Unit Move') {
        subjectLineTemplate = `${templateName.trim()} Review for ${revieweeName}`;
      } else {
        subjectLineTemplate = `Colleague Review for ${revieweeName}`;
      }
    }

    const subject = subjectLineTemplate;
    const title = titleTemplate;
    const textContent = configuredTextContentTemplate;
    const templateFile = 'feedback-email.html.hbs';

    return {
      from: assignedBy,
      to: reviewer,
      subject,
      context: title,
      message: textContent,
      url: host,
      callToAction: `Start ${isReview ? 'Review': 'Feedback'}`,
      image,
      templateFile,
      clientEmail,
    };
  } else {
    throw new Error(
      `Not allowed to send to '${reviewer}' in environment '${process.env.NODE_ENV}'`
    );
  }
};

const prepareBulkNudgeEmailContent = async (
  tx,
  upn,
  outstandingAssignments,
  nudgedBy
) => {
  const assignmentId = outstandingAssignments[0].feedbackAssignmentID;

  const { clientEmail } = await retrieveFeedbackAssignmentDetailsForNudge(
    tx,
    assignmentId
  );

  if (await isEmailAllowed(upn)) {
    const host = process.env.REDIRECT_URI + '/peer-feedback';
    const image = 'peer';

    const titleTemplate = `You owe HR <b style='color:#C72026'>Urgent Review Feedback</b><br></br>`;
    const subjectLineTemplate = `Outstanding Feedback Assignments`;

    let textContentTemplate = `<section style='font-size: 12pt;'>
    <p>Hi ${outstandingAssignments[0].displayName},</p>
    <p>Gus has requested that you be made aware of how you are delaying HR processes by not completing reviews timeously</p>
    <p>Please <b style="color:#C72026">urgently</b> complete the below outstanding reviews:</p>
    <br>
    <table style='width: 100%; border-collapse: collapse; border: none;'>
      <thead>
        <tr>
          <th style='border: none; padding: 8px; text-align: left; color: #C72026;'>Provide feedback on</th>
          <th style='border: none; padding: 8px; text-align: left; color: #C72026;'>Original due date</th>
          <th style='border: none; padding: 8px; text-align: left; color: #C72026;'>Last accessed</th>
          <th style='border: none; padding: 8px; text-align: left; color: #C72026;'>Number of automated notifications</th>
          <th style='border: none; padding: 8px; text-align: left; color: #C72026;'>Number of manual notifications from HR</th>
        </tr>
      </thead>
      <tbody>`;

    for (const assignment of outstandingAssignments) {
      const dueDate = new Date(assignment.dueBy).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const lastAccessed = new Date(assignment.updateDate).toLocaleString(
        'en-GB',
        { day: 'numeric', month: 'long', year: 'numeric' }
      );

      textContentTemplate += `
            <tr style='border: none;'>
              <td style='border: none; padding: 8px; text-align: left;'>${assignment.revieweeName}</td>
              <td style='border: none; padding: 8px; text-align: left;'>${dueDate}</td>
              <td style='border: none; padding: 8px; text-align: left;'>${lastAccessed}</td>
              <td style='border: none; padding: 8px; text-align: left;'>${assignment.systemNudges}</td>
              <td style='border: none; padding: 8px; text-align: left;'>${assignment.hRNudges}</td>
            </tr>`;
    }

    textContentTemplate += `</tbody>
        </table>
        <br>
        <p>Thank you for your <b style="color:#C72026">urgent</b> attention to this matter</p><br></section>`;

    const subject = subjectLineTemplate;
    const title = titleTemplate;
    const textContent = textContentTemplate;
    const templateFile = 'feedback-email.html.hbs';

    return {
      from: nudgedBy,
      to: upn,
      subject,
      context: title,
      message: textContent,
      url: host,
      callToAction: 'Start Reviews',
      image,
      templateFile,
      clientEmail,
    };
  } else {
    throw new Error(
      `Not allowed to send to '${upn}' in environment '${process.env.NODE_ENV}'`
    );
  }
};



const prepareFeedbackProvidersRequestEmailContent = async (
  revieweeName,
  reviewerName,
  hrRepName,
  hrRepEmail,
  reviewerEmail,
  reviewMonth,
  reviewType
) => {
  const image = 'peer';
  const subject = `${revieweeName} - ${reviewType} - Feedback providers requested`;
  const textContentTemplate = prepareTemplateFromFile(
    'email-templates',
    'feedback-providers-request-guidelines.html.hbs'
  );
  const message = textContentTemplate({reviewerName, revieweeName, hrRepName, hrRepEmail, reviewMonth, reviewType})

  return {
    from: hrRepEmail,
    to: reviewerEmail,
    subject,
    message,
    image,
    context: `${revieweeName}'s review is due soon.`,
    templateFile: 'feedback-providers-request.html.hbs'
  };
};

module.exports = {
  prepareFeedbackEmailContent,
  prepareBulkNudgeEmailContent,
  prepareFeedbackProvidersRequestEmailContent,
};
