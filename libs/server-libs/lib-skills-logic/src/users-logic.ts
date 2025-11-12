/** @format */
import { SqlRequest, SqlTransaction } from "@the-hive/lib-db";
  import { parseIfSetElseDefault } from "@the-hive/lib-core";
import {
  AttributeType,
  BadRequestDetail,
  FieldValue,
  Guid,
  RequiredField,
  StaffOnSupply,
  DecoratedStaff,
  UserAttribute,
  OnSupplyRole,
  Attribute,
  StandardizedName,
  UserAttributeWithStaffDetails,
  PendingProofValidation,
} from "@the-hive/lib-skills-shared";
import gremlin from "gremlin";
import { AttributeLogic } from "./attribute-logic";
import { deleteEdgeByGuid, getRequiredFieldDetails, getSkillRequiredFields, updateEdgePropertyForProofRejection } from "./queries/attribute.queries";
import { getAliases, getCanonicalNameDetails, retrieveCanonicalNames } from "./queries/canonical-name.queries";
import {
  addAttributeAsCoreTechForUser,
  getCoreTechCountForUser,
  isAttributeAlreadyAddedAsCoreTech,
  addStaffToSupply,
  doesEdgeExistForUser,
  getAllSkillsUsers,
  getEdgeById,
  getStaffDetailsByStaffIds,
  getStaffId,
  getStaffIdsByCompanyEntityFilter,
  getStaffOnSupply,
  getStaffOnSupplySummary,
  getUserAttributes,
  getUserAttributesByPagination,
  getUserDetailsByStaffIds,
  removeStaffFromSupply,
  updateSkillsLastModifiedForUser,
  updateStaffOnSupply,
  updateUserLastVisitedIfNotUpdatedToday,
  addUserAttributeIfNotAddedOrIfRepeatable,
  isAttributeAlreadyAddedForUser,
  retrieveMetaDataTagsForAttributeOrInstitution,
  retrieveAllSkillsUsersWithoutGivenAttributeType,
  removeAllCoreTechForUser,
  addAttributesAsCoreTechForUser,
  editUserAttribute,
  removeCoreTechInformationFromAttribute,
  retrieveStaffOnSupplyByUpn,
  retrieveOnSupplyRoles,
  createStaffOnSupplyRole,
  getUsersConnectedToAttribute,
  retrieveStaffWithAttributeObtainedFromInstitution,
  getPendingProofValidations,
  getAllStaffDetailsByStaffIds,
  updateQualificationEdgeProperty,

} from "./queries/users.queries";
import { Staff } from "@the-hive/lib-staff-shared";
const ALLOWED_CORE_ATTRIBUTE_TYPES = parseIfSetElseDefault("ALLOWED_CORE_ATTRIBUTE_TYPES", [
  "skill",
  "industry-knowledge",
]);
const MAXIMUM_CORE_ATTRIBUTES_FOR_USER = parseIfSetElseDefault("MAXIMUM_CORE_ATTRIBUTES_FOR_USER", 3);
export class UsersLogic {
  attributeData: AttributeLogic;
  db: () => Promise<SqlRequest>;
  gremlin: gremlin.driver.Client;

  constructor(db: () => Promise<SqlRequest>, gremlin: gremlin.driver.Client) {
    this.db = db;
    this.gremlin = gremlin;
    this.attributeData = new AttributeLogic(this.db, this.gremlin);
  }

  async addUserAttribute(
    tx: SqlTransaction,
    userAttribute: Omit<UserAttribute, "staffId">,
    upn: string,
  ): Promise<UserAttribute | BadRequestDetail> {
    const staffId = await getStaffId(this.db, upn);
    const canoncialNameifExists = await retrieveCanonicalNames(this.db, userAttribute.attribute.canonicalName);
    if (
      canoncialNameifExists[0] &&
      canoncialNameifExists[0].canonicalNameCategory !== userAttribute.attribute.attributeType
    ) {
      return {
        message: `${userAttribute.attribute.canonicalName} already exists as ${canoncialNameifExists[0].canonicalNameCategory}`,
      };
    } else {
      const alreadyAdded = await isAttributeAlreadyAddedForUser(
        this.gremlin,
        userAttribute.attribute.standardizedName,
        staffId,
      );
      if (alreadyAdded) {
        const metaDataTags = await retrieveMetaDataTagsForAttributeOrInstitution(
          this.gremlin,
          userAttribute.attribute.standardizedName,
        );
        if (metaDataTags.includes("Repeatable")) {
          await updateSkillsLastModifiedForUser(tx, staffId);
          return await addUserAttributeIfNotAddedOrIfRepeatable(this.gremlin, userAttribute, staffId);
        } else {
          return {
            message: `${userAttribute.attribute.canonicalName} has already been added to your portfolio. Please edit the existing one`,
          };
        }
      } else {
        await this.updateSkillsLastModifiedForUser(tx, staffId);
        return await addUserAttributeIfNotAddedOrIfRepeatable(this.gremlin, userAttribute, staffId);
      }
    }
  }

  async editUserAttribute(userAttribute: UserAttribute): Promise<UserAttribute | BadRequestDetail> {
    const alreadyAdded = await isAttributeAlreadyAddedForUser(
      this.gremlin,
      userAttribute.attribute.standardizedName,
      userAttribute.staffId,
    );
    if (!alreadyAdded) {
      return {
        message: `${userAttribute.attribute.canonicalName} does not exist on your portfolio. Please add it first before editing it`,
      };
    } else {
      return await editUserAttribute(this.gremlin, userAttribute);
    }
  }

  async getRequiredFieldsForAttribute(attributeId: string) {
    const requiredFields = await getSkillRequiredFields(this.gremlin, attributeId);
    const requiredFieldsWithCanonicalNameDetails: RequiredField[] = [];
    const fieldNames = requiredFields.map((skillfield) => skillfield.name);

    const canonicalNameDetails = await getRequiredFieldDetails(this.db, fieldNames);

    for (const skillField of requiredFields) {
      const matchedCanonicalNameDetail = canonicalNameDetails.find(
        (canonicalnameDetail) => canonicalnameDetail.standardizedName === skillField.name,
      );

      if (matchedCanonicalNameDetail) {
        const requiredFieldDetails: RequiredField = {
          standardizedName: matchedCanonicalNameDetail.standardizedName,
          canonicalName: matchedCanonicalNameDetail.canonicalName,
          canonicalNameId: matchedCanonicalNameDetail.canonicalNameId,
          canonicalNameGuid: skillField.canonicalNameGuid,
          skillsFieldId: matchedCanonicalNameDetail.skillsFieldId,
        };
        requiredFieldsWithCanonicalNameDetails.push(requiredFieldDetails);
      } else {
        // CanonicalNameDetail is for a different field
      }
    }
    return requiredFieldsWithCanonicalNameDetails;
  }

  async getAllUserProfiles(startIndex, pageLength) {
    const userAttributes = await getUserAttributesByPagination(this.gremlin, startIndex, pageLength);
    const userProfile: UserAttribute[] = [];

    for (const attribute of userAttributes) {
      const userAttribute = await this.makeUserAttributeObject(attribute);
      userProfile.push(userAttribute);
    }
    return userProfile;
  }

  async getUserCount(
    selectedCompanyEntityIds: string,
    searchDate?: string,
    staffNameSearchText?: string,
    attributeType?: AttributeType,
  ): Promise<{ usersWithSkillsProfiles: number; totalStaff: number } | BadRequestDetail> {
    let staffIds;
    if (searchDate) {
      const selectedSearchDate = new Date(searchDate);
      if (!isNaN(selectedSearchDate.getTime())) {
        staffIds = await getStaffIdsByCompanyEntityFilter(
          this.db,
          selectedCompanyEntityIds,
          staffNameSearchText,
          selectedSearchDate,
        );
      } else {
        return {
          message: "Invalid parameters",
          detail: "Date not in ISO Format",
        };
      }
    } else {
      staffIds = await getStaffIdsByCompanyEntityFilter(this.db, selectedCompanyEntityIds, staffNameSearchText);
    }

    const staffIdsOfStaffWhoHaveUsedSkills = attributeType
      ? await retrieveAllSkillsUsersWithoutGivenAttributeType(this.gremlin, attributeType)
      : await getAllSkillsUsers(this.gremlin);

    return {
      usersWithSkillsProfiles: staffIdsOfStaffWhoHaveUsedSkills.filter((staffId) => staffIds.includes(staffId)).length,
      totalStaff: staffIds.length,
    };
  }

  getStaffOnSupplySummary(): Promise<number> {
    return getStaffOnSupplySummary(this.db);
  }

  async getStaffOnSupply(): Promise<StaffOnSupply[]> {
    const staffOnSupply = await getStaffOnSupply(this.db);
    return Promise.all(
      staffOnSupply.map(async (staff) => {
        return {
          ...staff,
          staffCoreTech: await this.retrieveStaffCoreTech(staff.staffId),
        };
      }),
    );
  }

  async retrieveStaffOnSupplyByUpn(upn: string): Promise<StaffOnSupply> {
    return retrieveStaffOnSupplyByUpn(this.db, upn);
  }

  async removeStaffFromSupply(tx: SqlTransaction, upn: string, deletedBy: string): Promise<void> {
    const staffId = await getStaffId(this.db, upn);
    await this.replaceStaffCoreTech([], staffId);
    return removeStaffFromSupply(tx, upn, deletedBy);
  }

  async updateStaffOnSupply(upn: string, onSupplyAsOf: Date): Promise<boolean | BadRequestDetail> {
    const staffId = await getStaffId(this.db, upn);
    if (staffId) {
      await updateStaffOnSupply(this.db, staffId, onSupplyAsOf);
      return true;
    } else {
      return {
        message: "User not found.",
        detail: `Could not find staff details for user ${upn}`,
      };
    }
  }

  async addStaffToSupply(
    upn: string,
    addedBy: string,
    onSupplyAsOf: Date,
  ): Promise<UserAttribute[] | BadRequestDetail> {
    const staffId = await getStaffId(this.db, upn);
    if (staffId) {
      addStaffToSupply(this.db, staffId, addedBy, onSupplyAsOf);
      return this.retrieveStaffCoreTech(staffId);
    } else {
      return {
        message: "User not found.",
        detail: `Could not find staff details for user ${upn}`,
      };
    }
  }

  async getStaffSummary(
    companyEntityIds: number[],
    startIndex: number,
    pageLength: number,
    hasSkills: boolean,
    searchDate?: string,
    staffNameSearchText?: string,
    sortedColumn?: keyof DecoratedStaff,
    sortOrder?: string,
    attributeType?: AttributeType,
  ): Promise<DecoratedStaff[] | BadRequestDetail> {
    if (companyEntityIds.length === 0) {
      return [];
    } else {
      const staffIdsOfSkillsUsers = attributeType
        ? await retrieveAllSkillsUsersWithoutGivenAttributeType(this.gremlin, attributeType)
        : await getAllSkillsUsers(this.gremlin);

      let staffDetails: DecoratedStaff[] | BadRequestDetail;
      if (searchDate) {
        const selectedSearchDate = new Date(searchDate);
        if (!isNaN(selectedSearchDate.getTime())) {
          staffDetails = await getStaffDetailsByStaffIds(
            this.db,
            companyEntityIds,
            staffIdsOfSkillsUsers,
            hasSkills,
            startIndex,
            pageLength,
            staffNameSearchText,
            sortedColumn,
            sortOrder,
            selectedSearchDate,
          );
        } else {
          return {
            message: "Invalid parameters",
            detail: "Date not in ISO Format",
          };
        }
      } else {
        staffDetails = await getStaffDetailsByStaffIds(
          this.db,
          companyEntityIds,
          staffIdsOfSkillsUsers,
          hasSkills,
          startIndex,
          pageLength,
          staffNameSearchText,
          sortedColumn,
          sortOrder,
        );
      }
      return staffDetails;
    }
  }

  async getUserProfile(upn: string, attributeType?: AttributeType): Promise<UserAttribute[] | BadRequestDetail> {
    const staffId = await getStaffId(this.db, upn);
    if (!staffId) {
      return {
        message: "User not found.",
        detail: `Could not find staff details for user ${upn}`,
      };
    } else {
      // Given upn is valid so we can continue with the function
    }

    const userAttributes = await getUserAttributes(this.gremlin, staffId, attributeType);
    return await this.mapGremlinToUserAttributes(userAttributes, staffId);
  }

  private async mapGremlinToUserAttributes(userAttributes, staffId: number): Promise<UserAttribute[]> {
    return Promise.all(userAttributes.map((attribute) => this.mapGremlinToUserAttribute(attribute, staffId)));
  }

  private async mapGremlinToUserAttribute(attribute, staffId: number): Promise<UserAttribute> {
    const canonicalNameDetails = await getCanonicalNameDetails(this.db, attribute.attribute);
    const attributeSkillPath = await this.attributeData.getSkillPathDetails(attribute.attributeId);
    const aliases = canonicalNameDetails ? await getAliases(this.db, canonicalNameDetails.canonicalNameId) : [];
    const requiredFields = await this.getRequiredFieldsForAttribute(attribute.attributeId);

    const userAttribute: UserAttribute = {
      staffId,
      attribute: {
        standardizedName: attribute.attribute,
        attributeType: attribute.attributeType,
        canonicalName: canonicalNameDetails?.canonicalName ?? undefined,
        canonicalNameGuid: attribute.attributeId,
        canonicalNameId: canonicalNameDetails?.canonicalNameId ?? undefined,
        aliases: aliases,
        needsRatification: attribute.needsRatification,
        requiredFields: requiredFields,
        skillPath: attributeSkillPath,
      },
      fieldValues: attribute.attributesDetails,
      guid: attribute.edgeId,
    };
    return userAttribute;
  }

  async mapStaffToUserAttributeWithStaffDetails(attribute: Attribute, userConnectedToAttribute: Pick<UserAttribute, 'staffId' | 'fieldValues'>[]): Promise<UserAttributeWithStaffDetails[]> {
    const userDetails = await getUserDetailsByStaffIds(this.db, userConnectedToAttribute.map(userData => userData.staffId));
    return userConnectedToAttribute.map(userData => {
      const userDetail = userDetails.find(user => user.staffId === userData.staffId);
      return {
        staffId: userData.staffId,
        upn: userDetail.upn,
        displayName: userDetail.displayName,
        fieldValues: userData.fieldValues,
        guid: attribute.canonicalNameGuid,
        attribute: attribute,
      };
    });
  }

  async getUsersByAttribute(attribute: Attribute): Promise<UserAttributeWithStaffDetails[]> {
    const usersConnectedToAttribute = await getUsersConnectedToAttribute(this.gremlin, attribute);
    return await this.mapStaffToUserAttributeWithStaffDetails(attribute, usersConnectedToAttribute);
  }

  async checkIfEdgeConnectsToUser(staffId: number, edgeId: string) {
    const userEdgeExists = await doesEdgeExistForUser(this.gremlin, staffId, edgeId);
    return userEdgeExists;
  }

  async makeUserAttributeObject(gremlinAttributeData: {
    guid: Guid;
    staffId: number;
    canonicalNameGuid: string;
    standardizedName: string;
    attributeType: AttributeType;
    fieldValues: FieldValue[];
    needsRatification: boolean;
  }): Promise<UserAttribute> {
    const canonicalNameDetails = await getCanonicalNameDetails(this.db, gremlinAttributeData.standardizedName);
    const attributeSkillPath = await this.attributeData.getSkillPathDetails(gremlinAttributeData.canonicalNameGuid);
    const aliases = canonicalNameDetails ? await getAliases(this.db, canonicalNameDetails.canonicalNameId) : [];
    const requiredFields = await this.getRequiredFieldsForAttribute(gremlinAttributeData.canonicalNameGuid);

    const userAttribute: UserAttribute = {
      staffId: gremlinAttributeData.staffId,
      attribute: {
        standardizedName: gremlinAttributeData.standardizedName,
        attributeType: gremlinAttributeData.attributeType,
        canonicalName: canonicalNameDetails?.canonicalName ?? undefined,
        canonicalNameGuid: gremlinAttributeData.canonicalNameGuid,
        canonicalNameId: canonicalNameDetails?.canonicalNameId ?? undefined,
        aliases: aliases,
        needsRatification: gremlinAttributeData.needsRatification,
        requiredFields: requiredFields,
        skillPath: attributeSkillPath,
      },
      fieldValues: gremlinAttributeData.fieldValues,
      guid: gremlinAttributeData.guid,
    };

    return userAttribute;
  }

  async removeUserAttribute(tx: SqlTransaction, upn: string, guid: Guid): Promise<UserAttribute | BadRequestDetail> {
    const staffId = await getStaffId(this.db, upn);
    const isAttributeAddedForUser = await this.checkIfEdgeConnectsToUser(staffId, guid);
    if (isAttributeAddedForUser) {
      const userAttribute = await getEdgeById(this.gremlin, guid);
      if (userAttribute.staffId === staffId) {
        const deletedUserAttribute = await this.makeUserAttributeObject(userAttribute);
        await deleteEdgeByGuid(this.gremlin, guid);
        await updateSkillsLastModifiedForUser(tx, staffId);
        return deletedUserAttribute;
      } else {
        return { message: "You are not allowed to delete an item on someone else's portfolio" };
      }
    } else {
      return { message: `Could not find the item you're trying to delete on your portfolio` };
    }
  }

  async updateUserLastVisitedIfNotUpdatedToday(staffId: number) {
    await updateUserLastVisitedIfNotUpdatedToday(this.db, staffId);
  }

  async updateSkillsLastModifiedForUser(tx: SqlTransaction, staffId: number) {
    await updateSkillsLastModifiedForUser(tx, staffId);
  }

  async addAttributeAsCoreTechForUser(
    userAttribute: UserAttribute,
    addedBy: Staff["staffId"],
  ): Promise<UserAttribute | BadRequestDetail> {
    const existingAttribute = await isAttributeAlreadyAddedForUser(
      this.gremlin,
      userAttribute.attribute.standardizedName,
      userAttribute.staffId,
    );
    if (existingAttribute) {
      const alreadyAdded = await isAttributeAlreadyAddedAsCoreTech(this.gremlin, userAttribute);
      if (alreadyAdded) {
        return {
          message: `${userAttribute.attribute.canonicalName} has already been added as core tech for this staff`,
        };
      } else {
        const coreAttributesCount = await getCoreTechCountForUser(this.gremlin, userAttribute.staffId);
        if (coreAttributesCount >= MAXIMUM_CORE_ATTRIBUTES_FOR_USER) {
          return { message: "Staff has reached the maximum allowed for core techs" };
        } else if (!this.isAttributeAllowedAsCoreTech(userAttribute)) {
          return {
            message: `${userAttribute.attribute.attributeType} cannot be added as a core tech. Please add one of : ${ALLOWED_CORE_ATTRIBUTE_TYPES}`,
          };
        } else {
          return await addAttributeAsCoreTechForUser(this.gremlin, userAttribute, addedBy);
        }
      }
    } else {
      return {
        message: `Staff has removed ${userAttribute.attribute.canonicalName} from their profile, please reload`,
      };
    }
  }

  async removeCoreTechInformationFromAttribute(
    userAttribute: UserAttribute,
  ): Promise<UserAttribute | BadRequestDetail> {
    const existingAttribute = await isAttributeAlreadyAddedForUser(
      this.gremlin,
      userAttribute.attribute.standardizedName,
      userAttribute.staffId,
    );
    if (existingAttribute) {
      const alreadyAdded = await isAttributeAlreadyAddedAsCoreTech(this.gremlin, userAttribute);
      if (!alreadyAdded) {
        return { message: `${userAttribute.attribute.canonicalName} does not exist as core tech for this staff` };
      } else {
        return await removeCoreTechInformationFromAttribute(this.gremlin, userAttribute);
      }
    } else {
      return {
        message: `Staff has removed ${userAttribute.attribute.canonicalName} from their profile, please reload`,
      };
    }
  }

  isAttributeAllowedAsCoreTech(userAttribute: UserAttribute): boolean {
    return userAttribute.attribute.skillPath.some((skillPath) =>
      ALLOWED_CORE_ATTRIBUTE_TYPES.includes(skillPath.standardizedName),
    );
  }

  async replaceStaffCoreTech(
    userAttributes: UserAttribute[],
    addedBy: Staff["staffId"],
  ): Promise<UserAttribute[] | BadRequestDetail> {
    if (userAttributes.length > MAXIMUM_CORE_ATTRIBUTES_FOR_USER) {
      return { message: `You cannot add more than ${MAXIMUM_CORE_ATTRIBUTES_FOR_USER} core skills for staff` };
    } else {
      const invalidAttributeTypes = userAttributes
        .filter((userAttribute) => !this.isAttributeAllowedAsCoreTech(userAttribute))
        .map((userAttribute) => userAttribute.attribute.attributeType);

      if (invalidAttributeTypes.length !== 0) {
        return {
          message: `${invalidAttributeTypes} cannot be added as a core skills. Please add one of: ${ALLOWED_CORE_ATTRIBUTE_TYPES}`,
        };
      } else if (userAttributes.length === 0) {
        await removeAllCoreTechForUser(this.gremlin, addedBy);
        return [];
      } else {
        await removeAllCoreTechForUser(this.gremlin, addedBy);
        return await addAttributesAsCoreTechForUser(this.gremlin, userAttributes, addedBy);
      }
    }
  }

  isCoreTech(userAttribute): boolean {
    const requiredCoreTechFields = ["coreTechAddedBy", "coreTechAddedOn"];

    return requiredCoreTechFields.every((requiredCoreTechField) =>
      userAttribute.attributesDetails.some(
        (attributesDetail) => attributesDetail.standardizedName === requiredCoreTechField,
      ),
    );
  }

  async retrieveStaffCoreTech(staffId: number): Promise<UserAttribute[]> {
    const rawGremlinUserAttributes = await getUserAttributes(this.gremlin, staffId);

    const coreTechUserAttributes = rawGremlinUserAttributes.filter((userAttribute) => this.isCoreTech(userAttribute));

    return await this.mapGremlinToUserAttributes(coreTechUserAttributes, staffId);
  }

  retrieveOnSupplyRoles(): Promise<OnSupplyRole[]> {
    return retrieveOnSupplyRoles(this.db);
  }

  async updateStaffOnSupplyRole(
    staffUpn: string,
    staffOnSupplyRole: OnSupplyRole,
    addedBy: string,
  ): Promise<boolean | BadRequestDetail> {
    const onSupplyRoles: OnSupplyRole[] = await this.retrieveOnSupplyRoles();
    const staffRecord = await this.retrieveStaffOnSupplyByUpn(staffUpn);
    const onSupplyRole = onSupplyRoles.find(
      (onSupplyRole) => onSupplyRole.onSupplyRoleId === staffOnSupplyRole.onSupplyRoleId,
    );
    if (!onSupplyRole) {
      return {
        message: `The role with ID '${staffOnSupplyRole.onSupplyRoleId}' does not exist.`,
      };
    } else if (!staffRecord) {
      return {
        message: `No staff member found with UPN '${staffUpn}'.`,
      };
    } else if (staffRecord.role && staffRecord.role.toLowerCase() === onSupplyRole.role.toLowerCase()) {
      return {
        message: `Staff member '${staffUpn}' already has the role '${staffRecord.role}'.`,
      };
    } else {
      return await createStaffOnSupplyRole(this.db, staffRecord.staffId, onSupplyRole.onSupplyRoleId, addedBy);
    }
  }

  async retrieveStaffWithAttributeObtainedFromInstitution(attribute: Attribute, institutionStandardizedName: StandardizedName): Promise<UserAttributeWithStaffDetails[]> {
    const staffWithAttributeObtainedFromInstitution = await retrieveStaffWithAttributeObtainedFromInstitution(this.gremlin, attribute.standardizedName, institutionStandardizedName);
    return await this.mapStaffToUserAttributeWithStaffDetails(attribute, staffWithAttributeObtainedFromInstitution);
  }

  async retrievePendingProofValidations(): Promise<PendingProofValidation[]>{
    return getPendingProofValidations(this.gremlin);
  }

  async retrieveStaffDetailsForPendingProofValidation(staffIds: number[]): Promise<DecoratedStaff[]>{
    return getAllStaffDetailsByStaffIds(this.db, staffIds, true)
  }

  async updateUserProofValidation (edgeId: string, propertyValue: string): Promise<boolean | BadRequestDetail>{
    return updateQualificationEdgeProperty(this.gremlin, edgeId, propertyValue);
  }

  async rejectUploadedProofFile(edgeId: string, validatingUser: string, proofPropertyValue: string):Promise<boolean | BadRequestDetail> {
    return updateEdgePropertyForProofRejection(this.gremlin, edgeId, validatingUser, proofPropertyValue)
  }


}
