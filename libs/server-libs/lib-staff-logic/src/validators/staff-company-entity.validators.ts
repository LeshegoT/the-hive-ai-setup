import { BadRequestDetail } from "@the-hive/lib-shared";

export type StaffCompanyEntityUpdate = { companyEntityId: number, effectiveFrom: Date };

export const parseAndValidateCompanyEntityUpdate = (body: unknown): StaffCompanyEntityUpdate | BadRequestDetail => {
  const invalidFields = [
    {
      message: "'companyEntityId' is required",
      error: !body["companyEntityId"]
    },
    {
      message: "'effectiveFrom' is required",
      error: !body["effectiveFrom"]
    },
    {
      message: "companyEntityId must be a positive integer",
      error: !Number.isInteger(body["companyEntityId"]) || body["companyEntityId"] <= 0
    },
    {
      message: "'effectiveFrom' must be a valid ISO date string",
      error: Number.isNaN(Date.parse(body["effectiveFrom"]))
    }
  ].filter(field => field.error);

  if (invalidFields.length > 0) {
    return { message: invalidFields.map(field => field.message).join(', ') };
  } else {
    return {
      companyEntityId: Number(body["companyEntityId"]),
      effectiveFrom: new Date(body["effectiveFrom"]),
    };
  }
}
