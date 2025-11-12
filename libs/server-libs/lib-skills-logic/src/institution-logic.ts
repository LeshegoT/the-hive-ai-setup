/**@format */
import { SqlRequest, SqlTransaction } from "@the-hive/lib-db";
import { BadRequestDetail, Pagination, isError } from "@the-hive/lib-shared";
import {
  Alias,
  Attribute,
  Institution,
  InstitutionType,
  isNotInstitutionType,
  StandardizedName,
} from "@the-hive/lib-skills-shared";
import gremlin from "gremlin";
import {
  addAnAlias,
  addCanonicalName,
  deleteAttributeOrInstitutionWithAliasesAndExceptions,
  getAliases,
  getCanonicalDetailsForInstitutionsGivenSearchText,
  getCanonicalNameDetails,
  getStandardizedNameByCanonicalNameIfExists,
  standardizeName,
  updateCanonicalName,
  updateCanonicalNameGuidByStandardizedName,
} from "./queries/canonical-name.queries";
import { InstitutionDatabase } from "./queries/institutions.queries";
import { addEdge, addEdgeWithProperties, doesStandardizedNameExistInGraph, isStandardizedNameAnInstitution, removeEdge, retrieveEdgeWithProperties } from "./queries/vertex.queries";
import { deleteAttributeOrInstitutionFromGraph, deleteEdgeByGuid, getStandardizedNamesForWhatAnInstitutionOffers, isStandardizedNameOfferedByInstitution } from "./queries/attribute.queries";
import { AttributeLogic } from "./attribute-logic";
import { retrieveGuidsOfUserAttributeEdgesFromInstitution } from './queries/users.queries';
import { addRejectedCanonicalName, checkIfCanonicalNameWasPreviouslyRejected } from "./queries/shared-queries";

export class InstitutionLogic {
  institutionDB: InstitutionDatabase;
  attributeLogic: AttributeLogic;
  db: () => Promise<SqlRequest>;
  gremlin: gremlin.driver.Client;

  constructor(db: () => Promise<SqlRequest>, gremlin: gremlin.driver.Client) {
    this.institutionDB = new InstitutionDatabase(db, gremlin);
    this.attributeLogic = new AttributeLogic(db, gremlin);
    this.db = db;
    this.gremlin = gremlin;
  }

  async addOrUpdateInstitution(
    tx: SqlTransaction,
    canonicalName: string,
    standardizedName: string | undefined,
    aliases: Alias[],
    attributesOffered: Attribute[],
  ): Promise<Partial<Institution> | BadRequestDetail> {
    const institution: Partial<Institution> = {
      needsRatification: true,
      institutionType: undefined,
      aliases: [],
      offers: [],
    };

    if (!standardizedName) {
      standardizedName = await standardizeName(this.db, canonicalName);
    } else {
      // check if standardizedName is valid
      const newStandardizedName = await standardizeName(this.db, standardizedName);
      if (newStandardizedName !== standardizedName) {
        return {
          message: "Standardized name is not valid",
          detail: `Standardized name '${standardizedName}' is not in the correct format`,
        };
      } else {
        // standardizedName is valid
      }
    }

    const previouslyRejected = await this.checkIfCanonicalNameWasPreviouslyRejected(canonicalName, 'Institution');
    if (previouslyRejected) {
      return {
        message: `${canonicalName} has been previously rejected and cannot be added`
      };
    } else {
      // Proceed since this institution has not been rejected before
    }

    const standardizedNameExistInGraph = await doesStandardizedNameExistInGraph(this.gremlin, standardizedName);
    if (standardizedNameExistInGraph) {
      const canonicalNameDetails = await getCanonicalNameDetails(this.db, standardizedName);
      const partialInstitutionFromGremlin = await this.institutionDB.retrieveInstitution(this.gremlin, standardizedName);

      institution.standardizedName = standardizedName;
      institution.canonicalName = canonicalNameDetails.canonicalName;
      institution.standardizedName = canonicalNameDetails.standardizedName;
      institution.canonicalNameId = canonicalNameDetails.canonicalNameId;
      institution.canonicalNameGuid =  partialInstitutionFromGremlin.canonicalNameGuid;
    } else {
      // Check sql for if the canonicalName exists
      let canonicalNameDetails = await getCanonicalNameDetails(this.db, standardizedName);
      if (canonicalNameDetails && canonicalNameDetails.canonicalName !== canonicalName) {
        // Update the canonicalName in SQL
        aliases.push({ alias: canonicalNameDetails.canonicalName });
        canonicalNameDetails.canonicalName = await updateCanonicalName(
          tx,
          canonicalNameDetails.canonicalNameId,
          canonicalName,
        );
      } else if (!canonicalNameDetails) {
        // Add the canonicalName to SQL
        canonicalNameDetails = await addCanonicalName(this.db, canonicalName, standardizedName, "Institution");
      } else {
        // canonicalName given by the user matches the one in SQL
      }
      institution.canonicalName = canonicalNameDetails.canonicalName;
      institution.standardizedName = canonicalNameDetails.standardizedName;
      institution.canonicalNameId = canonicalNameDetails.canonicalNameId;
      institution.canonicalNameGuid = await this.institutionDB.addInstitutionToGraph(standardizedName);
    }

    if (aliases && aliases.length > 0) {
      for (const alias of aliases) {
        if (!alias.aliasId) {
          institution.aliases.push(await addAnAlias(tx, institution.canonicalNameId, alias.alias));
        } else {
          // Since there is an aliasId, the alias already exists in SQL
        }
      }
    } else {
      // There are no given aliases to add to the institution
    }

    if(attributesOffered && attributesOffered.length > 0){
      await Promise.all(attributesOffered.map(async(attribute) => {
          return await this.institutionDB.makeAttributeAvailableAtInstitution(institution.canonicalNameGuid, attribute)
      }));
    } else {
      // There are no attributes to make available at the institution
    }

  await updateCanonicalNameGuidByStandardizedName(tx, {
    canonicalNameGuid: institution.canonicalNameGuid,
    standardizedName: institution.standardizedName
  });

    return institution;
  }

  async updateInstitutionTypes(
    institutionTypes: InstitutionType[],
    standardizedName: string,
  ): Promise<boolean | BadRequestDetail> {
    if (institutionTypes.some((type) => isNotInstitutionType(type))) {
      return {
        message: "Institution type is not valid",
        detail: `Institution types contains a type that is not a valid institution type.`,
      } as BadRequestDetail;
    } else {
      // Correct institution types so continue.
    }

    const currentInstitutionTypes: InstitutionType[] = await this.institutionDB.getInstitutionTypes(standardizedName);

    const typesToRemove = currentInstitutionTypes.filter((type) => !institutionTypes.includes(type));
    const typesToAdd = institutionTypes.filter((type) => !currentInstitutionTypes.includes(type));

    for (const type of typesToRemove) {
      await removeEdge(this.gremlin, "tag", standardizedName, "tag", type);
    }
    for (const type of typesToAdd) {
      await addEdge(this.gremlin, "tag", standardizedName, "tag", type, "is-a");
    }

    return true;
  }

  async updateInstitutionType(
    institutionType: InstitutionType,
    institution: Institution,
  ): Promise<void> {
    await removeEdge(this.gremlin, "tag", institution.standardizedName, "tag", institution.institutionType);
    await addEdge(this.gremlin, "tag", institution.standardizedName, "tag", institutionType, "is-a");
  }

  async isAnInstitution(standardizedName: string): Promise<boolean>{
    return isStandardizedNameAnInstitution(this.gremlin, standardizedName);
  }

  async approveInstitution(
    institutionTypes: InstitutionType[],
    standardizedName: string,
  ): Promise<boolean | BadRequestDetail> {
    await removeEdge(this.gremlin, "tag", standardizedName, "new", "new-institution");
    return await this.updateInstitutionTypes(institutionTypes, standardizedName);
  }

  async getInstitutionSearchResults(
    pagination: Pagination,
    ratified: boolean | undefined,
    institutionTypeFilters: InstitutionType[] | undefined,
    excludeOffers: boolean,
    attributeOffered?: StandardizedName,
    searchText?: string,
  ): Promise<Partial<Institution[]>> {
    if (!searchText && !attributeOffered) {
      return [];
    } else {
      let institutions = [];
      let canonicalNameResults = [];

      if (searchText) {
        canonicalNameResults = await getCanonicalDetailsForInstitutionsGivenSearchText(this.db, searchText);
        if (canonicalNameResults.length > 0) {
          const standardizedNames = canonicalNameResults.map(result => result.standardizedName);
          institutions = await this.institutionDB.getInstitutions(
            this.gremlin,
            standardizedNames,
            pagination,
            ratified,
            institutionTypeFilters,
            attributeOffered
          );
        } else {
          return [];
        }
      } else {
        institutions = await this.institutionDB.getInstitutionsThatOfferAttribute(
          this.gremlin,
          attributeOffered,
          ratified,
          institutionTypeFilters
        );
      }

      return Promise.all(
        institutions.map(async (institution) => {
          const canonicalNameDetails = canonicalNameResults.find(canonicalNames => canonicalNames.standardizedName === institution.standardizedName)
            || await getCanonicalNameDetails(this.db, institution.standardizedName);

          const aliases = await getAliases(this.db, canonicalNameDetails.canonicalNameId);
          const offers = excludeOffers ? undefined : await this.retrieveAttributesOfferedByInstitution(institution);

          return {
            ...institution,
            ...canonicalNameDetails,
            aliases,
            ...(!excludeOffers && { offers })
          };
        })
      );
    }
  }

   async retrieveAttributesOfferedByInstitution(institution: Institution): Promise<Attribute[]> {
    const attributesOffered = await getStandardizedNamesForWhatAnInstitutionOffers(
      this.gremlin,
      institution.canonicalNameGuid,
    );

    return await Promise.all(
      attributesOffered.map((attribute) => this.attributeLogic.getAttributeForStandardizedName(attribute)),
    );
  }

  async retrieveInstitution(standardizedName: StandardizedName): Promise<Institution | BadRequestDetail>{
    const partialInstitutionFromGremlin = await this.institutionDB.retrieveInstitution(this.gremlin, standardizedName);
    if(partialInstitutionFromGremlin){
      const canonicalNameDetails = await getCanonicalNameDetails(this.db, standardizedName);
      const attributesOffered = await getStandardizedNamesForWhatAnInstitutionOffers(this.gremlin, partialInstitutionFromGremlin.canonicalNameGuid);

      return {
        ...canonicalNameDetails,
        standardizedName,
        canonicalNameGuid: partialInstitutionFromGremlin.canonicalNameGuid,
        needsRatification: partialInstitutionFromGremlin.needsRatification,
        institutionType: partialInstitutionFromGremlin.institutionType,
        aliases : await getAliases(this.db,canonicalNameDetails.canonicalNameId),
        offers: await Promise.all(
                  attributesOffered.map((attribute) => this.attributeLogic.getAttributeForStandardizedName(attribute))
                ),
      }
    } else{
      return {
        message: `${standardizedName} is not an existing institution`
      };
    }
  }

  async deleteInstitution(
      tx: SqlTransaction,
      institution: Institution,
    ): Promise<BadRequestDetail | Institution> {
      if(institution.offers.length === 0){
        await deleteAttributeOrInstitutionFromGraph(this.gremlin, institution.standardizedName);
        await deleteAttributeOrInstitutionWithAliasesAndExceptions(tx, institution);
        return institution;
      } else{
        return {
          message: `${institution.standardizedName} cannot be deleted as it offers ${institution.offers.map((offer) => offer.canonicalName)}`
        }
      }
    }

  async rejectInstitution(
    tx: SqlTransaction,
    standardizedName: StandardizedName,
    rejectedBy: string
  ): Promise<Institution | BadRequestDetail> {
    const institution = await this.retrieveInstitution(standardizedName);
    if(isError(institution)){
      return institution;
    } else {
      const deletedInstitution = await this.deleteInstitution(tx, institution);
      if(isError(deletedInstitution)){
        return deletedInstitution;
      } else {
        await addRejectedCanonicalName(tx, institution, rejectedBy);
        return deletedInstitution;
      }
    }
  }


  async ratifyInstitution(
    institutionType: InstitutionType,
    institution: Institution,
  ): Promise<void> {
    await removeEdge(this.gremlin, "tag", institution.standardizedName, "new", "new-institution");
    await addEdge(this.gremlin, "tag", institution.standardizedName, "tag", institutionType, "is-a");
  }

  isValidInstitutionUpdate(
    institutionUpdate: Pick<Institution, 'institutionType' | 'needsRatification' | 'canonicalName'>
  ): BadRequestDetail | void {
    if ( institutionUpdate.institutionType === undefined && institutionUpdate.needsRatification === undefined && institutionUpdate.canonicalName === undefined) {
      return {
        message: 'At least one of institutionType, canonicalName or needsRatification must be provided'
      };
    } else if (!Object.keys(institutionUpdate).every(institutionKey => ['institutionType', 'needsRatification', 'canonicalName'].includes(institutionKey)) ) {
      return {
        message: 'Only institutionType, canonicalName and needsRatification can be updated for the given institution'
      };
    } else {
      // All validations passed; return void
    }
  }

  async mergeInstitutions(
    tx: SqlTransaction,
    institutionToMerge: Institution,
    institutionToKeep: Institution,
  ): Promise<Institution | BadRequestDetail> {
    const attributesConnectedToInstitution = await getStandardizedNamesForWhatAnInstitutionOffers(
      this.gremlin,
      institutionToMerge.canonicalNameGuid,
    );

    for (const attribute of attributesConnectedToInstitution) {
      const isAttributeAvailableAtInstitution = await isStandardizedNameOfferedByInstitution(this.gremlin,attribute,institutionToKeep.canonicalNameGuid);
      if (!isAttributeAvailableAtInstitution) {
        await this.transferOfferedAttributesToInstitution(
          institutionToMerge,
          institutionToKeep,
          attribute,
        );
      } else {
        // Attribute is already available at the institution
      }
    }

    for(const attribute of attributesConnectedToInstitution){
      await this.removeOfferedAttributeFromInstitution(institutionToMerge.standardizedName, attribute)
    }

    await this.deleteInstitution(tx, institutionToMerge);
    return await this.retrieveInstitution(institutionToKeep.standardizedName)
  }

  async removeOfferedAttributeFromInstitution(institutionStandardizedName: StandardizedName, attributeStandardizedName: StandardizedName){
    await removeEdge(this.gremlin,"attribute", attributeStandardizedName, "tag", institutionStandardizedName);
    const attachedUserAttributeEdges = await retrieveGuidsOfUserAttributeEdgesFromInstitution(this.gremlin, institutionStandardizedName, attributeStandardizedName);
    for (const userAttributeEdge of attachedUserAttributeEdges) {
      await deleteEdgeByGuid(this.gremlin, userAttributeEdge);
    }
  }

  async transferOfferedAttributesToInstitution(
    institutionToMerge:Institution,
    institutionToKeep: Institution,
    attributesStandardizedName: StandardizedName
  ): Promise<void> {
    const edge = await retrieveEdgeWithProperties(this.gremlin, institutionToMerge.standardizedName, attributesStandardizedName);
    await addEdgeWithProperties(
      this.gremlin,
      institutionToKeep.standardizedName,
      attributesStandardizedName,
      edge
    );
  }

  async updateInstitution(
    tx: SqlTransaction,
    standardizedName: string,
    newInstitution: Pick<Institution,'institutionType'|'needsRatification'|'canonicalName'>,
  ): Promise<Institution | BadRequestDetail> {
    const existingInstitution = await this.retrieveInstitution(standardizedName);
    if(isError(existingInstitution)){
      return existingInstitution
    } else {
      if(newInstitution.canonicalName && newInstitution.canonicalName !== existingInstitution.canonicalName) {
        const existingCanonicalName = await getStandardizedNameByCanonicalNameIfExists(this.db, newInstitution.canonicalName);
        if (existingCanonicalName) {
          const institutionWithExistingCanonicalName = await this.retrieveInstitution(existingCanonicalName);
          if(isError(institutionWithExistingCanonicalName)){
            return institutionWithExistingCanonicalName
          } else {
            return await this.mergeInstitutions(tx,existingInstitution, institutionWithExistingCanonicalName );
          }
        } else {
          await updateCanonicalName(tx, existingInstitution.canonicalNameId, newInstitution.canonicalName);
        }
      } else if( existingInstitution.needsRatification && !newInstitution.needsRatification ) {
        await this.ratifyInstitution(newInstitution.institutionType, existingInstitution)
      } else {
        if (isNotInstitutionType(newInstitution.institutionType)) {
          return {
            message:"Could not update the institution's institution type",
            detail: `The given ${newInstitution.institutionType} institution type is not valid`,
          }
        } else if(newInstitution.institutionType === existingInstitution.institutionType){
          return {
            message:`This institution is already of this institution type :${existingInstitution.institutionType}`
          }
        }else {
          await this.updateInstitutionType(
            newInstitution.institutionType,
            existingInstitution
          );
        }
      }
      return await this.retrieveInstitution(standardizedName);
    }
  }

  async checkIfCanonicalNameWasPreviouslyRejected(canonicalName: string, canonicalNameCategory: string): Promise<boolean> {
    return await checkIfCanonicalNameWasPreviouslyRejected(this.db, canonicalName, canonicalNameCategory);
  }
}
