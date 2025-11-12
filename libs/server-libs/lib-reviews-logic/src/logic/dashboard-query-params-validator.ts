import { parseAndValidateCompanyEntities } from "@the-hive/lib-core";
import { DashboardFilterParams, latenessCategories, periodLengths, contractRecommendationStatuses, RequestValidationError, ReviewsDashboardFieldValidationRule } from "@the-hive/lib-reviews-shared";
import { BadRequestDetail, CompanyEntity, isError } from "@the-hive/lib-shared";

export function isValidationError(filtersOrError: DashboardFilterParams | RequestValidationError): filtersOrError is RequestValidationError {
  return typeof filtersOrError === 'object' && filtersOrError !== null && 'message' in filtersOrError;
}


const separateValidAndInvalidValues = <AllowedValue extends string>(
  inputValues: string[],
  allowedValues: readonly AllowedValue[]
): { validValues: AllowedValue[]; invalidValues: string[] } => {
  const validValues: AllowedValue[] = [];
  const invalidValues: string[] = [];

  for (const queryParamValue of inputValues) {
    const matchingAllowedValue = allowedValues.find(
      allowedQueryParamValue => allowedQueryParamValue.toLowerCase() === queryParamValue.toLowerCase()
    );

    if (matchingAllowedValue) {
      validValues.push(matchingAllowedValue);
    } else {
      invalidValues.push(queryParamValue);
    }
  }

  return { validValues, invalidValues };
};

export async function validateAndParseReviewsDashboardQueryParams(req, getCompanyEntities: () => Promise<CompanyEntity[]>, fieldsToValidate: string[]): Promise<DashboardFilterParams | RequestValidationError> {
  const invalidFields: ReviewsDashboardFieldValidationRule[] = [];
  const companyEntitiesLookup = await getCompanyEntities();
  let companyEntities: CompanyEntity[] | BadRequestDetail;

  if (fieldsToValidate.includes("companyEntities")) {
    companyEntities = parseAndValidateCompanyEntities(req.query.companyEntities, companyEntitiesLookup);
    if (isError(companyEntities)) {
      invalidFields.push({
        field: "companyEntities",
        valid: false,
        error: companyEntities.message,
        requiresValidation: fieldsToValidate.includes("companyEntities"),
      });
    } else {
      // Company entities are valid
    }
  } else {
    // Company entities is not provided, no need to validate it
  }

  const splitAndValidateExcludedValues = <AllowedValue extends string>(
    fieldName: string,
    valuesToCheck: string | undefined,
    allowedValues: readonly AllowedValue[]
  ): AllowedValue[] => {
    const requiresValidation = fieldsToValidate.includes(fieldName);
    const splitValues = valuesToCheck.split(',');

    const { validValues, invalidValues } = separateValidAndInvalidValues(splitValues, allowedValues);

    if (requiresValidation && invalidValues.length > 0) {
      invalidFields.push({
        field: fieldName,
        valid: false,
        error: `${fieldName} contains invalid values: ${invalidValues.join(', ')}.`,
        requiresValidation: true
      });
    } else {
      // Field validation not required or all values are valid, no errors to add
    }

    return validValues;
  };


  const { asAtEndOf, periodLength, lateness, status } = req.query;
  const parsedAsAtEndOf = new Date(asAtEndOf);
  const validations: ReviewsDashboardFieldValidationRule[] = [
    {
      field: "asAtEndOf",
      valid: !!asAtEndOf,
      error: "asAtEndOf is required.",
      requiresValidation: fieldsToValidate.includes("asAtEndOf"),
    },
    {
      field: "asAtEndOf",
      valid: !!asAtEndOf && !isNaN(parsedAsAtEndOf.getTime()),
      error: "asAtEndOf must be a valid date.",
      requiresValidation: fieldsToValidate.includes("asAtEndOf"),
    },
    {
      field: "periodLength",
      valid: !!periodLength,
      error: "periodLength is required.",
      requiresValidation: fieldsToValidate.includes("periodLength"),
    },
    {
      field: "periodLength",
      valid: !!periodLength && periodLengths.includes(periodLength),
      error: `periodLength must be one of: ${periodLengths.join(", ")}.`,
      requiresValidation: fieldsToValidate.includes("periodLength"),
    },
    {
      field: "lateness",
      valid: !!lateness,
      error: "lateness is required.",
      requiresValidation: fieldsToValidate.includes("lateness"),
    },
    {
      field: "lateness",
      valid: !!lateness && latenessCategories.includes(lateness),
      error: `lateness must be one of: ${latenessCategories.join(", ")}.`,
      requiresValidation: fieldsToValidate.includes("lateness"),
    },
    {
      field: "status",
      valid: !!status,
      error: "status is required.",
      requiresValidation: fieldsToValidate.includes("status"),
    },
  ];
  invalidFields.push(...validations.filter(validation => !validation.valid && validation.requiresValidation));
  if (invalidFields.length > 0) {
    return {
      message: "One or more fields are invalid.",
      details: invalidFields.map(invalidField => invalidField.error)
    }
  } else {
    const excludedStatuses = req.query.excludedStatuses ? splitAndValidateExcludedValues('excludedStatuses', req.query.excludedStatuses, contractRecommendationStatuses) : [];
    const excludedLatenesses = req.query.excludedLatenesses ? splitAndValidateExcludedValues('excludedLatenesses', req.query.excludedLatenesses, latenessCategories) : [];

    return {
      asAtEndOf: new Date(req.query.asAtEndOf),
      periodLength: req.query.periodLength,
      numberOfPeriods: Number(req.query.numberOfPeriods),
      companyEntities: !companyEntities || isError(companyEntities) ? [] : companyEntities,
      excludedStatuses,
      excludedHrReps: req.query.excludedHrReps?.split(',') || [],
      excludedLatenesses,
      status: req.query.status,
      lateness: req.query.lateness,
      hrRep: req.query.hrRep
    }
  }

}