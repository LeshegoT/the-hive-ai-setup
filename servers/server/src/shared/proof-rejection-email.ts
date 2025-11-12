import { Staff } from '@the-hive/lib-skills-shared';
import { prepareTemplateFromFile } from './html-template';

interface ProofRejectionEmailContent {
    from: string;
    to: string;
    subject: string;
    message: string;
    imagePath: string;
    context: string;
    templatePath: string, 
    url: string;
}

export async function generateProofRejectionEmailContent (
    displayName: string, 
    staffUpn: Staff['upn'],
    rejectedProof: string, 
): Promise<ProofRejectionEmailContent> {
    const imagePath = "hive";
    const subject = "Action Required: Resubmission of Qualification/Certification Document";
    const textContentTemplate = prepareTemplateFromFile(
        'email-templates',
        'proof-rejection-email-message-details.html.hbs'
    );
    const message = textContentTemplate({ displayName, rejectedProof });

    return {
    from: 'the-hive@bbd.co.za',
    to: staffUpn,
    subject,
    message,
    imagePath,
    context: `${displayName}'s ${rejectedProof} uploaded proof file has been rejected`,
    templatePath: 'proof-rejection-email.html.hbs',
    url: 'https://the-hive.bbd.co.za/skills'
  };
}