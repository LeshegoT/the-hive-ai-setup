function parseEmailList(emails: string): Array<string> {
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+.[A-Z]{2,4}/gim;
  const emailsArray = emails
    .split(',')
    .filter((u) => u.match(emailRegex))
    .map((u) => u.trim());
  return emailsArray;
}

export { parseEmailList };
