import { Attribute, Staff } from "@the-hive/lib-skills-shared";
import { prepareTemplateFromFile } from "./html-template";

interface AttributeRejectionReminderEmail {
    from: string;
    to: string;
    subject: string;
    message: string;
    imagePath: string;
    context: string;
    templatePath: string;
    url: string;
}
export async function generateAttributeRejectionEmailContent(
  displayName: string,
  staffUPN: Staff['upn'],
  attribute: Pick<Attribute, "attributeType" | "canonicalName">
) : Promise<AttributeRejectionReminderEmail>{
  const imagePath = 'hive';
  const subject = `The Hive Portfolio: Your ${attribute.attributeType} has been rejected.`;
  const textContentTemplate = prepareTemplateFromFile(
    'email-templates',
    'attribute-rejection-notification-guidelines.html.hbs'
  );
  const message = textContentTemplate({ displayName, attributeCanonicalName: attribute.canonicalName , attributeType: attribute.attributeType });

  return {
    from: 'the-hive@bbd.co.za',
    to: staffUPN,
    subject,
    message,
    imagePath,
    context: `${displayName}'s ${attribute.attributeType} has been rejected.`,
    templatePath: 'attribute-rejection-notification.html.hbs',
    url: 'https://the-hive.bbd.co.za/skills'
  };
}