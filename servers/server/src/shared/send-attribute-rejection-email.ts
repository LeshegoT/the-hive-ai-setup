import { Attribute, Staff } from '@the-hive/lib-skills-shared';
import { generateAttributeRejectionEmailContent } from './ratification-feedback';
import { send } from './email';

export async function sendAttributeRejectionEmail(
  displayName: string,
  staffUPN: Staff['upn'],
  attribute: Pick<Attribute, 'canonicalName' | 'attributeType'>
): Promise<boolean> {
    const { from, to, subject, context, message, imagePath, templatePath, url } = await generateAttributeRejectionEmailContent(displayName, staffUPN, attribute);
    try {
    const wasEmailSent = await send(from, to, subject, context, message, url, {image: imagePath, templateFile: templatePath });
    return wasEmailSent;
    } catch {
      return false;
    }
}


