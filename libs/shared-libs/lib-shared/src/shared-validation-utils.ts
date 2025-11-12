import { BadRequestDetail, isError } from "./response-types";

export type ValidationResult<T> = {
  [Key in keyof T]: T[keyof T] | BadRequestDetail;
};

const isValidRequest = <T>(value: ValidationResult<T>): value is T => {
  return Object.values(value).every(detail => !isError(detail));
}

export const parseAndValidate = <T>(validationObject: ValidationResult<T>): T | BadRequestDetail => {
  if (isValidRequest(validationObject)) {
    return validationObject;
  } else {
    const badRequest: BadRequestDetail = Object.values(validationObject)
      .filter(value => isError(value))
      .reduce((accumulatedBadRequest, currentBadRequest) => {
        const messages = [accumulatedBadRequest.message, currentBadRequest.message];
        const details = [accumulatedBadRequest.detail, currentBadRequest.detail];
        return {
          message: messages.filter(message => !!message).join('; '),
          detail: details.filter(detail => !!detail).join('; ')
        };
      }, { message: "", detail: "" });

    return badRequest;
  }
}