export function progressToEndOfDay(input: Date): void {
  input.setHours(23, 59, 59, 999);
}

export function calculateEndOfDay(input: Date): Date {
  const newDate = new Date(input);
  progressToEndOfDay(newDate);
  return newDate;
}
