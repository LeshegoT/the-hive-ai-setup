import { Staff } from '@the-hive/lib-staff-shared';
import { send } from './email';
import { generatePortfolioUpdateReminderEmailContent } from './overdue-portfolio-update';

export async function sendPortfolioUpdateRequest(
  staffDisplayName: string, 
  staffUPN:Staff['upn'] 
): Promise<boolean>{
  if ( staffDisplayName && staffUPN ) {
    const {from, to, subject, context, message, imagePath, templatePath, url} = await generatePortfolioUpdateReminderEmailContent(
      staffDisplayName,
      staffUPN
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