import { BadRequestDetail, isError } from "@the-hive/lib-shared";
import { ActiveStaffType, NewStaffMemberRequest } from "@the-hive/lib-staff-shared";
import { validateBBDUserName, validateNonEmptyString } from "./staff-validator-functions";

const isValidNewStaffMemberRequest = (value: Record<keyof NewStaffMemberRequest, string | Date | ActiveStaffType | BadRequestDetail>): value is NewStaffMemberRequest => {
  return Object.values(value).every(detail => !isError(detail));
}

export const parseAndValidateNewStaffMemberRequest = (body: Record<keyof NewStaffMemberRequest, string>): NewStaffMemberRequest | BadRequestDetail => {
  const parsedOrBadRequestDetails = {
    upn: validateNonEmptyString('upn', body.upn),
    displayName: validateNonEmptyString('displayName', body.displayName),
    bbdUserName: validateBBDUserName('bbdUserName', body.bbdUserName),
    jobTitle: validateNonEmptyString('jobTitle', body.jobTitle),
    office: validateNonEmptyString('office', body.office),
    entityAbbreviation: validateNonEmptyString('entityAbbreviation', body.entityAbbreviation),
    department: validateNonEmptyString('department', body.department),
    reviewer: validateNonEmptyString('reviewer', body.reviewer),
  }

  if (!isValidNewStaffMemberRequest(parsedOrBadRequestDetails)) {
    return {
      message: Object.values(parsedOrBadRequestDetails)
        .filter(detail => isError(detail))
        .map(detail => detail.message)
        .join(', ')
    };
  } else {
    return parsedOrBadRequestDetails;
  }
}
