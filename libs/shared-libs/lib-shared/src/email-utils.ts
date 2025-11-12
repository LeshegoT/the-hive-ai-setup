export function isBBDEmail(email: string, bbdEmailDomains: string[]): boolean {
  return bbdEmailDomains.some((domain) => email.toLowerCase().endsWith(`@${domain}`));
}
