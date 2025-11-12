import type { BadRequestDetail, CompanyEntity, Pagination } from "@the-hive/lib-shared";
import { parseIfSetElseDefault } from "./environment-utils";
import { Lookup } from "./lookup";
const defaultStartIndex = parseIfSetElseDefault("DEFAULT_PAGINATION_START_INDEX", 0);
const defaultPageLength = parseIfSetElseDefault("DEFAULT_PAGINATION_PAGE_LENGTH", 25);
const minimumPageLength = parseIfSetElseDefault("MINIMUM_PAGE_LENGTH", 5);

// TODO: RE - this function is totally ignoring TS types and just allows anyone to 'trust-me-bro' at the type level
export function isOfType<T>(someObject: unknown): someObject is T {
    return true;
}

function buildBadRequestDetail(message: string): BadRequestDetail {
    return {
        message,
    };
}

export function validateAndParsePagination(
  startIndex: string | undefined,
  pageLength: string | undefined,
): Pagination | BadRequestDetail {

  const invalidPageLengthMessage = `Page length must be a number  greater than or equal to ${minimumPageLength}`;
  const invalidStartIndexMessage = "Start index must be a number  greater than or equal to 0";

  if (startIndex && startIndex.trim() === "") {
      return buildBadRequestDetail(invalidStartIndexMessage);
  } else if (pageLength && pageLength.trim() === "") {
    return buildBadRequestDetail(invalidPageLengthMessage);
  } else {
    const pagination = {
      startIndex: startIndex ? Number(startIndex) : defaultStartIndex,
      pageLength: pageLength ? Number(pageLength) : defaultPageLength,
    };
    if (isNaN(pagination.startIndex) || pagination.startIndex < 0) {
      return {
        message: invalidStartIndexMessage,
      };
    } else if (isNaN(pagination.pageLength) || pagination.pageLength < minimumPageLength) {
      return {
        message: invalidPageLengthMessage,
      };
    } else {
      return pagination;
    }
  }
}

export function parseAndValidateCompanyEntities(
    companyEntities: string,
    companyEntitiesLookup: CompanyEntity[]
): CompanyEntity[] | BadRequestDetail {
    if (!companyEntities || companyEntities.trim() === '') {
        return []
    } else {
      const companyIds = companyEntities
          .split(',')
          .map(id => parseInt(id.trim()));

      if (companyIds.some(isNaN)) {
          return buildBadRequestDetail('Each company entity must be a valid number');
      } else if (companyIds.some(id => id < 0)) {
          return buildBadRequestDetail('Each company entity ID must be a positive integer');
      } else {
          const lookup = new Lookup<CompanyEntity, 'companyEntityId', 'description'>(
              'CompanyEntity',
              companyEntitiesLookup,
              'companyEntityId',
              'description'
          );

          const missingIds = companyIds.filter(id => !lookup.getById(id));
          if (missingIds.length > 0) {
              return buildBadRequestDetail(
                  `Company entity IDs not found: ${missingIds.join(', ')}`
              );
          } else {
              // the non-null assertion is now safe, since missingIds is empty
              return companyIds.map(id => lookup.getById(id)!);
          }
        }
    }
}
