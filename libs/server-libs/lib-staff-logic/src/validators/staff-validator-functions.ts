import { BadRequestDetail } from "@the-hive/lib-shared";
import { ActiveStaffType, activeStaffTypes, StaffStatus } from "@the-hive/lib-staff-shared";

export const validateNonEmptyString = (fieldName: string, value: string): string | BadRequestDetail => {
  const valid = value && value.trim().length > 0;
  return valid ? value.trim() : { message: `'${fieldName}' is required and must be non-empty` };
}

export const validateBBDUserName = (fieldName: string, value: string): string | BadRequestDetail => {
  const prefix = 'bbdnet';
  const valid = value && value.trim().startsWith(prefix);
  return valid ? value.trim() as `${typeof prefix}${string}` : { message: `'${fieldName}' is required and must be a valid BBD username starting with '${prefix}'` };
}

export const validateAndParseDate = (fieldName: string, value: string): Date | BadRequestDetail => {
  const valid = !Number.isNaN(Date.parse(value));
  return valid ? new Date(value) : { message: `'${fieldName}' is required and must be a valid ISO date string` };
}

export const validateAndParsePositiveInteger = (fieldName: string, value: unknown): number | BadRequestDetail => {
  const parsedValue = Number(value);
  const valid = !Number.isNaN(parsedValue) && Number.isInteger(parsedValue) && parsedValue > 0;
  return valid ? parsedValue : { message: `${fieldName} is required and must be a positive integer` };
}

export const validatePositiveIntegerArray = (fieldName: string, value: unknown): number[] | BadRequestDetail => {
  const valid = Array.isArray(value) && value.every(item => Number.isInteger(item) && item > 0);
  return valid ? value : { message: `'${fieldName}' is required and must be an array of positive integers` };
}

export const validateActiveStaffType = (fieldName: string, value: string): ActiveStaffType | BadRequestDetail => {
  const valid = activeStaffTypes.map(type => type.toLowerCase()).includes(value.trim().toLowerCase());
  return valid ? value.trim() as ActiveStaffType : { message: `'${fieldName}' must be one of: ${activeStaffTypes.join(', ')}` };
}

export const validateStaffStatus = (fieldName: string, value: string, validStaffStatuses: StaffStatus[]): StaffStatus | BadRequestDetail => {
  const valid = validStaffStatuses.map(status => status.toLowerCase()).includes(value.trim().toLowerCase());
  return valid ? value.trim() as StaffStatus : { message: `'${fieldName}' must be one of: ${validStaffStatuses.join(', ')}` };
}

export const formatValidationErrorMessageWithListedNames = <T>(
  items: T[],
  getDisplayName: (item: T) => string,
  errorMessagePrefix: string
): BadRequestDetail => {
  const maximumNumberOfNamesToDisplay = 3;
  const numberOfNamesToDisplay = items.length > maximumNumberOfNamesToDisplay ? maximumNumberOfNamesToDisplay : items.length;
  const namesToDisplay = items.slice(0, numberOfNamesToDisplay);
  const displayNames = namesToDisplay.map(getDisplayName).join(", ");
  const numberOfRemainingNames = items.length - numberOfNamesToDisplay;
  const remainingNamesDisplay = numberOfRemainingNames > 0 ? ` and ${numberOfRemainingNames} other${numberOfRemainingNames > 1 ? "s" : ""}` : "";
  return { message: `${errorMessagePrefix} ${displayNames}${remainingNamesDisplay}` };
}