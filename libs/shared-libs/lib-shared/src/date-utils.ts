import moment, { Moment } from 'moment';

export function progressToEndOfDay(input: Date): void {
  input.setHours(23, 59, 59);
}

export function calculateEndOfDay(input: Date): Date {
  const newDate = new Date(input);
  progressToEndOfDay(newDate);
  return newDate;
}

export function parseDate(dateToParse: Date | string): Date | undefined {
  const parsedDate = new Date(dateToParse);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
};

export function formatAsYearsAndMonths(years: number): string {
  const duration = moment.duration(years * 12, 'months');

  const wholeYears = duration.years();
  const months = duration.months();

  const formattedExperienceParts = [];

  if (wholeYears > 0) {
    formattedExperienceParts.push(`${wholeYears} year${wholeYears > 1 ? 's' : ''}`);
  } else {
    // Don't add the years
  }

  if (months > 0) {
    formattedExperienceParts.push(`${months} month${months > 1 ? 's' : ''}`);
  } else {
    // Don't add the months
  }

  return formattedExperienceParts.join(' and ');
}

export const findOverlappingDateRanges = <T extends ({ startDate: Moment, endDate: Moment })>(
  startDate: Moment,
  endDate: Moment,
  otherDateRanges: T[]
): T[] => {
  const newStartDate = moment(startDate);
  const newEndDate = moment(endDate);

  return otherDateRanges.filter(({ startDate, endDate }) => {
    const existingStartDate = moment(startDate);
    const existingEndDate = moment(endDate);
    return existingStartDate.isSameOrBefore(newEndDate) && newStartDate.isSameOrBefore(existingEndDate);
  });
}
