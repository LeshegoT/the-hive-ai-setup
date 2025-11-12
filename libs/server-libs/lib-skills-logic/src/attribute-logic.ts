import { SqlRequest, SqlTransaction } from "@the-hive/lib-db";
import { BadRequestDetail, Pagination, isError } from "@the-hive/lib-shared";
import {
  Attribute,
  EntityCount,
  FieldValue,
  NewAttribute,
  SkillsEntity,
  StandardizedName,
  Tag,
  AttributeType,
  UserAttribute,
  AttributeSearchResult,
  AttributeTotals,
  AttributeWithInstitution,
  SearchTextException,
  AttributeForSearchTextException,
  TopLevelTag,
  AttributeCanonicalNameDetailsWithInstitution,
  AttributeCanonicalNameDetailsWithInstitutionItem,
  RatificationCanonicalNameDetails
} from "@the-hive/lib-skills-shared";
import gremlin from "gremlin";
import {
  addAttributeOutgoingEdgeIfNotExists,
  AttributeOutgoingEdgeDetails,
  CanonicalGuidAndName,
  deleteAttributeOrInstitutionFromGraph,
  EdgeProperty,
  getAllAttributeTypes,
  getAttributeData,
  getAttributeId,
  getAttributeOutgoingEdges,
  getAttributesOrInstitutionsThatNeedsRatification,
  retrieveAttributeTotals,
  getRequiredFieldDetails,
  getSkillPathForAttribute,
  getTopLevelTag,
  getUnratifiedTotals,
  isStandardizedNameAnAttribute,
  retrieveAllTopLevelTags,
  TagWithoutCanonicalNameDetails,
  UserAttributeEdgeDetails,
  addAttributeToGraph,
  retrieveUnratifiedSkills,
  retrieveStandardizedNamesOfUnratifiedOfferedAttributes,
  retrieveUnratifiedOfferedAttributesCount,
  retrieveUnratifiedAvailableAtTotal,
  retrieveUnratifiedSkillsCount,
} from "./queries/attribute.queries";
import {
  addCanonicalName,
  addNewCanonicalNameAndAliases,
  deleteAttributeOrInstitutionWithAliasesAndExceptions,
  deleteCanonicalNameByStandardizedName,
  getAliases,
  getCanonicalNameDetails,
  retrieveAttributeSearchResults,
  getStandardizedNameByCanonicalNameIfExists,
  replaceAliasesOfAStandardizedName,
  retrieveCanonicalNames,
  standardizeName,
  updateAliasCanonicalNameReference,
  updateCanonicalName,
  updateCanonicalNameGuidByStandardizedName,
  addAliasIfNotExists,
  searchByTopLevelTag,
} from "./queries/canonical-name.queries";
import {
  addUserAttributeIfNotAddedOrIfRepeatable,
  getAllUsersForAttribute,
  getEntityCountByStaffIds,
  getStaffIdsByCompanyEntityFilter,
  getUsersConnectedToAttribute,
} from "./queries/users.queries";
import {
  addEdge,
  addVertex,
  doesStandardizedNameExistInGraph,
  findStandardizedNamesInGraph,
  removeEdge,
  removeVertex,
} from "./queries/vertex.queries";
import { InstitutionDatabase } from "./queries/institutions.queries";
import { addRejectedCanonicalName, checkIfCanonicalNameWasPreviouslyRejected } from "./queries/shared-queries";


export class AttributeLogic {
  db: () => Promise<SqlRequest>;
  gremlin: gremlin.driver.Client;
  institutionDB: InstitutionDatabase;

  constructor(db: () => Promise<SqlRequest>, gremlin: gremlin.driver.Client) {
    this.db = db;
    this.gremlin = gremlin;
    this.institutionDB = new InstitutionDatabase(db, gremlin);
  }

  async getRatificationTotals() {
    const unRatifiedTotals = await getUnratifiedTotals(this.gremlin);
    const unRatifiedAvailableAtTotal = await retrieveUnratifiedAvailableAtTotal(this.gremlin);
    return [...unRatifiedTotals, ...unRatifiedAvailableAtTotal];
  }

  private async getStandardizedNamesFilterForSearch(searchText?: string): Promise<StandardizedName[]> {
    if (!searchText || searchText.trim().length === 0) {
      return undefined;
    } else {
      const topLevelTags = await retrieveAllTopLevelTags(this.db);
      const resultsGroupedByType = await Promise.all(
        topLevelTags.map((topLevelTag) => searchByTopLevelTag(this.db, searchText, topLevelTag.standardizedName))
      );
      const uniqueStandardizedNames = Array.from(
        new Set(resultsGroupedByType.flat().map(result => result.standardizedName))
      );
      return uniqueStandardizedNames;
    }
  }

  async retrieveUnratifiedSkills(topLevelTag: StandardizedName, pagination: Pagination, searchText: string | undefined): Promise<RatificationCanonicalNameDetails> {
    if(searchText){
      const topLevelTagSearchResults = await searchByTopLevelTag(
        this.db,
        searchText,
        topLevelTag
      );
      const unratifiedSkills = await retrieveUnratifiedSkills(this.gremlin, topLevelTag, pagination, topLevelTagSearchResults.map(searchResult => searchResult.standardizedName));
      const unratifiedSkillsCount = await retrieveUnratifiedSkillsCount(this.gremlin, topLevelTag, topLevelTagSearchResults.map(searchResult => searchResult.standardizedName));
      
      const filteredResults = topLevelTagSearchResults.filter(searchResult => 
        unratifiedSkills.includes(searchResult.standardizedName)
      );
      
      return {
        canonicalNameDetails: filteredResults,
        ratificationCount: unratifiedSkillsCount
      };
    } else {
      const unratifiedSkills = await retrieveUnratifiedSkills(this.gremlin, topLevelTag, pagination);
      const unratifiedSkillsCount = await retrieveUnratifiedSkillsCount(this.gremlin, topLevelTag);
      const results = await Promise.all(
        unratifiedSkills.map(
          async (standardizedName) => {
            const canonicalNameDetails = await getCanonicalNameDetails(this.db, standardizedName);
            if(!canonicalNameDetails){
              return {
                message: `Could not find canonical name details for ${standardizedName}`,
                detail: standardizedName
              };
            } else{
              return canonicalNameDetails;
            }
          }
        )
      );
      
      return {
        canonicalNameDetails: results,
        ratificationCount: unratifiedSkillsCount
      };
    }
  }

  async retrieveAttributeTotals(companyEntityIds: string): Promise<AttributeTotals> {
    const staffIds = await getStaffIdsByCompanyEntityFilter(this.db, companyEntityIds);
    return await retrieveAttributeTotals(this.gremlin, staffIds);
  }

  async addCanonicalNameAndAliases(
    canonicalName: string,
    canonicalNameCategory: string,
    standardizedName: string,
    aliases: string[],
  ): Promise<void> {
    await addNewCanonicalNameAndAliases(this.db, canonicalName, canonicalNameCategory, standardizedName, aliases);
  }

  async findStandardizedNamesInTheGraph(standardizedName: string[]): Promise<string[]> {
    return await findStandardizedNamesInGraph(this.gremlin, standardizedName);
  }

  async retrieveCanonicalNamesForSkillPath(tag: TagWithoutCanonicalNameDetails): Promise<Tag> {
    const canonicalNameDetails = await getCanonicalNameDetails(this.db, tag.standardizedName);
    const aliases = canonicalNameDetails ? await getAliases(this.db, canonicalNameDetails.canonicalNameId) : [];
    return {
      ...tag,
      canonicalName: canonicalNameDetails.canonicalName,
      canonicalNameId: canonicalNameDetails.canonicalNameId,
      aliases,
    };
  }

  async getSkillPathDetails(attributeId: string) : Promise<Tag[]> {
    const skillPathForAttribute = await getSkillPathForAttribute(this.gremlin, attributeId, "is-a");
    return Promise.all(skillPathForAttribute.map(async (skill) => this.retrieveCanonicalNamesForSkillPath(skill)));
  }

  async getRelatedTagsForAttribute(attributeId: string): Promise<Tag[]> {
    const relatedTags = await getSkillPathForAttribute(this.gremlin, attributeId, "is-related-to");
    return Promise.all(relatedTags.map(async (skill) => this.retrieveCanonicalNamesForSkillPath(skill)));
  }

  async getSkillPathWithRelatedTags(attributeId: string) :Promise<Tag[]> {
    const skillPathForAttribute = await this.getSkillPathDetails(attributeId);
    return Promise.all(
      skillPathForAttribute.map(async (skill) => {
        let relatedTags = [];
        if (!skill.isTopLevel) {
          relatedTags = (await this.getRelatedTagsForAttribute(skill.canonicalNameGuid)).filter(
            (tag) => tag.standardizedName !== skill.standardizedName,
          );
        } else {
          //The element is for a top level tags which should not have a skill path
        }
        return { ...skill, relatedTags };
      }),
    );
  }

  async checkifAttributeTypeMatchesWithTopLevelTag(attribute: Attribute): Promise<Attribute | BadRequestDetail> {
    const gremlinAttributeType = await getTopLevelTag(attribute.canonicalNameGuid, this.gremlin);
    if (gremlinAttributeType != attribute.attributeType) {
      return {
        message: `Failed to verify attribute type`,
        detail: `The given attributeType - ${attribute.attributeType} does not match the actual attributeType of the given attribute - ${attribute.canonicalName}:${gremlinAttributeType}`,
      };
    } else {
      return attribute;
    }
  }

  async retrieveTopLevelTagsStandardizedAndCanonicalNames(): Promise<TopLevelTag[]> {
    return await retrieveAllTopLevelTags(this.db);
  }

  async getAttributeSearchResults(
    searchText: string,
    pagination: Pagination,
    attributeTypesToIncludeInResults: AttributeType[],
    ratified: boolean,
  ): Promise<Partial<AttributeSearchResult>[] | BadRequestDetail> {
    const allAttributeTypes = await getAllAttributeTypes(this.gremlin);

    const hasInvalidAttributeTypeFilter =
      attributeTypesToIncludeInResults &&
      attributeTypesToIncludeInResults.some((attributeType) => !allAttributeTypes.includes(attributeType));

    if (hasInvalidAttributeTypeFilter) {
      return {
        message: `Invalid attribute types.Please filter by one of the following types : ${allAttributeTypes.join(",")}`,
      };
    } else {
      const attributeTypes = attributeTypesToIncludeInResults || allAttributeTypes;
      let attributesThatNeedsRatification: StandardizedName[] | undefined;
      if (ratified != undefined) {
        attributesThatNeedsRatification = await getAttributesOrInstitutionsThatNeedsRatification(this.gremlin);
      } else {
        /* the attributesThatNeedsRatification variable will stay undefined, we don't need to filter
           by ratified since it wasn't specified as either true or false */
      }

      const attributeSearchResults = await retrieveAttributeSearchResults(
        this.db,
        searchText,
        pagination,
        attributeTypes,
        ratified,
        attributesThatNeedsRatification,
      );

      return Promise.all(
        attributeSearchResults.map(async (attributeSearchResult) => {
          const [canonicalnameGuid] = await getAttributeId(this.gremlin, attributeSearchResult.standardizedName);
          if (canonicalnameGuid){
            return {
              attributeType: attributeSearchResult.canonicalNameCategory,
              canonicalNameGuid: canonicalnameGuid,
              canonicalName: attributeSearchResult.canonicalName,
              canonicalNameId: attributeSearchResult.canonicalNameId,
              standardizedName: attributeSearchResult.standardizedName,
              skillPath: await this.getSkillPathDetails(canonicalnameGuid)
            };
          } else {
            return undefined;
          }
      }),
      ).then(results => results.filter(result => result));
    }
  }

  async getAttributeForStandardizedName(standardizedName: string): Promise<Attribute> {
    const [attributeFromGraph] = await getAttributeData(this.gremlin, [standardizedName]);

    const canonicalNameDetails = await getCanonicalNameDetails(this.db, standardizedName);
    const aliases = await getAliases(this.db, canonicalNameDetails.canonicalNameId);
    const requiredFieldsValues = attributeFromGraph.requiredFields.map(
      (requiredField) => requiredField.standardizedName,
    );
    const requiredFieldsDetails = await getRequiredFieldDetails(this.db, requiredFieldsValues);

    return {
      standardizedName: standardizedName,
      canonicalName: canonicalNameDetails.canonicalName,
      canonicalNameId: canonicalNameDetails.canonicalNameId,
      canonicalNameGuid: attributeFromGraph.canonicalNameGuid,
      canonicalNameCategoryId: canonicalNameDetails.canonicalNameCategoryId,
      aliases,
      needsRatification: attributeFromGraph.needsRatification,
      requiredFields: requiredFieldsDetails,
      attributeType: attributeFromGraph.attributeType,
      metaDataTags : attributeFromGraph.metaDataTags,
      skillPath: await this.getSkillPathWithRelatedTags(attributeFromGraph.canonicalNameGuid),
    };
  }

    validateAttribute(attributeToAdd: NewAttribute): BadRequestDetail | void {
    if (!attributeToAdd) {
      return { message: "Attribute is required" };
    } else if (!attributeToAdd.canonicalName) {
      return { message: "Canonical name is required" };
    } else if (!attributeToAdd.attributeType) {
      return { message: "Attribute type is required" };
    } else if (!attributeToAdd.requiredFields || attributeToAdd.requiredFields.length === 0) {
      return { message: "Required fields are required" };
    } else {
     // Attribute is valid and the function will return void as there is no error message
    }
  }

  async retrieveAttributesWithInstitutionsWithUnratifiedAvailableAt(
    pagination: Pagination,
    searchText?: string
  ): Promise<AttributeCanonicalNameDetailsWithInstitution> {
    
    const standardizedNamesFilter = await this.getStandardizedNamesFilterForSearch(searchText);
    if (standardizedNamesFilter !== undefined && standardizedNamesFilter.length === 0) {
      return { canonicalNameDetails: [], ratificationCount: 0 };
    } else {
      // no search was provided or we have matches, proceed below.
    }

    const unratifiedAttributesWithInstitutions = await retrieveStandardizedNamesOfUnratifiedOfferedAttributes(
      this.gremlin,
      pagination,
      standardizedNamesFilter
    );
    const totalCount = await retrieveUnratifiedOfferedAttributesCount(
      this.gremlin,
      standardizedNamesFilter
    );

    const canonicalNameDetailsList: (BadRequestDetail | AttributeCanonicalNameDetailsWithInstitutionItem)[] = await Promise.all(
      unratifiedAttributesWithInstitutions.map(async (attributeWithInstitution) => {
        const attributeCanonicalNameDetails = await getCanonicalNameDetails(this.db, attributeWithInstitution.attributeStandardizedName);
        if(!attributeCanonicalNameDetails){ 
          return { 
            message: `Could not find canonical name details for attribute: ${attributeWithInstitution.attributeStandardizedName}`,
            detail: attributeWithInstitution.attributeStandardizedName 
          };
        } else{
          const availableAtInstitutions = await Promise.all(
            attributeWithInstitution.institutionStandardizedNames.map(async (institutionStandardizedName) => {
              const institutionDetails = await getCanonicalNameDetails(this.db, institutionStandardizedName);
              if(!institutionDetails){ 
                return { 
                  message: `Could not find canonical name details for institution: ${institutionStandardizedName}`,
                  detail: institutionStandardizedName
                };
              } else{
                return {
                  canonicalName: institutionDetails.canonicalName,
                  standardizedName: institutionDetails.standardizedName,
                  canonicalNameGuid: institutionDetails.canonicalNameGuid,
                  needsRatification: true
                };
              }
            })
          );
          return {
            ...attributeCanonicalNameDetails,
            availableAt: availableAtInstitutions
          };
        }
      })
    );

    return { canonicalNameDetails: canonicalNameDetailsList, ratificationCount: totalCount };
  }

 async addAttributeToCanonicalNamesIfNotExist(
    tx: SqlTransaction,
    attributeToAdd: NewAttribute,
  ): Promise<(NewAttribute & Omit<SkillsEntity, "canonicalNameGuid">)> {
    const standardizedName = await standardizeName(this.db, attributeToAdd.canonicalName);
    const attributeAddedToCanonicalNames = await addCanonicalName(
      this.db,
      attributeToAdd.canonicalName,
      standardizedName,
      attributeToAdd.attributeType,
    );
    return {
      ...attributeToAdd,
      standardizedName: standardizedName,
      canonicalNameId: attributeAddedToCanonicalNames.canonicalNameId,
    };
  }

  async updateAttributeCanonicalName(
    tx: SqlTransaction,
    attributeToChange: Attribute,
    newCanonicalName: string,
  ): Promise<void> {
    const existingStandardizedName = await getStandardizedNameByCanonicalNameIfExists(tx, newCanonicalName);

    if (existingStandardizedName) {
      await updateAliasCanonicalNameReference(tx, attributeToChange.standardizedName, existingStandardizedName);

      await deleteCanonicalNameByStandardizedName(tx, attributeToChange.standardizedName);
    } else {
      await updateCanonicalName(tx, attributeToChange.canonicalNameId, newCanonicalName);
    }
  }

  async addNewAttribute(
    tx: SqlTransaction,
    attributeToAdd: NewAttribute,
  ): Promise<Partial<Attribute> | BadRequestDetail> {
    let newAttributeWithGraphDetails: CanonicalGuidAndName | BadRequestDetail;
    let newAttributeWithCanonicalDetails: (NewAttribute & Omit<SkillsEntity, "canonicalNameGuid">) | BadRequestDetail;
    try {
      const allAttributeTypes = await getAllAttributeTypes(this.gremlin);
      const previouslyRejected = await this.checkIfCanonicalNameWasPreviouslyRejected(attributeToAdd.canonicalName, attributeToAdd.attributeType);
      if (previouslyRejected) {
        return {
          message: `${attributeToAdd.canonicalName} has been previously rejected and cannot be added`
        };
      } else if (!allAttributeTypes.includes(attributeToAdd.attributeType)) {
        return {
          message: `Invalid attribute type. Please choose one of the following types: ${allAttributeTypes.join(", ")}`,
        };
      } else {
        const attributeIfExists = await retrieveCanonicalNames(this.db, attributeToAdd.canonicalName);
        if (attributeIfExists && attributeIfExists[0]) {
          if (attributeIfExists[0].canonicalNameCategory !== attributeToAdd.attributeType) {
            return {
              message: `${attributeToAdd.canonicalName} is a ${attributeIfExists[0].canonicalNameCategory} and cannot be added again as a ${attributeToAdd.attributeType}. Please add it as ${attributeIfExists[0].canonicalNameCategory} or choose a different name`,
            };
          } else {
            return await this.getAttributeForStandardizedName(attributeIfExists[0].standardizedName);
          }
        } else {
          newAttributeWithCanonicalDetails = await this.addAttributeToCanonicalNamesIfNotExist(tx, attributeToAdd);
          const newAttributeFromGraph = await addAttributeToGraph(this.gremlin, newAttributeWithCanonicalDetails);
          await updateCanonicalNameGuidByStandardizedName(tx, newAttributeFromGraph );
          return await this.getAttributeForStandardizedName(newAttributeWithCanonicalDetails.standardizedName);
        }
      }
    } catch (error) {
      try {
        if (!newAttributeWithCanonicalDetails || isError(newAttributeWithCanonicalDetails)) {
          //attribute was not added to canonical names, no need to remove it
        } else {
          await deleteAttributeOrInstitutionWithAliasesAndExceptions(tx, newAttributeWithCanonicalDetails);
        }

        if (!newAttributeWithGraphDetails || isError(newAttributeWithGraphDetails)) {
          // attribute was not added to graph, no need to remove it
        } else {
          await deleteAttributeOrInstitutionFromGraph(this.gremlin, newAttributeWithGraphDetails.standardizedName);
        }
      } catch (rollBackError) { // eslint-disable-line @typescript-eslint/no-unused-vars
        return {
          message: "Rollback failed after encountering a server error"
        };
      }
      return { message: "Internal server error ", detail: error.message };
    }
  }

  async isAttribute(standardizedName: string): Promise<boolean> {
    return isStandardizedNameAnAttribute(this.gremlin, standardizedName);
  }

  async getAttributeSummary(standardizedName: string, officeIds: number[]): Promise< (Attribute & EntityCount)> {
    const attribute = await this.getAttributeForStandardizedName(standardizedName);
    const staffIds = await getAllUsersForAttribute(this.gremlin, attribute.standardizedName);
    const entityCounts = await getEntityCountByStaffIds(this.db, staffIds, officeIds);

    return {
      ...attribute,
      ...entityCounts,
    };
  }

  async updateAttributeVertexName(
    attributeToRename: Attribute,
    newVertexName: StandardizedName,
  ): Promise<StandardizedName | BadRequestDetail> {
    const usersConnectedDetails: UserAttributeEdgeDetails[] = await getUsersConnectedToAttribute(
      this.gremlin,
      attributeToRename,
    );
    const outgoingEdges = await getAttributeOutgoingEdges(this.gremlin, attributeToRename);

    const exists = await doesStandardizedNameExistInGraph(this.gremlin, newVertexName);

    let attributeToMoveTo: Attribute | BadRequestDetail;

    if (!exists) {
      const newVertexId = await addVertex(this.gremlin, "attribute", newVertexName);

      attributeToMoveTo = {
        ...attributeToRename,
        standardizedName: newVertexName,
        canonicalNameGuid: newVertexId,
      };
    } else {
      attributeToMoveTo = await this.getAttributeForStandardizedName(newVertexName);

      if (isError(attributeToMoveTo)) {
        return attributeToMoveTo;
      } else if (attributeToMoveTo.attributeType != attributeToRename.attributeType) {
        return {
          message: "Failed to rename attribute.",
          detail: `Attribute with name ${newVertexName} already exists as type ${attributeToMoveTo.attributeType}.`,
        };
      } else {
        // No error while retrieving an existing attribute and the existing attribute is of the same type so the attributes can be merged.
      }
    }

    await this.addOutgoingEdgesToAttribute(outgoingEdges, exists, attributeToMoveTo);

    await this.addUserAttributesToAttribute(usersConnectedDetails, attributeToMoveTo);

    await removeVertex(this.gremlin, attributeToRename.standardizedName);

    return attributeToMoveTo.standardizedName;
  }

  async addOutgoingEdgesToAttribute(
    outgoingEdges: AttributeOutgoingEdgeDetails[],
    addingToExistingAttribute: boolean,
    attributeToAddTo: Attribute,
  ): Promise<void> {
    for (const edge of outgoingEdges) {
      const properties: EdgeProperty[] = Object.entries(edge.properties).map(([key, value]) => {
        return { [key]: value };
      });
      if (addingToExistingAttribute && edge.edgeName === "is-a") {
        // An attribute can only have one is-a edge so skip re-creating the edge when merging to an existing attribute.
        // Specifically, this also avoids the situation where attributeToRename points to a new-[topLevelTag] while the existing
        // attribute points to the [topLevelTag]. Ensures it does not create an is-a edge from the existing attribute to new-[topLevelTag].
      } else {
        await addAttributeOutgoingEdgeIfNotExists(
          this.gremlin,
          attributeToAddTo.standardizedName,
          edge.targetCanonicalNameGuid,
          edge.edgeName,
          properties,
        );
      }
    }
  }

  async addUserAttributesToAttribute(
    usersConnectedDetails: UserAttributeEdgeDetails[],
    attributeToAddTo: Attribute,
  ): Promise<void> {
    for (const userConnectedDetail of usersConnectedDetails) {
      const userAttributeToAdd: Omit<UserAttribute, "guid"> = {
        staffId: userConnectedDetail.staffId,
        attribute: attributeToAddTo,
        fieldValues: userConnectedDetail.fieldValues as FieldValue[],
      };

      await addUserAttributeIfNotAddedOrIfRepeatable(this.gremlin, userAttributeToAdd,userConnectedDetail.staffId);
    }
  }

  async deleteAttribute(
    tx: SqlTransaction,
    attribute: Attribute,
  ): Promise<BadRequestDetail | Attribute> {
    if (!isError(attribute)) {
      await deleteAttributeOrInstitutionFromGraph(this.gremlin, attribute.standardizedName);
      await deleteAttributeOrInstitutionWithAliasesAndExceptions(tx, attribute);
      return attribute;
    } else {
      return attribute;
    }
  }

  async rejectAttribute(
    tx: SqlTransaction,
    standardizedName: StandardizedName,
    rejectedBy: string
  ): Promise<Attribute | BadRequestDetail> {
    const attribute = await this.getAttributeForStandardizedName(standardizedName);
    await addRejectedCanonicalName(tx, attribute, rejectedBy);
    return await this.deleteAttribute(tx, attribute);
  }

  private async connectAttributeToTopLevelTag(attribute: Attribute): Promise<void> {
    await removeEdge(this.gremlin, 'attribute', attribute.standardizedName, 'new', `new-${attribute.attributeType}`);
    await addEdge(this.gremlin, 'attribute', attribute.standardizedName, 'topLevelTag', attribute.attributeType, 'is-a');
  }

  private async markNeedsRatificationAsFalseForAttributeAvailableAtInstitutions(attribute: AttributeWithInstitution): Promise<void> {
    const institutionStandardizedNames = attribute.availableAt.map(institution => institution.standardizedName);
    await this.institutionDB.markNeedsRatificationAsFalseForAttributeAvailableAtInstitution(
      attribute.standardizedName,
      institutionStandardizedNames
    );
  }

  async mergeAttributes(
    tx: SqlTransaction,
    attributeToMerge: Attribute,
    attributeToKeep: Attribute,
  ): Promise<Attribute | BadRequestDetail> {
    if (attributeToMerge.attributeType !== attributeToKeep.attributeType) {
      return {
        message: `Cannot merge attributes of different attribute types.`,
        detail: `${attributeToMerge.canonicalName} is of type ${attributeToMerge.attributeType} and ${attributeToKeep.canonicalName} is of type ${attributeToKeep.attributeType}.`,
      };
    } else {
      const outgoingEdges = await getAttributeOutgoingEdges(this.gremlin, attributeToMerge);
      const usersConnectedDetails: UserAttributeEdgeDetails[] = await getUsersConnectedToAttribute(
        this.gremlin,
        attributeToMerge,
      );

      await this.addOutgoingEdgesToAttribute(outgoingEdges, true, attributeToKeep);
      await this.addUserAttributesToAttribute(usersConnectedDetails, attributeToKeep);
      await this.deleteAttribute(tx, attributeToMerge);
      await updateCanonicalNameGuidByStandardizedName(tx, {standardizedName: attributeToKeep.standardizedName, canonicalNameGuid: attributeToKeep.canonicalNameGuid});
      await addAliasIfNotExists(tx, attributeToKeep.canonicalNameId, { alias : attributeToMerge.canonicalName })
      return await this.getAttributeForStandardizedName(attributeToKeep.standardizedName);
    }
  }

  validateAttributeUpdate(
    updatedAttribute: Attribute | AttributeWithInstitution,
    existingAttribute: Attribute | AttributeWithInstitution
  ): BadRequestDetail | void {
    if (updatedAttribute.standardizedName !== existingAttribute.standardizedName) {
      return {
        message: "Cannot update attribute: The standardized names do not match the existing attribute"
      };
    } else if (updatedAttribute.attributeType !== existingAttribute.attributeType) {
      return {
        message: "Cannot update attribute: The attribute type cannot be changed"
      };
    } else if (updatedAttribute.canonicalNameGuid !== existingAttribute.canonicalNameGuid) {
      return {
        message: "Cannot update attribute: The canonical name GUID does not match the existing attribute"
      };
    } else if (updatedAttribute.canonicalNameId !== existingAttribute.canonicalNameId) {
      return {
        message: "Cannot update attribute: The canonical name ID does not match the existing attribute"
      };
    } else {
      //attribute update is valid so update can proceed
    }
  }

  async updateAttribute(
    tx: SqlTransaction,
    standardizedName: StandardizedName,
    updatedAttribute: Attribute | AttributeWithInstitution
  ): Promise<BadRequestDetail | Attribute | AttributeWithInstitution> {
    try {
      const existingAttribute = await this.getAttributeForStandardizedName(standardizedName);
      const existingStandardizedNameForCanonicalName = await getStandardizedNameByCanonicalNameIfExists(tx, updatedAttribute.canonicalName);
      const validationErrors = this.validateAttributeUpdate(updatedAttribute, existingAttribute);

      if(validationErrors){
        return validationErrors
      } else {
        await replaceAliasesOfAStandardizedName(tx, updatedAttribute.aliases, standardizedName);
        if(existingStandardizedNameForCanonicalName && existingStandardizedNameForCanonicalName !== standardizedName){
          return {
            message: `The canonical name ${updatedAttribute.canonicalName} already exists`,
          }
        } else {
          await updateCanonicalName(tx, updatedAttribute.canonicalNameId, updatedAttribute.canonicalName);
        }

        if (!updatedAttribute.needsRatification && existingAttribute.needsRatification) {
          await this.connectAttributeToTopLevelTag(updatedAttribute);
        } else {
          // we don't want to connect the attribute to the top level tag if we are not ratifying it
          // so it should remain connected to a "new" vertex
        }

        if ('availableAt' in updatedAttribute && updatedAttribute.availableAt.length > 0) {
          await this.markNeedsRatificationAsFalseForAttributeAvailableAtInstitutions(updatedAttribute);
        } else{
          // No institutions provided to ratify - skipping ratification
        }

        return updatedAttribute;
      }
    } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      return {
        message: `${standardizedName} is not an existing attribute`
      }
    }
  }

  async handleAttributeMerge(
    tx: SqlTransaction,
    attributeStandardizedNameToMerge: StandardizedName,
    attributeStandardizedNameToKeep: StandardizedName,
  ): Promise<BadRequestDetail | Attribute> {
    if (!(attributeStandardizedNameToKeep && attributeStandardizedNameToKeep !== attributeStandardizedNameToMerge)) {
      return {
        message: `You cannot merge into the same attribute`,
      }
    } else {
      const attributeToBeMerged = await this.getAttributeForStandardizedName(attributeStandardizedNameToMerge);
      const attributeToMergeInto = await this.getAttributeForStandardizedName(attributeStandardizedNameToKeep);
      const mergedAttribute = await this.mergeAttributes(tx, attributeToBeMerged, attributeToMergeInto);
      return mergedAttribute;
    }
  }

  async retrieveAttributesForSearchTextExceptions(
    searchTextExceptions: SearchTextException[],
  ): Promise<AttributeForSearchTextException[]> {
    return (
      await Promise.all(
        searchTextExceptions.map(async (searchTextException) => {
          const isExistingAttribute = await this.isAttribute(searchTextException.standardizedName);
          return isExistingAttribute
            ? {...searchTextException, attribute: await this.getAttributeForStandardizedName(searchTextException.standardizedName)}
            : undefined;
        }),
      )
    ).filter((attribute) => attribute);
  }

  async checkIfCanonicalNameWasPreviouslyRejected(canonicalName: string, canonicalNameCategory: string): Promise<boolean> {
    return await checkIfCanonicalNameWasPreviouslyRejected(this.db, canonicalName, canonicalNameCategory);
  }
}
