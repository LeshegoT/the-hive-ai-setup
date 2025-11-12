import { Staff } from '@the-hive/lib-skills-shared';
import { prepareTemplateFromFile } from './html-template';

interface PortfolioUpdateReminderEmailContent {
  from: Staff['upn'];
  to: Staff['upn'];
  subject: string;
  message: string;
  imagePath: string;
  context: string;
  templatePath: string;
  url: string;
}

export async function generatePortfolioUpdateReminderEmailContent(
  displayName: string,
  staffUPN: Staff['upn']
): Promise<PortfolioUpdateReminderEmailContent> {
  const imagePath = 'hive';
  const subject = `Reminder: Please update your portfolio`;
  const textContentTemplate = prepareTemplateFromFile(
    'email-templates',
    'overdue-skills-update-email-guidelines.html.hbs'
  );
  const message = textContentTemplate({ displayName });

  return {
    from: 'the-hive@bbd.co.za',
    to: staffUPN,
    subject,
    message,
    imagePath,
    context: `${displayName}'s portfolio has not been updated in 6 months.`,
    templatePath: 'overdue-skills-update-email.html.hbs',
    url: 'https://the-hive.bbd.co.za/skills'
  };
}