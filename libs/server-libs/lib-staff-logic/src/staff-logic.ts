/** @format */
import { cache, parseIfSetElseDefault } from "@the-hive/lib-core";
import { SqlRequest, SqlTransaction } from "@the-hive/lib-db";
import { BadRequestDetail, isError, Office } from "@the-hive/lib-shared";
import { BulkStaffReviewerReassignmentRequest, NewStaffMemberRequest, OnboardingStaff, OnboardingStaffWithContractDates, Staff, StaffDepartment, StaffFilter, StaffSpokenLanguage, StaffStatus, StaffStatusChangeReason, StaffStatusDetail, StaffType, StaffTypeDetail, StaffUpdateFields, StaffWithDirectReportsCount } from "@the-hive/lib-staff-shared";
import {
  addStaffSpokenLanguage,
  bulkReassignStaffToNewReviewer,
  checkIfStaffIsAllowedToTransitionToStaffStatus,
  createCompanyEntityHistoryByEntityAbbreviation,
  createNewStaffDepartmentEntry,
  createStaffCompanyEntityHistory,
  createStaffDepartmentHistory,
  createStaffMember,
  createStaffStatusHistory,
  createStaffTypeHistory,
  deleteStaffSpokenLanguage,
  findLanguageProficiencyIdByProficiencyDescription,
  findOrCreateSpokenLanguageIdByLanguageDescription,
  getStaffAdditionalInfo, getStaffId,
  retrieveActiveFeedbackAssignmentsWithDisplayNames,
  retrieveActiveReviewsWithDisplayNames,
  retrieveActiveStaffDepartment,
  retrieveLanguageProficiencies,
  retrieveOffices,
  retrieveStaffByFilter,
  retrieveStaffDisplayName,
  retrieveStaffNationalities,
  retrieveStaffSpokenLanguages,
  retrieveStaffStatusChangeReasons,
  retrieveStaffStatuses,
  retrieveStaffTypes,
  retrieveStaffWithMissingInformation,
  retrieveStaffWithOnboardingStatus, updateStaffAdditionalInfo,
  updateStaffDateOfBirth,
  updateStaffEmploymentDate,
  updateStaffJobTitle, updateStaffNationality, updateStaffOffice, updateStaffOfficeByOfficeName,
  updateStaffResidence
} from "./queries/staff.queries";
import { formatValidationErrorMessageWithListedNames } from "./validators/staff-validator-functions";
const MAXIMUM_NUMBER_OF_ALLOWED_SPOKEN_LANGUAGES = parseIfSetElseDefault("MAXIMUM_NUMBER_OF_ALLOWED_SPOKEN_LANGUAGES", 3);
const SPOKEN_LANGUAGES_API_URL = parseIfSetElseDefault("SPOKEN_LANGUAGES_API_URL", "https://api.cognitive.microsofttranslator.com/languages?api-version=3.0");

export class StaffLogic {
  db: () => Promise<SqlRequest>;

  constructor(db: () => Promise<SqlRequest>) {
    this.db = db;
  }

  async retrieveStaffDisplayName(staffId: number): Promise<string>{
    const displayName = await retrieveStaffDisplayName(this.db, staffId);
    if(displayName){
      return displayName;
    } else{
      throw new Error(`The supplied staff id ${staffId} is not a valid staff id`);
    }
  }

  getAdditionalInfo(upn: string) {
    return getStaffAdditionalInfo(this.db, upn);
  }

  persistAdditionalInfo(upn: string, info: object): Promise<void> {
    return updateStaffAdditionalInfo(this.db, upn, info);
  }

  async getStaffWithOnboardingStatus(): Promise<OnboardingStaffWithContractDates[]> {
    return retrieveStaffWithOnboardingStatus(this.db);
  }

  async getStaffWithMissingInformation(): Promise<OnboardingStaff[]> {
    return retrieveStaffWithMissingInformation(this.db);
  }

  updateStaffStatus(
    tx: SqlTransaction,
    staffId: number,
    staffStatus: StaffStatus,
    updatedByUPN: string,
    updatedAt: Date = new Date()
  ): Promise<boolean> {
    return createStaffStatusHistory(tx, staffId, staffStatus, updatedByUPN, updatedAt);
  }

  updateStaffType(tx: SqlTransaction, staffId: number, staffType: StaffType, updatedByUPN: string): Promise<boolean> {
    return createStaffTypeHistory(tx, staffId, staffType, updatedByUPN);
  }

  async updateStaffCompanyEntity(
    tx: SqlTransaction,
    upn: string,
    companyEntityId: number,
    updatedByUPN: string,
    effectiveFrom: Date
  ): Promise<true | BadRequestDetail> {
    const staffId = (await getStaffId(this.db, upn));
    if (!staffId) {
      return { message: "Staff ID not found for the provided UPN." };
    } else {
      const staffCompanyEntityUpdated = await createStaffCompanyEntityHistory(tx, staffId, companyEntityId, updatedByUPN, effectiveFrom);
      return staffCompanyEntityUpdated ? staffCompanyEntityUpdated : { message: "Failed to update staff company entity." };
    }
  }

  updateStaffDepartment(
    tx: SqlTransaction,
    staffId: number,
    department: string,
    manager: string,
    updatedByUPN: string,
    effectiveFrom: Date
  ): Promise<boolean> {
    return createStaffDepartmentHistory(tx, staffId, department, manager, updatedByUPN, effectiveFrom);
  }

  createNewStaffDepartmentEntry(
    tx: SqlTransaction,
    staffId: number,
    department: string,
    manager: string,
    startDate: Date,
    updatedByUPN: string,
  ): Promise<boolean> {
    return createNewStaffDepartmentEntry(tx, staffId, department, manager, startDate, updatedByUPN);
  }

  updateStaffOffice(tx: SqlTransaction, staffId: number, officeId: number, updatedByUPN: string): Promise<boolean> {
    return updateStaffOffice(tx, staffId, officeId, updatedByUPN);
  }

  async getStaffStatuses(): Promise<StaffStatusDetail[]> {
    return cache("staffStatuses", async () => await retrieveStaffStatuses(this.db));
  }

  async getStaffTypes(): Promise<StaffTypeDetail[]> {
    return cache("staffTypes", async () => await retrieveStaffTypes(this.db));
  }

  checkIfStaffIsAllowedToTransitionToStaffStatus(staffId: number, staffStatus: StaffStatus): Promise<boolean> {
    return checkIfStaffIsAllowedToTransitionToStaffStatus(this.db, staffId, staffStatus);
  }

  async validateStaffStatusChange(upn: string, nextStatus: StaffStatus): Promise<true | BadRequestDetail> {
    switch (nextStatus) {
      case "pending-delete": {
        const validators = [
          this.validateStaffMemberDoesNotHaveActiveFeedbackAssignments.bind(this),
          this.validateStaffMemberIsNotHrRepOfActiveReviews.bind(this),
          this.validateStaffMemberDoesNotHaveActiveReviews.bind(this)
        ]
        const results = await Promise.all(validators.map(async (validator) => await validator(upn)));
        const errors = results.filter(result => isError(result));
        return errors.length > 0 ? { message: errors.map(result => result.message).join("; ") } : true;
      }

      case "terminated": {
        const validators = [
          this.validateStaffMemberDoesNotHaveActiveFeedbackAssignments.bind(this),
          this.validateStaffMemberDoesNotHaveDirectReports.bind(this),
          this.validateStaffMemberIsNotHrRepOfActiveReviews.bind(this),
          this.validateStaffMemberDoesNotHaveActiveReviews.bind(this)
        ];
        const results = await Promise.all(validators.map(async (validator) => await validator(upn)));

        const errors = results.filter(result => isError(result));
        if (errors.length > 0) {
          return { message: errors.map(result => result.message).join("; ") };
        } else {
          return true;
        }
      }
      default:
        return true;
    }
  }

  async validateStaffMemberDoesNotHaveActiveFeedbackAssignments(upn: string): Promise<true | BadRequestDetail> {
    const activeFeedbackAssignments = await retrieveActiveFeedbackAssignmentsWithDisplayNames(this.db, upn);
    if (activeFeedbackAssignments.length > 0) {
      return formatValidationErrorMessageWithListedNames(
        activeFeedbackAssignments,
        assignment => assignment.revieweeDisplayName,
        "Cannot terminate a staff member that has active feedback assignments. This staff member has outstanding feedback assignments for"
      );
    } else {
      return true;
    }
  }

  async validateStaffMemberDoesNotHaveDirectReports(upn: string): Promise<true | BadRequestDetail> {
    const directReports = await this.getActiveDirectReportsForUpn(upn);
    if (directReports.length > 0) {
      return formatValidationErrorMessageWithListedNames(
        directReports,
        report => report.displayName,
        "Cannot terminate a staff member that has direct reports. This staff member is the reviewer for"
      );
    } else {
      return true;
    }
  }

  async getActiveDirectReportsForUpn(upn: string): Promise<Staff[]> {
    return retrieveStaffByFilter(this.db, { manager: upn }, true);
  }

  async validateStaffMemberIsNotHrRepOfActiveReviews(upn: string): Promise<true | BadRequestDetail> {
    const activeReviews = await retrieveActiveReviewsWithDisplayNames(this.db, { hrRepUpn: upn });
    if (activeReviews.length > 0) {
      return formatValidationErrorMessageWithListedNames(
        activeReviews,
        review => review.revieweeDisplayName,
        "Cannot terminate a staff member that is the owner of active reviews. This staff member has active reviews for"
      );
    } else {
      return true;
    }
  }

  async validateStaffMemberDoesNotHaveActiveReviews(upn: string): Promise<true | BadRequestDetail> {
    const activeReviews = await retrieveActiveReviewsWithDisplayNames(this.db, { revieweeUpn: upn });
    if (activeReviews.length > 0) {
      return formatValidationErrorMessageWithListedNames(
        activeReviews,
        review => review.hrRepDisplayName,
        "Cannot terminate a staff member that is currently under review. This staff member has active reviews with"
      );
    } else {
      return true;
    }
  }

  async markStaffMemberAsTerminated(
    tx: SqlTransaction,
    staffId: number,
    updatedByUPN: string,
    effectiveFrom: Date
  ): Promise<BadRequestDetail | number> {
    const isAllowedToBeTerminated = await this.checkIfStaffIsAllowedToTransitionToStaffStatus(staffId, "terminated");

    if (isAllowedToBeTerminated) {
      const staffStatusHistoryUpdated = await this.updateStaffStatus(tx, staffId, "terminated", updatedByUPN, effectiveFrom);
      const staffTypeHistoryUpdated = await createStaffTypeHistory(tx, staffId, "Terminated", updatedByUPN);

      if (staffStatusHistoryUpdated && staffTypeHistoryUpdated) {
        return staffId;
      } else {
        return { message: "Failed to terminate staff member" };
      }
    } else {
      return { message: "Cannot terminate a staff member that is not pending deletion" };
    }
  }

  getActiveStaffDepartment(staffId: number): Promise<StaffDepartment> {
    return retrieveActiveStaffDepartment(this.db, staffId);
  }

  getStaffByFilter(filter: StaffFilter, tx?: SqlTransaction): Promise<StaffWithDirectReportsCount[]> {
    return retrieveStaffByFilter(tx ?? this.db, filter);
  }

  updateStaffJobTitle(tx: SqlTransaction, staffId: number, jobTitle: string): Promise<boolean> {
    return updateStaffJobTitle(tx, staffId, jobTitle);
  }

  async createOnboardingStaffMember(tx: SqlTransaction, staffMemberToOnboard: NewStaffMemberRequest, updatedByUpn: string): Promise<number | boolean | BadRequestDetail> {
    const applyStaffUpdate = async (updateStaffField: () => Promise<number | boolean | BadRequestDetail>, fieldBeingUpdated: string) => {
      const result = await updateStaffField();
      if (!result || isError(result)) {
        return { message: `Failed to update staff member's ${fieldBeingUpdated}.` };
      } else {
        return result;
      }
    }

    const { upn, displayName, bbdUserName, jobTitle, office, entityAbbreviation, department, reviewer } = staffMemberToOnboard;

    const createdStaffId = await createStaffMember(tx, upn, displayName, bbdUserName, jobTitle);

    if (createdStaffId) {
      const staffCreationFieldsMap: Partial<Record<keyof NewStaffMemberRequest, () => Promise<number | boolean | BadRequestDetail>>> = {
        upn: () => applyStaffUpdate(() => createStaffStatusHistory(tx, createdStaffId, "onboarding", updatedByUpn), "staff status"),
        office: () => applyStaffUpdate(() => updateStaffOfficeByOfficeName(tx, createdStaffId, office, updatedByUpn), "office"),
        entityAbbreviation: () => applyStaffUpdate(() => createCompanyEntityHistoryByEntityAbbreviation(tx, createdStaffId, entityAbbreviation, updatedByUpn, new Date()), "entity abbreviation"),
        reviewer: () => applyStaffUpdate(() => createStaffDepartmentHistory(tx, createdStaffId, department, reviewer, updatedByUpn, new Date()), "reviewer"),
      }

      for (const field of (Object.keys(staffCreationFieldsMap) as (keyof typeof staffCreationFieldsMap)[])) {
        const staffCreationFieldResult = await staffCreationFieldsMap[field]();
        if (isError(staffCreationFieldResult)) {
          throw new Error(staffCreationFieldResult.message);
        } else {
          // There was no error creating a record for the staff member in this table(s), we can continue with the rest of the function
        }
      }

      return createdStaffId;
    } else {
      throw new Error(`Staff member could not be created. This is likely due to a duplicate UPN (${upn}) or BBDUserName (${bbdUserName}) as these must be unique.`);
    }
  }

  async getOffices(): Promise<Office[]> {
    return cache("offices", async () => await retrieveOffices(this.db));
  }

  hasRequiredFieldsForActiveStatus(updatedStaffRecord: Staff): boolean {
    const requiredNonNullFieldsForActiveStatus: (keyof Staff)[] = [
      "staffId",
      "upn",
      "bbdUserName",
      "employmentDate",
      "companyEntityId",
      "department",
      "manager",
      "office",
      "staffType",
      "jobTitle"
    ];

    return requiredNonNullFieldsForActiveStatus.every(field => !!updatedStaffRecord[field]);
  }

  updateStaffEmploymentDate(tx: SqlTransaction, staffId: number, employmentDate: Date): Promise<boolean> {
    return updateStaffEmploymentDate(tx, staffId, employmentDate);
  }

  async updateOnboardingStaffMember(tx: SqlTransaction, staffMember: Staff, updatedBy: string, staffUpdateFields: StaffUpdateFields): Promise<true | BadRequestDetail> {
    const applyStaffUpdate = async (updateStaffField: () => Promise<boolean | BadRequestDetail>, fieldBeingUpdated: string) => {
      const result = await updateStaffField();
      return !result || isError(result) ? { message: `Failed to update staff member's ${fieldBeingUpdated}.` } : true;
    }

    const staffFieldUpdatesMap: Record<keyof StaffUpdateFields, () => Promise<boolean | BadRequestDetail>> = {
      companyEntityId: () => applyStaffUpdate(() => this.updateStaffCompanyEntity(tx, staffMember.upn, staffUpdateFields.companyEntityId, updatedBy, staffUpdateFields.employmentDate ?? new Date()), "company entity"),
      department: () => applyStaffUpdate(() => this.updateStaffDepartment(tx, staffMember.staffId, staffUpdateFields.department, staffUpdateFields.manager, updatedBy, staffUpdateFields.employmentDate ?? new Date()), "department"),
      manager: () => applyStaffUpdate(() => this.updateStaffDepartment(tx, staffMember.staffId, staffUpdateFields.department, staffUpdateFields.manager, updatedBy, staffUpdateFields.employmentDate ?? new Date()), "manager"),
      officeId: () => applyStaffUpdate(() => this.updateStaffOffice(tx, staffMember.staffId, staffUpdateFields.officeId, updatedBy), "office"),
      staffType: () => applyStaffUpdate(() => this.updateStaffType(tx, staffMember.staffId, staffUpdateFields.staffType, updatedBy), "staff type"),
      jobTitle: () => applyStaffUpdate(() => this.updateStaffJobTitle(tx, staffMember.staffId, staffUpdateFields.jobTitle), "job title"),
      employmentDate: () => applyStaffUpdate(() => this.updateStaffEmploymentDate(tx, staffMember.staffId, staffUpdateFields.employmentDate), "employment date"),
    }

    const staffUpdatesToApply = (Object.keys(staffFieldUpdatesMap) as (keyof typeof staffFieldUpdatesMap)[]).filter(key => staffUpdateFields[key]);

    for (const field of staffUpdatesToApply) {
      const staffMemberUpdateResult = await staffFieldUpdatesMap[field]();
      if (isError(staffMemberUpdateResult)) {
        return staffMemberUpdateResult;
      } else {
        // There was no error updating the staff member, we can continue with the rest of the function
      }
    }
    return true;
  }

  async retrieveStaffSpokenLanguages(staffId: number): Promise<StaffSpokenLanguage[]> {
    return retrieveStaffSpokenLanguages(this.db, staffId);
  }

  async retrieveLanguageProficiencies(): Promise<string[]> {
    return retrieveLanguageProficiencies(this.db);
  }

  async updateStaffSpokenLanguages(
    tx: SqlTransaction,
    staffId: number,
    updatedStaffLanguages: StaffSpokenLanguage[]
  ): Promise<void | BadRequestDetail> {
    if (updatedStaffLanguages.length > MAXIMUM_NUMBER_OF_ALLOWED_SPOKEN_LANGUAGES) {
      return { message: `Cannot add more than ${MAXIMUM_NUMBER_OF_ALLOWED_SPOKEN_LANGUAGES} languages for staff member` };
    } else {
      const currentStaffLanguages = await retrieveStaffSpokenLanguages(this.db, staffId);
      for (const existingLanguage of currentStaffLanguages) {
        const languageStillPresent = updatedStaffLanguages.some(
          (updatedLanguage) =>
            updatedLanguage.language === existingLanguage.language &&
            updatedLanguage.proficiency === existingLanguage.proficiency
        );

        if (!languageStillPresent) {
          await deleteStaffSpokenLanguage(tx, staffId, existingLanguage);
        } else {
          // Language exists in the updated list with the same proficiency, so no need to delete it
        }

      }

      for (const updatedLanguage of updatedStaffLanguages) {
        const languageAlreadyExists = currentStaffLanguages.some(
          (existingLanguage) =>
            existingLanguage.language === updatedLanguage.language &&
            existingLanguage.proficiency === updatedLanguage.proficiency
        );

        if (!languageAlreadyExists) {
          const languageId = await findOrCreateSpokenLanguageIdByLanguageDescription(tx, updatedLanguage.language);
          const proficiencyId = await findLanguageProficiencyIdByProficiencyDescription(this.db, updatedLanguage.proficiency);

          if (!proficiencyId) {
            return { message: `Proficiency '${updatedLanguage.proficiency}' not found` };
          } else {
            await addStaffSpokenLanguage(tx, staffId, languageId, proficiencyId);
          }

        }
      }
    }
  }

  async retrieveSpokenLanguages(): Promise<string[]> {
    return cache("spokenLanguages", async () => {
      const response = await fetch(SPOKEN_LANGUAGES_API_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch spoken languages: ${response.status} ${response.statusText}`);
      } else {
        const data = await response.json();
        const languages = Object.values(data.translation).map(
          (language: { name: string }) => language.name
        );
        return languages;
      }
    });
  }

  async retrieveStaffStatusChangeReasons(): Promise<StaffStatusChangeReason[]> {
    return cache("staffStatusChangeReason", async () => retrieveStaffStatusChangeReasons(this.db));
  }

  async bulkReassignStaffToNewReviewer(tx: SqlTransaction, bulkReassignmentRequest: BulkStaffReviewerReassignmentRequest, updatedByUPN: string): Promise<true | BadRequestDetail> {
    if (bulkReassignmentRequest.staffIds.length === 0) {
      return { message: "At least one staff member must be selected to reassign." };
    } else {
      // There are staff members to reassign, so we can continue with the bulk reassignment
    }

    const bulkReassignmentResult = await bulkReassignStaffToNewReviewer(tx, bulkReassignmentRequest, updatedByUPN);
    if (!bulkReassignmentResult) {
      return { message: "Failed to bulk reassign staff to new reviewer, the staffIds provided do not exist." };
    } else {
      return true;
    }
  }

  async updateStaffDateOfBirth(tx: SqlTransaction, staffId: number, dateOfBirth: Date): Promise<boolean> {
    return updateStaffDateOfBirth(tx, staffId, dateOfBirth);
  }


  async updateStaffResidence (tx: SqlTransaction, staffId: number, staffResidence: string): Promise<boolean>{
    return updateStaffResidence(tx, staffId, staffResidence)
  }

  async retrieveStaffNationalities(): Promise<string[]> {
    return retrieveStaffNationalities(this.db);
  }

  async updateStaffNationality(tx: SqlTransaction, staffId: number, nationality: string): Promise<boolean> {
    return updateStaffNationality(tx, staffId, nationality);
  }
}
