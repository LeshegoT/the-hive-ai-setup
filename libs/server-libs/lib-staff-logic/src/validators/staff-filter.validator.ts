import { BadRequestDetail, isError } from "@the-hive/lib-shared";
import { StaffFilter, staffFilterKeys, StaffStatus, StaffType } from "@the-hive/lib-staff-shared";
import { StaffLogic } from "../staff-logic";

type SingleValueValidationFunction<T extends string | number | Date> = (fieldName: string, item: string) => BadRequestDetail | T;
type ArrayValidationFunction<T extends string | number | Date> = (fieldName: string, items: string[]) => BadRequestDetail | T[];

const validateCommaSeparatedString = <T extends string | number | Date>(stringToParse: string, fieldName: string, validationFunction: ArrayValidationFunction<T>): BadRequestDetail | T[] => {
  const split = stringToParse.split(',').map(item => item.trim());
  return validationFunction(fieldName, split);
};

const validateSingleString = <T extends string | number | Date>(stringToParse: string, fieldName: string, validationFunction: SingleValueValidationFunction<T>): BadRequestDetail | T => {
  const trimmed = stringToParse.trim();
  return validationFunction(fieldName, trimmed);
};

const validateStringNonEmpty: SingleValueValidationFunction<string> = (fieldName: string, item: string): BadRequestDetail | string => {
  return item.trim().length > 0 ? item : { message: `Value for '${fieldName}' must be non-empty.` };
};

const parseAndValidateNumbersArray: ArrayValidationFunction<number> = (fieldName: string, items: string[]): BadRequestDetail | number[] => {
  const numbers = items.map(item => parseInt(item, 10));
  if (numbers.some(isNaN)) {
    return { message: `Each value for '${fieldName}' must be a number.` };
  } else if (numbers.some(num => num < 0)) {
    return { message: `Each value for '${fieldName}' must be non-negative.` };
  } else {
    return numbers;
  }
};

const parseAndValidateDate: SingleValueValidationFunction<Date> = (fieldName: string, item: string): BadRequestDetail | Date => {
  const date = new Date(item);
  if (isNaN(date.getTime())) {
    return { message: `Value for '${fieldName}' must be a valid date.` };
  } else {
    return date;
  }
}

const parseAndValidateStaffTypeArray: (staffTypes: StaffType[]) => ArrayValidationFunction<StaffType> = (staffTypes: StaffType[]) => {
  return (fieldName: string, items: string[]): BadRequestDetail | StaffType[] => {
    const invalidTypes = items.filter(item => !staffTypes.map(type => type.toLocaleLowerCase()).includes(item.toLowerCase() as StaffType));
    if (invalidTypes.length > 0) {
      return { message: `Invalid values for '${fieldName}': ${invalidTypes.join(', ')}. Valid values are: ${staffTypes.join(', ')}.` };
    } else {
      return items as StaffType[];
    }
  }
}

const parseAndValidateStaffStatusArray: (staffStatuses: StaffStatus[]) => ArrayValidationFunction<StaffStatus> = (staffStatuses: StaffStatus[]) => {
  return (fieldName: string, items: string[]): BadRequestDetail | StaffStatus[] => {
    const invalidStatuses = items.filter(item => !staffStatuses.map(status => status.toLocaleLowerCase()).includes(item.toLowerCase() as StaffStatus));
    if (invalidStatuses.length > 0) {
      return { message: `Invalid values for '${fieldName}': ${invalidStatuses.join(', ')}. Valid values are: ${staffStatuses.join(', ')}.` };
    } else {
      return items as StaffStatus[];
    }
  }
}

const getArrayValidatorForFilterKey = (
  filterKey: keyof StaffFilter,
  staffTypes: StaffType[],
  staffStatuses: StaffStatus[]
): ArrayValidationFunction<string | number | Date> => {
  switch (filterKey) {
    case 'staffIds':
      return parseAndValidateNumbersArray;
    case 'staffTypes':
      return parseAndValidateStaffTypeArray(staffTypes);
    case 'staffStatuses':
      return parseAndValidateStaffStatusArray(staffStatuses);
    default:
      throw new Error(`Invalid array filter key: ${filterKey}`);
  }
};

const getSingleValueValidatorForFilterKey = (
  filterKey: keyof StaffFilter,
): SingleValueValidationFunction<string | number | Date> => {
  switch (filterKey) {
    case 'upn':
    case 'entityAbbreviation':
    case 'department':
    case 'manager':
    case 'office':
    case 'jobTitle':
    case 'displayName':
    case 'bbdUserName':
      return validateStringNonEmpty;
    case 'employmentDate':
      return parseAndValidateDate;
    default:
      throw new Error(`Invalid single value filter key: ${filterKey}`);
  }
};

const combinePartialStaffFilter = <T extends Partial<StaffFilter> | BadRequestDetail>(partialStaffFiltersOrErrors: T[]): T => partialStaffFiltersOrErrors.reduce((combinedStaffFilter, partialStaffFilter) => ({ ...combinedStaffFilter, ...partialStaffFilter }), {} as T);

export const parseAndValidateStaffFilter = async (queryParameters, staffLogic: StaffLogic): Promise<StaffFilter | BadRequestDetail> => {
  const staffTypes = (await staffLogic.getStaffTypes()).map(t => t.staffType);
  const staffStatuses = (await staffLogic.getStaffStatuses()).map(s => s.staffStatus);
  
  const partialStaffFiltersOrErrors = staffFilterKeys.map((filterKey) => {
    const value = queryParameters[filterKey];
    if (!value?.trim()) {
      return { [filterKey]: undefined };
    } else if (filterKey === 'staffIds' || filterKey === 'staffTypes' || filterKey === 'staffStatuses') {
      return {
        [filterKey]: validateCommaSeparatedString(value, filterKey, getArrayValidatorForFilterKey(filterKey, staffTypes, staffStatuses))
      };
    } else {
      return {
        [filterKey]: validateSingleString(value, filterKey, getSingleValueValidatorForFilterKey(filterKey))
      };
    }
  });

  const validatedStaffFilterOrErrors = combinePartialStaffFilter(partialStaffFiltersOrErrors);

  const validationErrors: BadRequestDetail[] = Object.values(validatedStaffFilterOrErrors).filter(value => !!value).filter(isError);
  if (validationErrors.length > 0) {
    return {
      message: validationErrors.map(error => error.message).join(', ')
    };
  } else {
    return validatedStaffFilterOrErrors;
  }
}
