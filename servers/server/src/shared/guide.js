const { isEmailAllowed } = require('./email');
const {
  getRequestStatusType,
  getSpecialisationById,
} = require('../queries/guide-request.queries');

const prepareGuideApplicationEmailContent = async (
  upn,
  specialisationId,
  requestStatusType,
  applicationStatusReason
) => {
  if (await isEmailAllowed(upn)) {
    const newRequestStatusType = await getRequestStatusType(requestStatusType);
    const newRequestSpecialisation = await getSpecialisationById(
      specialisationId
    );

    let applicationStatus;
    if (newRequestStatusType == undefined) {
      throw Error(
        `RequestStatusType with ID ${requestStatusTypeId} doesn't exist.`
      );
    } else {
      applicationStatus = newRequestStatusType.requestStatusType;
    }

    let guideApplicationSpecialisation;
    if (newRequestSpecialisation == undefined) {
      throw Error(`Specialisation with ID ${specialisationId} doesn't exist.`);
    } else {
      guideApplicationSpecialisation = newRequestSpecialisation.name;
    }

    const host = process.env.REDIRECT_URI + '/become-guide';
    const fromEmail = 'the-hive@bbd.co.za';
    const subject = `Guide Application for ${upn}`;

    const title = `Your guide application for the course specialisation: ${guideApplicationSpecialisation}`;

    const isApplicationAccepted = applicationStatus.toLowerCase() == 'accepted';

    let applicationComment;
    if (isApplicationAccepted) {
      applicationComment = `<p>Your application to become the guide for the course specialisation: <span style='font-weight: bold;'>${guideApplicationSpecialisation}</span> has been accepted.</p>`;
    } else {
      applicationComment = `<p style='margin: 2rem 0;'>Unfortunately your application to become the guide for the course specialisation: <span style='font-weight: bold;'>${guideApplicationSpecialisation}</span> has been rejected.</p>
            <p>Reason:</p>
            <p>${applicationStatusReason}</p>
            `;
    }

    const message = `<section>
            <p style='margin: 2rem 0;'>Application status: <span style='color: ${
              isApplicationAccepted ? 'green' : 'red'
            };'>${applicationStatus}</span></p>
            ${applicationComment}
        </section>
        `;

    return {
      from: fromEmail,
      to: upn,
      subject,
      context: title,
      message,
      url: host,
      callToAction: 'View Application',
    };
  } else {
    throw new Error(
      `Not allowed to send to '${upn}' in environment '${process.env.NODE_ENV}'`
    );
  }
};

module.exports = {
  prepareGuideApplicationEmailContent,
};
