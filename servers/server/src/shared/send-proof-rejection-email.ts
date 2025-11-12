import { send } from './email';
import { Staff } from '@the-hive/lib-staff-shared';
import { generateProofRejectionEmailContent } from './proof-rejection-email';

export async function sendProofRejectionEmail (
    displayName: string, 
    staffUpn: Staff['upn'],
    rejectedProof: string,
): Promise<boolean>{
    if ( displayName && staffUpn && rejectedProof ) {
        const {from, to, subject, context, message, url, imagePath, templatePath} = await generateProofRejectionEmailContent(
          displayName,
          staffUpn,
          rejectedProof
        );
        try{
        const wasEmailSent = await send(from, to, subject, context, message, url, { image: imagePath, templateFile: templatePath });
        return wasEmailSent;
        } catch {
          return false;
        }
      } else {
        return false;
      }
}