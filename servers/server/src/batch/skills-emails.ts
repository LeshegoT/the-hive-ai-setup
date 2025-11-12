import { handleErrors, parseIfSetElseDefault } from '@the-hive/lib-core';
import { Router, Request, Response } from 'express';
import { sendPortfolioUpdateRequest } from '../shared/send-overdue-portfolio-update-email';
import { BadRequestDetail } from '@the-hive/lib-shared';
import { Staff } from '@the-hive/lib-staff-shared';
import { retrieveStaffWhoHaveNotInteractedWithSkills, createSkillsCommunication } from '@the-hive/lib-skills-logic';
import { enqueue } from '../shared/queue';
import { db } from '../shared/db';
import { sendProofRejectionEmail } from '../shared/send-proof-rejection-email';
const SKILLS_INACTIVITY_REMINDER_MONTHS = parseIfSetElseDefault('SKILLS_INACTIVITY_REMINDER_MONTHS', 6);
const UPDATE_SKILLS_PORTFOLIO_QUEUE_NAME = 'update-skills-portfolio-queue';
const SKILLS_COMMUNICATION_REASON_SYSTEM_NUDGE = "System send";
const SKILLS_COMMUNICATION_TYPE = "Update portfolio reminder e-mail";
const SKILLS_COMMUNICATION_SENT_BY = "the-hive@bbd.co.za";
import { sendAttributeRejectionEmail } from '../shared/send-attribute-rejection-email';
import { AttributeType } from '@the-hive/lib-skills-shared';

const router = Router();

router.post('/send-portfolio-update-reminder',
  handleErrors(async (
    req: Request<undefined, undefined,{ staffDisplayName: string, staffUPN: Staff['upn']}>, 
    res: Response<BadRequestDetail>
) => {
    const { staffUPN, staffDisplayName } = req.body;
    const wasEmailSent = await sendPortfolioUpdateRequest( staffDisplayName, staffUPN );
    if (wasEmailSent) {
      await createSkillsCommunication(
        db,
        staffUPN,
        SKILLS_COMMUNICATION_TYPE,
        SKILLS_COMMUNICATION_REASON_SYSTEM_NUDGE,
        SKILLS_COMMUNICATION_SENT_BY
      );
      res.status(200).json({message: `Email successfully sent to ${staffUPN}.`});
    } else {
      res.status(200).json({message: `Failed to send email to ${staffUPN}.`});
    }
  })
);

router.post('/schedule-update-skills-portfolio-reminders',
    handleErrors(async (
        _,
        res: Response<{ message: string; }>
    ) => {
        try {
            const staffWhoHaveNotInteractedWithSkills = await retrieveStaffWhoHaveNotInteractedWithSkills(
                db,
                SKILLS_INACTIVITY_REMINDER_MONTHS);
            if (staffWhoHaveNotInteractedWithSkills.length > 0){
                for (const staffMemberWhoHaveNotInteractedWithSkills of staffWhoHaveNotInteractedWithSkills) {
                    await enqueue(UPDATE_SKILLS_PORTFOLIO_QUEUE_NAME, {
                        staffUPN: staffMemberWhoHaveNotInteractedWithSkills.upn,
                        staffDisplayName: staffMemberWhoHaveNotInteractedWithSkills.displayName,
                        typeOfCommunication: SKILLS_COMMUNICATION_REASON_SYSTEM_NUDGE
                    });
                }
                const numberOfEmailsToBeSent = staffWhoHaveNotInteractedWithSkills.length;
                res.status(200).json({ message: `${numberOfEmailsToBeSent} emails were compiled to be sent out` });
            } else {
                res.status(200).json({ message: 'No emails to send out today.' });
            }
        } catch (error) {
            res.status(200).json({ message: error });
        }
    })
)

router.post('/send-proof-rejection-email',
    handleErrors(async (
    req: Request<undefined, undefined, {displayName:string, staffUpn: Staff['upn'], rejectedProof: string}>, 
    res: Response<BadRequestDetail>
) => {
    const {displayName, staffUpn, rejectedProof} = req.body;
    const wasEmailSent = await sendProofRejectionEmail( displayName, staffUpn, rejectedProof );
    if (wasEmailSent) {
      res.status(200).json({message: `Email successfully sent to ${staffUpn}.`});
    } else {
      res.status(200).json({message: `Failed to send email to ${staffUpn}.`});
    }
  })
);

router.post('/send-attribute-rejection-email',
  handleErrors(async (
    req: Request<undefined, undefined,{ attributeCanonicalName: string, attributeType: AttributeType, upn: Staff['upn'], displayName: string }>, 
    res: Response<{message: string}>
  ) => {
    const { attributeCanonicalName, attributeType, upn, displayName} = req.body;
    const wasEmailSent = await sendAttributeRejectionEmail(
      displayName,
      upn,
      { canonicalName : attributeCanonicalName, attributeType }
    );

    if (wasEmailSent) {
      res.status(200).json({message: `Email successfully send to ${upn}.`});
    } else {
      res.status(200).json({message: `Failed to send email to ${upn}.`});
    }
  })
)
export {
    router
};