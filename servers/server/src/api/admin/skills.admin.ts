const router = require("express").Router();
const { handle_errors, uploadRaw, parseIfSetElseDefault, listFolder } = require("@the-hive/lib-core");
const { fetchBlobData } = require("@the-hive/lib-core");
const { getEnvironmentName } = require("@the-hive/lib-core");
const {
  getAliasesForCanonicalName,
  addCanonicalName,
  canonicalNameExists,
  aliasExists,
  getCanonicalNames,
  deleteAlias,
  getPaginatedCanonicalNameAndAliasBySearch,
  getCanonicalNameCategories,
  getSkillSearchFilterOptions,
  getFieldsAndTypes,
  getGremlinSkillComparison,
  getStandardNameByCanonicalNameIfExists,
  standardizeName,
  getCanonicalNameByStandardizedNameIfExists,
  getCanonicalNameDetails,
  updateCanonicalName,
  getCanonicalNameById,
} = require("../../queries/skills.queries");
const {
  getUsersAttributeInformation,
  getUsersAttributeInformationCount,
  getNewInstitutions,
  getAllInstitutions,
  getNewQualifications,
  getNewCertifications,
  getNewIndustryKnowledge,
  getNewSkills,
  getAttributesWithNoInstitutions,
  removeVertex,
  dropEdgeIfExists,
  addEdge,
  getAttributeConnectedEdges,
  getFieldsBaseOnTopLevelTags,
  getInstitutions,
  getInstitutionsByAttributeType,
  getInstitutionConnectedEdges,
  editUserAttribute,
  getAttributesType,
  getVertexIdentifier,
  getInstitutionsQualificationAvailableAt,
  addAttributeToInstitutionById,
  connectCertificationToExpires,
  getInstitutionsCertificationIsAvailableAt,
  getNewQualities,
  getAllQualities,
  getAttributeIdByNameAndType,
  isAttributeConnectedToTopLevelTag,
  getUsersConnectedToAttributeForInstitution,
  ratifyAttributeAvailableAtInstitution,
  checkIfAttributeIsNew,
  getNewInstitutionId,
  getAllQualifications,
  updateEdgeProperty,
  getVertexIdByCanonicalAndStandardizedNames,
  getAllCertifications,
} = require("../../queries/skills.gremlin.queries");
const {
  addNewAttribute,
  addOrUpdateFieldsForUserAttribute,
  updateVertexName,
  addNewInstitution,
  changeCanonicalName,
  removeCanonicalNameAndAliases,
  createStaffDetailsWithEmailsObject,
  getGroupedAttributesByTypesInCanonicalNameFormat,
  addCanonicalNameToAttributesOrInstitutions
} = require("../../shared/skills");
const {
  insertSkillsProfileForStaffId, 
  readSkillsProfileForStaffId,
  updateSkillsProfileById
} = require("../../queries/skills-profiles.queries");
const { deleteBlob } = require('@the-hive/lib-core');

const { getStaffNamesByIds, getStaffId } = require("../../queries/staff-overview.queries");
const { toCamelCase, listToCamelCase } = require("../../shared/field-fix-case");
const { downloadBlob } = require("../../shared/download-blob");
import { handleErrors, validateAndParsePagination } from '@the-hive/lib-core';
import { getStaffIdsByCompanyEntityFilter, removeAllDuplicateEdges, getFieldsAndTypes as retrieveFieldsAndTypes, getStaffId as retrieveStaffId, retrieveStandardizedNameAndGuid, WorkExperienceLogic, getAllStaffDetailsByStaffIds} from "@the-hive/lib-skills-logic";
import type { Request, Response } from 'express';
import fs from "fs";
const queue = require('../../shared/queue');

const CONTAINER_NAME = process.env.SKILLS_CONTAINER_NAME;
const SAVED_SEARCH_CONTAINER = parseIfSetElseDefault(process.env.SAVED_SEARCH_CONTAINER_NAME, "saved-skills-searches");
const UPLOADS_CONTAINER_NAME = process.env.SKILLS_UPLOAD_CONTAINER_NAME;
const STAFF_SUMMARY_ATTRIBUTE_TYPES = parseIfSetElseDefault("STAFF_SUMMARY_ATTRIBUTE_TYPES",
  ["skill","industry-knowledge","qualification"]);
const SKILL_MIN_SEARCH_CHARACTERS = parseIfSetElseDefault('SKILL_MIN_SEARCH_CHARACTERS', 3);
const GENERATE_BIO_AD_GROUPS = parseIfSetElseDefault('GENERATE_BIO_AD_GROUPS', []);

import { BadRequestDetail, isError } from "@the-hive/lib-shared";
import { AttributeLogic, BioLogic, CanonicalNamesLogic, FieldLogic, FileLogic, getStandardizedNameByCanonicalNameIfExists, GraphExportLogic, UsersLogic } from '@the-hive/lib-skills-logic';
import { AttributeCanonicalNameDetailsWithInstitution, RatificationCanonicalNameDetails, CanonicalNameUpdateCounts, Institution, StandardizedName, UserAttribute, UserAttributeWithStaffDetails, PendingProofValidation, Guid} from '@the-hive/lib-skills-shared';
import { getUserGroups } from '../security';
const { db, withTransaction } = require("../../shared/db");
const { client } = require("../../shared/skills-db-connection");
import { InstitutionLogic } from "@the-hive/lib-skills-logic";
import { StaffLogic } from '@the-hive/lib-staff-logic';
const institutionLogic = new InstitutionLogic(db, client);
const canonicalNamesLogic = new CanonicalNamesLogic(db, client);
const userLogic = new UsersLogic(db, client);
const attributeLogic = new AttributeLogic(db, client);
const fileLogic = new FileLogic(db, client);
const fieldLogic = new FieldLogic(db, client);
const graphExportLogic = new GraphExportLogic(db, client);
const bioLogic = new BioLogic(db);
const workExperienceLogic = new WorkExperienceLogic(db);
const staffLogic = new StaffLogic(db);
const MODIFY_BIO_INFORMATION_USERS = parseIfSetElseDefault('MODIFY_BIO_INFORMATION_USERS', []);

router.patch(
  "/skills/canonical-names",
  handle_errors(async (req, res) => {
    try {
      let updatedCanonicalName;
      await withTransaction(async (tx) => {
        updatedCanonicalName = await canonicalNamesLogic.updateCanonicalName(tx, req.body);
      });
      if (isError(updatedCanonicalName)) {
        res.status(400).json(updatedCanonicalName);
      } else {
        res.status(200).json(updatedCanonicalName);
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error", detail: error });
    }
  }),
);

router.delete(
  "/skills/institutions/:standardizedName",
  handle_errors(async (req, res) => {
    try {
      const { standardizedName } = req.params;
      const deletedBy = res.locals.upn;

      await withTransaction(async (tx) => {
        const institution = await institutionLogic.rejectInstitution(
          tx,
          standardizedName,
          deletedBy
        );

        if(isError(institution)){
          res.status(400).json(institution);
        } else{
          res.status(200).json(institution);
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", detail: error });
    }
  }),
);


router.post(
  "/skills/exports",
  handle_errors(async (req, res) => {
    try {
      const timestamp = await graphExportLogic.exportGraphDB(CONTAINER_NAME);
      res.status(200).json({ timestamp });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }),
);


router.get(
  "/skills/aliases/:id",
  handle_errors(async (req, res) => {
    const canonicalNameId = req.params.id;
    const aliases = await getAliasesForCanonicalName(canonicalNameId);
    res.status(200).json(aliases);
  }),
);

router.get(
  "/skills/canonical-names",
  handle_errors(async (req, res) => {
    let categories;
    if (req.query.categories) {
      categories = req.query.categories.split(",");
    } else {
      //will stay undefined as we're not filtering by categories
    }
    const canonicalNames = await getCanonicalNames(categories);
    res.status(200).json(canonicalNames);
  }),
);

router.get(
  "/skills/canonical-name-categories",
  handle_errors(async (_req, res) => {
    const canonicalNames = await getCanonicalNameCategories();
    res.status(200).json(canonicalNames);
  }),
);

router.post(
  "/skills/canonical-names",
  handle_errors(async (req, res) => {
    const { canonicalName, canonicalNameCategoryId } = req.body;
    const exists = await canonicalNameExists(canonicalName);
    if (exists) {
      res.status(400).json({ message: "Canonical name already exists." });
    } else {
      const standardizedName = await standardizeName(canonicalName);
      const newCanonicalName = await addCanonicalName(canonicalName, canonicalNameCategoryId, standardizedName);
      res.status(201).json(newCanonicalName);
    }
  }),
);

router.post(
  "/skills/aliases",
  handle_errors(async (req, res) => {
    const { canonicalNameId, alias } = req.body;
    const exists = await aliasExists(alias, canonicalNameId);
    if (exists) {
      res.status(400).json({ message: "Alias already exists." });
    } else{
      const canonicalNameDetails = await canonicalNamesLogic.retrieveCanonicalNameDetailsByCanonicalNameId(canonicalNameId);
      if(!canonicalNameDetails){
        res.status(400).json({ message: "Canonical name details do not exist for the given canonicalNameId" });
      } else if(alias.length > SKILL_MIN_SEARCH_CHARACTERS) {
        res.status(201).json(await withTransaction(async (tx) => await canonicalNamesLogic.addAnAlias(tx, canonicalNameDetails.canonicalNameId, alias)));
      } else {
        const createdAlias = await withTransaction(async (tx) => {
          const createdAlias = await canonicalNamesLogic.addAnAlias(tx, canonicalNameDetails.canonicalNameId, alias);
          await canonicalNamesLogic.addSearchTextException(tx, createdAlias.alias, canonicalNameDetails.standardizedName);
          return createdAlias;
        });

        res.status(201).json(createdAlias);
      }
    }
  }),
);

router.delete(
  "/skills/aliases/:id",
  handle_errors(async (req, res) => {
    const aliasId = req.params.id;
    if (aliasId) {
      await deleteAlias(aliasId);
      res.status(204).json();
    } else {
      res.status(400).json({ message: "Missing the aliasId parameter in the URL path." });
    }
  }),
);

router.get(
  "/skills/canonical-names-and-aliases/",
  handle_errors(async (req, res) => {
    try {
      const { searchText, pageSize, currentPage, category, findNotInGraphDB } = req.query;

      const searchResults = await getPaginatedCanonicalNameAndAliasBySearch(
        searchText,
        Number(pageSize),
        Number(currentPage),
        category,
        findNotInGraphDB,
      );

      res.status(200).json(searchResults);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.put(
  "/skills/saved-search",
  handle_errors(async (req, res) => {
    try {
      const filters = req.body.filters;
      const saveName = req.body.saveName;
      const validFields = await retrieveFieldsAndTypes(db);
      const invalidEntries = validateFilters(filters, validFields);
      const staffId = await retrieveStaffId(db, res.locals.upn);

      if (invalidEntries.length > 0) {
        return res.status(400).json({invalidEntries});
      } else {
        const searchObjectToSave = Buffer.from(JSON.stringify(filters), "utf-8");
        const savedSearchName = saveName + ".json";
        await uploadRaw(searchObjectToSave, SAVED_SEARCH_CONTAINER, `${getEnvironmentName(true)}/${staffId}/${savedSearchName}`);
        res.status(200).json({ savedSearchName});
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.get(
  "/skills/saved-search/",
  handle_errors(async (req, res) => {
    try {
      const staffId = await retrieveStaffId(db,res.locals.upn);
      const folders = await listFolder(SAVED_SEARCH_CONTAINER,`${getEnvironmentName(true)}/${staffId}`,true)
      res.status(200).json(res.status(200).json(folders.folders[0]?.items?.blobs?.map((file) => file.nameInFolder) || []));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.get(
  "/skills/saved-search/:savedSearchName",
  handle_errors(async (req, res) => {
    try {
      const staffId = await retrieveStaffId(db,res.locals.upn);
      const savedSearchName= req.params.savedSearchName;
      const filePath = `${getEnvironmentName(true)}/${staffId}/${savedSearchName}`;
      const fileContent = await fetchBlobData(SAVED_SEARCH_CONTAINER, filePath);
      const parsedContent = JSON.parse(fileContent);
      res.status(200).json(parsedContent);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.put(
  "/skills/users",
  handle_errors(async (req, res) => {
    try {
      const filters = req.body.filters;
      const validFields = await getFieldsAndTypes();
      const filterOperators = await getGremlinSkillComparison();
      const entityFilters = req.body.entityFilters;
      const officeFilters = req.body.officeFilters
      const filterByStaffOnSupply = req.body.filterByStaffOnSupply;
      const {startIndex, pageLength} = req.body.pagination;
      const { includeCount } = req.body;

      const invalidEntries = validateFilters(filters, validFields);
      const pagination = validateAndParsePagination(String(startIndex), String(pageLength));

      if (isError(pagination)) {
        return res.status(400).json(pagination);
      } else 
      if (invalidEntries.length > 0) {
        return res.status(400).json({
          error: invalidEntries,
        });
      } else {
        const staffIdsToInclude = await getStaffIdsByCompanyEntityFilter(db,entityFilters, undefined, undefined, filterByStaffOnSupply, officeFilters);
        const [skillExperienceLevels, totalCount] = await Promise.all([
          getUsersAttributeInformation(filters, filterOperators, staffIdsToInclude, pagination, includeCount),
          includeCount 
            ? getUsersAttributeInformationCount(filters, filterOperators, staffIdsToInclude) 
            : Promise.resolve(undefined)
        ]);        

        const staffIds = skillExperienceLevels.map((experienceDetails) => experienceDetails.staffId);
        const staffNames = await getStaffNamesByIds(staffIds);
        const userSkillExperienceLevels = {};
        
        const uniqueAttributeStandardizedNames = [...new Set<StandardizedName>(
          skillExperienceLevels.map(({ standardizedName } : {standardizedName: StandardizedName}) => standardizedName)
        )];

        const attributes = await Promise.all(
          uniqueAttributeStandardizedNames.map(async (standardizedName) => 
            await attributeLogic.getAttributeForStandardizedName(standardizedName)
        ))

        for (const experienceDetails of skillExperienceLevels) {
          const { staffId, standardizedName } = experienceDetails;
          const { userName, bbdUserName, jobTitle, isIndia, entity, userPrincipleName, department, office, manager} = staffNames.find(
            (staff) => staff.staffId === experienceDetails.staffId,
          );

          if (!userSkillExperienceLevels[staffId]) {
            userSkillExperienceLevels[staffId] = {
              staffId,
              userName,
              bbdUserName,
              jobTitle,
              isIndia,
              entity,
              userPrincipleName,
              department,
              office,
              manager,
              userAttributes: [],
            };
          } else {
            //do nothing
          }

          const attribute = attributes.find((attribute) => attribute.standardizedName === standardizedName);
          const userAttribute: UserAttribute | BadRequestDetail = 
          attribute === undefined ? {
            message: `Cannot find attribute with standardizedName: ${standardizedName}`}
            :
            {
              staffId,
              guid: experienceDetails.guid,
              attribute,
              fieldValues: experienceDetails.fieldValues
            };
          userSkillExperienceLevels[staffId].userAttributes.push(userAttribute);
        }

        res.json({
          userResults: userSkillExperienceLevels,
          totalCount: totalCount
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

function isValueValid(filter, filterValue, fieldType) {
  if (filter === "between") {
    const validateFunction = (filterValue) =>
      fieldType === "Date" ? !Number.isNaN(Date.parse(filterValue)) : typeof filterValue === "number";
    return validateFunction(filterValue.min) && validateFunction(filterValue.max);
  } else if (fieldType === "Date") {
    return filterValue === process.env.SKILL_CURRENT_DATE || !Number.isNaN(Date.parse(filterValue));
  } else if (fieldType === "number") {
    return typeof filterValue === "number";
  } else if (fieldType === "string" && filter !== "between") {
    return validateString(filterValue);
  } else {
    return false;
  }
}

function validateString(filterValue) {
  const isNonEmptyString = (value) => typeof value === "string" && value.trim() !== "";
  if (Array.isArray(filterValue)) {
    return filterValue.every((value) => isNonEmptyString(value));
  } else {
    return isNonEmptyString(filterValue);
  }
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
// TODO: RE - types need to be cleaned up here
function validateFilters(filters, validFields) {
  const invalidFields = [];
  for (const filter of Object.values(filters)) {
    for (const attribute of (filter as any)) {
      if (attribute.fieldFilters) {
        validateFieldName(validFields, attribute.fieldFilters, invalidFields);
      } else {
        //There are no fields to validate.
      }
    }
  }
  return invalidFields;
}
/* eslint-enable  @typescript-eslint/no-explicit-any */

function validateFieldName(validFields, attributeFieldFilters, invalidFields) {
  for (const attributeFilter of attributeFieldFilters) {
    const fieldName = attributeFilter.field;
    const field = validFields.find((field) => toCamelCase(field.fieldName) === fieldName);
    if (!field) {
      invalidFields.push(fieldName);
    } else {
      validateFilterFields(attributeFilter, field.javaScriptType, invalidFields);
    }
  }
}

function validateFilterFields(attributeFilter, fieldJsType, invalidFields) {
  for (const filter of Object.keys(attributeFilter)) {
    const isValid = isValueValid(filter, attributeFilter[filter], fieldJsType);
    if (!isValid && filter !== "field") {
      invalidFields.push(attributeFilter[filter]);
    } else {
      // If valid, do nothing
    }
  }
}

router.get(
  "/skills/institutions",
  handle_errors(async (req, res) => {
    try {
      const isNew = req.query.new;
      const standardizedInstitutions = await (isNew ? getNewInstitutions() : getAllInstitutions());
      const institutions = await addCanonicalNameToAttributesOrInstitutions(standardizedInstitutions);
      const institutionsWithCanonicalAttributes = await Promise.all(
        institutions.map(async (institution) => ({
          ...institution,
          qualifications: await addCanonicalNameToAttributesOrInstitutions(institution.qualifications),
          certifications: await addCanonicalNameToAttributesOrInstitutions(institution.certifications),
        }))
      );
      res.status(200).json(institutionsWithCanonicalAttributes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.get(
  "/skills/qualifications",
  handle_errors(async (req, res) => {
    try {
      const isNew = req.query.new;
      const standardizedQualifications = await (isNew? getNewQualifications(): getAllQualifications());
      const qualifications = await addCanonicalNameToAttributesOrInstitutions(standardizedQualifications);
      const qualificationsWithCanonicalInstitutions = await Promise.all(
        qualifications.map(
          async (qualification) => ({
            ...qualification,
            institutions: await addCanonicalNameToAttributesOrInstitutions(qualification.institutions),
          }),
        ),
      );
      res.status(200).json(qualificationsWithCanonicalInstitutions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.get(
  "/skills/certifications",
  handle_errors(async (req, res) => {
    try {
      const isNew = req.query.new;
      const standardizedcertifications = await (isNew? getNewCertifications() : getAllCertifications());
      const certifications = await addCanonicalNameToAttributesOrInstitutions(standardizedcertifications);
      const certificationsWithCanonicalInstitutions = await Promise.all(
        certifications.map(
          async (certification) => ({
            ...certification,
            institutions: await addCanonicalNameToAttributesOrInstitutions(certification.institutions),
          }),
        ),
      );
      res.status(200).json(certificationsWithCanonicalInstitutions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.get(
  "/skills/industry-knowledge",
  handle_errors(async (req, res) => {
    try {
      const isNew = req.query.new;
      const standardizedindustryKnowledge = await (isNew? getNewIndustryKnowledge() : getAttributesWithNoInstitutions("industry-knowledge"));
      const industryKnowledge = await addCanonicalNameToAttributesOrInstitutions(standardizedindustryKnowledge);
      res.status(200).json(industryKnowledge);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.get(
  "/skills/fields/:topLevelTag",
  handle_errors(async (req, res) => {
    try {
      const topLevelTag = req.params.topLevelTag;
      const fields = await getFieldsBaseOnTopLevelTags(topLevelTag);
      const fieldsWeAreInterestedIn = {
        ...fields,
        fields: fields.fields.filter((field) => !field.includes("upload")),
        canonicalName: await getCanonicalNameByStandardizedNameIfExists(topLevelTag),
      };
      res.status(200).json(fieldsWeAreInterestedIn);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.get(
  "/attribute-types",
  handle_errors(async (req, res) => {
    try {
      const includeStaffSummaryAttributeTypes = req.query.includeStaffSummaryAttributeTypes === 'true';
      const topLevelTags = await attributeLogic.retrieveTopLevelTagsStandardizedAndCanonicalNames();
      if(includeStaffSummaryAttributeTypes){
        const filteredTopLevelTags = topLevelTags
          .filter(topLevelTag => STAFF_SUMMARY_ATTRIBUTE_TYPES.includes(topLevelTag.standardizedName))
          .map(topLevelTag => ({
            attributeType: topLevelTag.standardizedName,
            attributeTypeCanonicalName: topLevelTag.canonicalName
          }));
        res.status(200).json(filteredTopLevelTags);
      } else {
        res.status(200).json(topLevelTags);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.get(
  "/skills/attributes/:attribute",
  handle_errors(async (req, res) => {
    try {
      const standardizedName = req.params.attribute;
      const attributeSearchResults = await attributeLogic.getAttributeForStandardizedName(standardizedName);
      const fieldsWeAreInterestedIn = {
        attribute: attributeSearchResults.standardizedName,
        fields: listToCamelCase(attributeSearchResults.requiredFields.map((field) => field.standardizedName).filter((field) => !field.includes("upload"))),
        tags: attributeSearchResults.skillPath.filter((tag) => !tag.isTopLevel).map((tag) => tag.standardizedName),
        type: attributeSearchResults.attributeType,
        canonicalName: attributeSearchResults.canonicalName
      };
      res.json(fieldsWeAreInterestedIn);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);


router.get(
  "/skills/institutions/:attribute",
  handle_errors(async (req, res) => {
    try {
      const standardizedName = req.params.attribute;
      const standardizedInstitutions = await getInstitutions(standardizedName);
      const institutions = await Promise.all(
        standardizedInstitutions.map(
          async (institution) => await getCanonicalNameByStandardizedNameIfExists(institution),
        ),
      );
      res.status(201).json(institutions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.get(
  "/skills/institutions-for-attributes/:attributeType",
  handle_errors(async (req, res) => {
    try {
      const attributeType = req.params.attributeType;
      const standardizedInstitutionsForAttributeType = await getInstitutionsByAttributeType(attributeType);
      const institutionsForAttributeType = await Promise.all(
        standardizedInstitutionsForAttributeType.map(
          async (institution) => await getCanonicalNameByStandardizedNameIfExists(institution),
        ),
      );
      res.json(institutionsForAttributeType);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.get(
  "/skills/skills-field",
  handle_errors(async (req, res) => {
    try {
      const result = await fieldLogic.retrieveSkillField();
      res.status(200).send({ fields: result });
    } catch (error) {
      res.status(500).send(error.message);
    }
  }),
);

router.get(
  "/skills/js-type",
  handle_errors(async (req, res) => {
    try {
      const result = await fieldLogic.retrieveJSType();
      res.status(200).send({ types: result });
    } catch (error) {
      res.status(500).send(error.message);
    }
  }),
);

router.get(
  "/skills/js-type-scale",
  handle_errors(async (req, res) => {
    try {
      const fields = await fieldLogic.retrieveJSTypeScale();
      res.status(200).send({ fields });
    } catch (error) {
      res.status(500).send(error.message);
    }
  }),
);

router.get(
  "/skills/skill-attributes",
  handle_errors(async (req, res) => {
    try {
      const isNew = req.query.new;
      if (isNew) {
        const newStandardizedSkills = await getNewSkills();
        const newSkills = await addCanonicalNameToAttributesOrInstitutions(newStandardizedSkills);
        res.status(200).json(newSkills);
      } else {
        const standardizedSkills = await getAttributesWithNoInstitutions("skill");
        const skills = await addCanonicalNameToAttributesOrInstitutions(standardizedSkills);
        res.status(200).json(skills);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.get(
  "/skills/skill-search-filter-options",
  handle_errors(async (_req, res) => {
    try {
      const skillSearchComparisons = await getSkillSearchFilterOptions();
      res.status(200).json(skillSearchComparisons);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.patch(
  "/skills/new/:attributeId",
  handle_errors(async (req, res) => {
    try {
      const attributeCanonicalName = req.body.canonicalName;
      const attributeId = req.params.attributeId;

      // Get the topLevelTag and therefore the attributeTag given the TLT USING the attributeId
      const currentAttributeStandardizedName = await getVertexIdentifier(attributeId);
      const currentCanonicalName = await getCanonicalNameByStandardizedNameIfExists(currentAttributeStandardizedName);
      const topLevelTag = await getAttributesType(attributeId);
      const attributeTag = `new-${topLevelTag}`;

      const errors = [];
      const canonicalNameDetails = await getCanonicalNameDetails(attributeCanonicalName);
      if (canonicalNameDetails && canonicalNameDetails?.canonicalNameCategory !== topLevelTag) {
        errors.push(
          `"${attributeCanonicalName}" already exists with type ${canonicalNameDetails.canonicalNameCategory}`,
        );
      } else {
        // there is no error that we should account for
      }

      if (errors && errors.length > 0) {
        res.status(400).json({ message: errors[0] });
      } else {
        if (currentCanonicalName === attributeCanonicalName) {
          // The names are the same so no update is taking place
          await connectAttributeTopLevelTag(currentAttributeStandardizedName, attributeTag, topLevelTag);
        } else {
          // We are updating the name of the attribute
          if (canonicalNameDetails && currentCanonicalName.toLowerCase() !== attributeCanonicalName.toLowerCase()) {
            // Name updating to something that exists and so we connect it to an existing attribute
            await connectEdgesToExistingAttribute(attributeId, attributeCanonicalName, topLevelTag);
          } else {
            // Just do an normal name update for the canonicalNames and the actual vertex
            const standardizedName = await standardizeName(attributeCanonicalName);
            if (standardizedName === currentAttributeStandardizedName) {
              // We are only changing the case of the name
              await changeCanonicalName(attributeId, attributeCanonicalName, topLevelTag);
            } else {
              await updateAttributeName(attributeId, attributeCanonicalName, topLevelTag, standardizedName);
            }
            await connectAttributeTopLevelTag(standardizedName, attributeTag, topLevelTag);
          }
        }
        res.status(204).send();
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.patch(
  "/skills/institutions",
  handle_errors(async (req, res) => {
    try {
      const institution = req.body.institution.canonicalName;
      const institutionType = req.body.institutionType;
      const institutionId = req.body.institution.institutionId;
      const updatedName = req.body.updatedName;

      if (updatedName) {
        await updateInstitutionName(institutionId, updatedName);
        const standardizedName = await standardizeName(updatedName);
        await connectInstitutionTopLevelTag(standardizedName, institutionType);
      } else {
        const standardizedName = await standardizeName(institution);
        await connectInstitutionTopLevelTag(standardizedName, institutionType);
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.delete(
  "/skills/qualifications/:qualificationId",
  handle_errors(async (req, res) => {
    try {
      const qualificationId = req.params.qualificationId;
      await removeVertex(qualificationId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.patch(
  "/skills/qualifications/:qualificationId",
  handle_errors(async (req, res) => {
    try {
      const qualificationId = req.params.qualificationId;
      const canonicalName = req.body.qualification.canonicalName;
      const standardizedName = await standardizeName(canonicalName);
      const attributeTag = "new-qualification";
      const vertexIdentifier = await getVertexIdentifier(qualificationId);
      const currentVertexName = await getCanonicalNameByStandardizedNameIfExists(vertexIdentifier);
      const topLevelTag = "qualification";

      if (canonicalName !== currentVertexName && canonicalName !== vertexIdentifier) {
        await updateQualificationName(qualificationId, canonicalName, standardizedName);
        await connectAttributeTopLevelTag(standardizedName, attributeTag, topLevelTag);
      } else {
        await connectAttributeTopLevelTag(standardizedName, attributeTag, topLevelTag);
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);
router.delete(
  "/skills/certifications/:certificationId",
  handle_errors(async (req, res) => {
    try {
      const certificationId = req.params.certificationId;
      await removeVertex(certificationId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.patch(
  "/skills/certifications/:certificationId",
  handle_errors(async (req, res) => {
    try {
      const certificationId = req.params.certificationId;
      const { canonicalName, expires } = req.body.certification;
      const attributeTag = "new-certification";
      const standardizedName = await standardizeName(canonicalName);
      const vertexIdentifier = await getVertexIdentifier(certificationId);
      const currentVertexName = await getCanonicalNameByStandardizedNameIfExists(vertexIdentifier);
      const topLevelTag = "certification";

      if ( canonicalName !== currentVertexName && canonicalName !== vertexIdentifier) {
        await updateCertificationName(certificationId, canonicalName, expires, standardizedName);
        await connectAttributeTopLevelTag(standardizedName, attributeTag, topLevelTag);
      } else {
        await connectAttributeTopLevelTag(standardizedName, attributeTag, topLevelTag);
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

async function connectAttributeTopLevelTag(attributeName, currentTag, topLevelTag) {
  await dropEdgeIfExists({ type: "attribute", name: attributeName }, { type: "new", name: currentTag });

  const attributeConnectedToTopLevelTag = await isAttributeConnectedToTopLevelTag(attributeName, topLevelTag);

  if (!attributeConnectedToTopLevelTag) {
    await addEdge({ type: "attribute", name: attributeName }, { type: "topLevelTag", name: topLevelTag }, "is-a");
  } else {
    // Attribute is already connected to TopLevelTag
  }
}

async function updateAttributeName(attributeId, updatedName, topLevelTag, standardizedName) {
  const users = await getAttributeConnectedEdges(attributeId);
  const newAttribute = await addNewAttribute(standardizedName, topLevelTag);
  const newAttributeId = newAttribute.attributeId;

  for (const user of users) {
    const fields = Object.entries(user.userExperience).map(([key, value]) => {
      return { name: key, value: value };
    });
    await addOrUpdateFieldsForUserAttribute(newAttributeId, user.staffId, fields);
  }
  await changeCanonicalName(attributeId, updatedName, topLevelTag);
  await removeVertex(attributeId);
}

async function connectInstitutionTopLevelTag(institution, institutionType) {
  await dropEdgeIfExists({ type: "tag", name: institution }, { type: "new", name: "new-institution" });
  await addEdge({ type: "tag", name: institution }, { type: "tag", name: institutionType }, "is-a");
}

async function updateInstitutionName(institutionId, updatedName) {
  const attributes = await getInstitutionConnectedEdges(institutionId);
  const vertexIdentifier = await getVertexIdentifier(institutionId);

  for (const attribute of attributes) {
    await addNewInstitution(updatedName, attribute.attributeId);
    const institutionVertexName = await getStandardNameByCanonicalNameIfExists(updatedName);
    const newInstitutionId = await getNewInstitutionId(institutionVertexName);
    await ratifyAttributeAvailableAtInstitution(attribute.attributeId, newInstitutionId);
    for (const edge of attribute.edges) {
      if (edge.properties.obtainedFrom === vertexIdentifier) {
        const field = { name: "obtainedFrom", value: institutionVertexName };
        await editUserAttribute(edge.person, field, edge.edgeId);
      } else {
        // No users have attributes connected to this institution
      }
    }
  }

  await removeCanonicalNameAndAliases(institutionId, "Institution");
  await removeVertex(institutionId);
}

async function updateQualificationName(qualificationId, updatedName, standardizedName) {
  const users = await getAttributeConnectedEdges(qualificationId);
  const newAttribute = await addNewAttribute(standardizedName, "qualification");
  const newQualificationId = newAttribute.attributeId;
  const availableAt = await getInstitutionsQualificationAvailableAt(qualificationId);

  for (const institution of availableAt) {
    await addAttributeToInstitutionById(newQualificationId, institution.name);
    await ratifyAttributeAvailableAtInstitution(newQualificationId, institution.institutionId);
  }

  for (const user of users) {
    const fields = Object.entries(user.userExperience).map(([key, value]) => {
      return { name: key, value: value };
    });
    await addOrUpdateFieldsForUserAttribute(newQualificationId, user.staffId, fields);
  }
  await changeCanonicalName(qualificationId, updatedName, "qualification");
  await removeVertex(qualificationId);
}

async function updateCertificationName(certificationId, updatedName, expires, standardizedName) {
  const users = await getAttributeConnectedEdges(certificationId);
  const newAttribute = await addNewAttribute(standardizedName, "certification");
  const newCertificationId = newAttribute.attributeId;

  const availableAt = await getInstitutionsCertificationIsAvailableAt(certificationId);
  for (const institution of availableAt) {
    await addAttributeToInstitutionById(newCertificationId, institution.name);
    await ratifyAttributeAvailableAtInstitution(newCertificationId, institution.institutionId);
  }

  if (expires) {
    await connectCertificationToExpires(newCertificationId);
  } else {
    // Certification does not expire and does not need to be connected to Expires
  }

  for (const user of users) {
    const fields = Object.entries(user.userExperience).map(([key, value]) => {
      return { name: key, value: value };
    });
    await addOrUpdateFieldsForUserAttribute(newCertificationId, user.staffId, fields);
  }
  await changeCanonicalName(certificationId, updatedName, "Certification");
  await removeVertex(certificationId);
}

router.get(
  "/skills/qualities",
  handle_errors(async (req, res) => {
    try {
      const isNew = req.query.new;
      const standardizedQualities = await (isNew? getNewQualities() : getAllQualities());
      const newQualities = await addCanonicalNameToAttributesOrInstitutions(standardizedQualities)
      res.status(200).json(newQualities);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

async function connectEdgesToExistingAttribute(attributeId, updatedName, topLevelTag) {
  const users = await getAttributeConnectedEdges(attributeId);
  const canonicalUpdatedName = await getStandardNameByCanonicalNameIfExists(updatedName);
  const existingAttributeId = await getAttributeIdByNameAndType(canonicalUpdatedName, topLevelTag);

  for (const user of users) {
    const fields = Object.entries(user.userExperience).map(([key, value]) => {
      return { name: key, value: value };
    });
    await addOrUpdateFieldsForUserAttribute(existingAttributeId, user.staffId, fields);
  }

  removeCanonicalNameAndAliases(attributeId, topLevelTag);
  removeVertex(attributeId);
}

router.get(
  "/skills/user-qualifications/:qualificationId",
  handle_errors(async (req, res) => {
    try {
      const qualificationId = req.params.qualificationId;
      const institutionName = req.query.institution;

      if (!institutionName) {
        return res.status(400).json({ message: "Institution name is required" });
      } else {
        const institutionStandardizedName = await getStandardNameByCanonicalNameIfExists(institutionName);
        const staffQualificationDetails = await getUsersConnectedToAttributeForInstitution(qualificationId, [
          institutionStandardizedName,
          institutionName,
        ]);
        const connectedStaffDetails = await createStaffDetailsWithEmailsObject(staffQualificationDetails);
        res.status(200).json(connectedStaffDetails);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.get(
  "/skills/user-certifications/:certificationId",
  handle_errors(async (req, res) => {
    try {
      const certificationId = req.params.certificationId;
      const institutionName = req.query.institution;

      if (!institutionName) {
        return res.status(400).json({ message: "Institution name is required" });
      } else {
        const institutionStandardizedName = await getStandardNameByCanonicalNameIfExists(institutionName);
        const staffCertificationDetails = await getUsersConnectedToAttributeForInstitution(certificationId, [
          institutionStandardizedName,
          institutionName,
        ]);
        const connectedStaffDetails = await createStaffDetailsWithEmailsObject(staffCertificationDetails);
        res.status(200).json(connectedStaffDetails);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.get(
  "/skills/users/:standardizedName",
  handle_errors(async (req, res) => {
    try {
      const institutionName = req.query.institutionName;
      let users: UserAttributeWithStaffDetails[];
      if (institutionName) {
        const attribute = await attributeLogic.getAttributeForStandardizedName(req.params.standardizedName);
        users = await userLogic.retrieveStaffWithAttributeObtainedFromInstitution(attribute, institutionName);
      } else {
        const attribute = await attributeLogic.getAttributeForStandardizedName(req.params.standardizedName);
        users = await userLogic.getUsersByAttribute(attribute);
      }
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.get(
  "/skills/proof/:filePath(*)",
  handle_errors(async (req, res) => {
    try {
      const result = await downloadBlob(UPLOADS_CONTAINER_NAME, req.params.filePath);
      result.readableStreamBody.pipe(res);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.patch(
  "/skills/needs-ratification/qualifications/:qualificationId",
  handle_errors(async (req, res) => {
    try {
      const qualificationId = req.params.qualificationId;
      const institutionId = req.body.institutionId;
      const vertexIdentifier = await getVertexIdentifier(qualificationId);
      const topLevelTag = "qualification";

      if (!institutionId) {
        return res.status(400).json({ message: "InstitutionId is required" });
      } else {
        await ratifyAttributeAvailableAtInstitution(qualificationId, institutionId);
        const isNewQualification = await checkIfAttributeIsNew(qualificationId, topLevelTag);

        if (isNewQualification) {
          connectAttributeTopLevelTag(vertexIdentifier, "new-qualification", topLevelTag);
        } else {
          // Qualification has already been ratified as a real qualification
        }
        res.status(204).send();
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.patch(
  "/skills/needs-ratification/certifications/:certificationId",
  handle_errors(async (req, res) => {
    try {
      const certificationId = req.params.certificationId;
      const institutionId = req.body.institutionId;
      const vertexIdentifier = await getVertexIdentifier(certificationId);
      const topLevelTag = "certification";

      if (!institutionId) {
        return res.status(400).json({ message: "InstitutionId is required" });
      } else {
        await ratifyAttributeAvailableAtInstitution(certificationId, institutionId);
        const isNewCertification = await checkIfAttributeIsNew(certificationId, topLevelTag);

        if (isNewCertification) {
          connectAttributeTopLevelTag(vertexIdentifier, "new-certification", topLevelTag);
        } else {
          // Certification has already been ratified as a real certification
        }
        res.status(204).send();
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.patch(
  "/skills/canonical-name/:canonicalNameId",
  handle_errors(async (req, res) => {
    try {
      const canonicalNameId = req.params.canonicalNameId;
      const { updatedCanonicalName } = req.body;
      const canonicalNameData = await getCanonicalNameById(canonicalNameId);

      if (await canonicalNameExists(updatedCanonicalName)) {
        res.status(400).json({ message: "Canonical name already exists." });
      } else if (!canonicalNameData || !(canonicalNameData.length > 0)) {
        res.status(400).json({ message: "Canonical name by given id does not exist." });
      } else {
        const { canonicalName } = canonicalNameData[0];
        const oldStandardizedName = await getStandardNameByCanonicalNameIfExists(canonicalName);
        await updateCanonicalName(canonicalNameId, updatedCanonicalName);
        const newStandardizedName = await getStandardNameByCanonicalNameIfExists(updatedCanonicalName);
        const vertexIds = await getVertexIdByCanonicalAndStandardizedNames(canonicalName, oldStandardizedName);
        for (const vertexId of vertexIds) {
          await updateVertexName(vertexId, newStandardizedName);
        }
        await updateEdgeProperty("obtainedFrom", [canonicalName, oldStandardizedName], newStandardizedName);
        return res.status(200).json({ updatedCanonicalName });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.get(
  "/skills/user-summary",
  handle_errors(async (req, res) => {
    try {
      const companyEntityIds = req.query.companyEntityIds;
      const searchDate = req.query.searchDate;
      const staffNameSearchText = req.query.staffNameSearchText;
      const attributeType = req.query.attributeType;
      const userCountResponse = await userLogic.getUserCount(companyEntityIds, searchDate, staffNameSearchText, attributeType);
      if(isError(userCountResponse)){
        res.status(400).json(userCountResponse);
      } else {
      res.status(200).json(userCountResponse);
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.get(
  "/skills/ratification-summary",
  handle_errors(async (req, res) => {
    try {
      const ratificationTotals = await attributeLogic.getRatificationTotals();
      res.status(200).json(ratificationTotals);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.get(
  "/skills/skill-summary",
  handle_errors(async (req, res) => {
    try {
      const companyEntityIds = req.query.companyEntityIds;
      const attributeTotals = await attributeLogic.retrieveAttributeTotals(companyEntityIds);
      res.status(200).json(attributeTotals);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.get(
  "/skills/unratified/available-at",
  handleErrors(async (
    req: Request<undefined, undefined, undefined, {startIndex:string, pageLength:string, searchText?: string}>, 
    res: Response< AttributeCanonicalNameDetailsWithInstitution | BadRequestDetail>
  ) => {
    try {
      const pagination = validateAndParsePagination(req.query.startIndex, req.query.pageLength);
      const searchText = req.query.searchText;
      if (isError(pagination)){
        res.status(400).json(pagination);
      } else {
        const unratifiedOfferedAttributes = await attributeLogic.retrieveAttributesWithInstitutionsWithUnratifiedAvailableAt(pagination, searchText)
        res.status(200).json(unratifiedOfferedAttributes);
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.get(
  "/skills/unratified/:topLevelTag",
  handleErrors(async (
    req : Request<{topLevelTag:StandardizedName}, undefined, undefined, {startIndex:string, pageLength:string, searchText?:string}>, 
    res : Response<RatificationCanonicalNameDetails | BadRequestDetail>
  ) => {
    try {
      const topLevelTag = req.params.topLevelTag;
      const pagination = validateAndParsePagination(req.query.startIndex, req.query.pageLength);
      const searchText = req.query.searchText;
      if (isError(pagination)){
        res.status(400).json(pagination);
      } else {
        const unratifiedSkillsData = await attributeLogic.retrieveUnratifiedSkills(topLevelTag, pagination, searchText);
        res.status(200).json(unratifiedSkillsData);
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.get(
  "/skills/staff-summary",
  handle_errors(async (req, res) => {
    try {
      const hasSkills = req.query.hasSkills === "true";
      const companyEntityIds = req.query.companyEntityIds;
      const selectedCompanyEntityIds = companyEntityIds.split(",");
      const pageLength = Number(req.query.pageLength);
      const startIndex = Number(req.query.startIndex);
      const searchDate = req.query.searchDate;
      const staffNameSearchText = req.query.staffNameSearchText;
      const sortColumn = req.query.sortedColumn ? req.query.sortedColumn : "staffId";
      const sortOrder = req.query.sortOrder ? req.query.sortOrder : "ASC";
      const attributeType = req.query.attributeType;

      if (startIndex < 0 || pageLength < 0) {
        throw Error("startIndex and pageLength must be zero or above.");
      } else {
        const staffSummaryResponse = await userLogic.getStaffSummary(
          selectedCompanyEntityIds,
          startIndex,
          pageLength,
          hasSkills,
          searchDate,
          staffNameSearchText,
          sortColumn,
          sortOrder,
          attributeType
        );
        if(isError(staffSummaryResponse)){
          res.status(400).json(staffSummaryResponse);
        } else {
          res.status(200).json(staffSummaryResponse);
        }
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error", detail: error.message });
    }
  }),
);

router.get(
  "/skills/attribute-summary/:standardizedName",
  handle_errors(async (req, res) => {
    try {
      const standardizedName = req.params.standardizedName;
      let { officeIds } = req.query;

      if (!officeIds) {
        res.status(400).json({ message: "officeIds are required." });
      } else {
        officeIds = officeIds.split(',');

        if (officeIds.some(officeId => Number.isNaN(Number(officeId)) || Number(officeId) <= 0)) {
          res.status(400).json({ message: "All officeIds must be positive numbers." });
        } else {
          const attributeSummaryResponse = await attributeLogic.getAttributeSummary(standardizedName, officeIds.map(officeId => parseInt(officeId)));
          if (isError(attributeSummaryResponse)) {
            res.status(400).json(attributeSummaryResponse);
          } else {
            res.status(200).json(attributeSummaryResponse);
          }
        }
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.get(
  "/user-skills",
  handle_errors(async (req, res) => {
    try {
      const attributeType = req.query.attributeType;
      const userProfile = await userLogic.getUserProfile(req.query.upn, attributeType);
      if (isError(userProfile)) {
        res.status(400).json(userProfile);
      } else {
        res.status(200).json(userProfile);
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.get(
  "/csv-of-skills-users",
  handle_errors(async (req, res) => {
    try {
      const hasUsedSkills = req.query.hasUsedSkills === "true";
      const companyEntityIds = req.query.companyEntityIds.split(",");
      const staffNameSearchText = req.query.staffNameSearchText;
      const searchDate = req.query.searchDate
      const attributeType = req.query.attributeType;
      const staffSummary = await userLogic.getStaffSummary(companyEntityIds, undefined, undefined, hasUsedSkills, searchDate, staffNameSearchText, "staffId", "ASC", attributeType);
      if (isError(staffSummary)) {
        res.status(400).json(staffSummary);
      } else {
        const csvFilePath = await fileLogic.setCSVFileAndGetCSVFilePath(staffSummary, hasUsedSkills);
        res.writeHead(200, {
          "Content-Disposition": `attachment; filename=${fileLogic.getCSVFileName(hasUsedSkills)}`,
          "Content-Type": "text/csv",
        });
        fs.createReadStream(csvFilePath).pipe(res);
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.patch(
  "/skills/user-skills/:upn",
  handle_errors(async (req, res) => {
    try {
      const staffId = await getStaffId(res.locals.upn);
      const userAttribute = req.body;
      const userAttributeWithAddedProperties = await userLogic.addAttributeAsCoreTechForUser(
        userAttribute,
        staffId.staffId
      );
      if (isError(userAttributeWithAddedProperties)) {
        res.status(400).json(userAttributeWithAddedProperties);
      } else {
        res.status(200).json(userAttributeWithAddedProperties);
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.patch(
  "/user-skills/:upn/core-tech",
  handle_errors(async (req, res) => {
    try {
      const userAttribute = req.body;
      const userAttributeWithRemovedCoreTechProperties = await userLogic.removeCoreTechInformationFromAttribute(
        userAttribute,
      );
      if (isError(userAttributeWithRemovedCoreTechProperties)) {
        res.status(400).json(userAttributeWithRemovedCoreTechProperties);
      } else {
        res.status(200).json(userAttributeWithRemovedCoreTechProperties);
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.get(
  "/user-skills/:upn/core-tech",
  handle_errors(async (req, res) => {
    try {
      const { upn } = req.params;
      if (!upn) {
        res.status(400).json({ message: "UPN is required" });
      } else {
        const staffId = await getStaffId(upn);
        const userCoreTech = await userLogic.retrieveStaffCoreTech(staffId.staffId);
        if (isError(userCoreTech)) {
          res.status(400).json(userCoreTech);
        } else {
          res.status(200).json(userCoreTech);
        }
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
)

router.patch(
  "/required-fields",
  handle_errors(async (_req, res) => {
    try {
      const standardizedFields = await fieldLogic.standardizeFields(client);
      res.status(200).json(standardizedFields)
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
)

router.delete(
  "/skills/:standardizedName",
  handle_errors(async (req, res) => {
    const { standardizedName } = req.params;
    const rejectedBy = res.locals.upn;

    const attribute = await attributeLogic.getAttributeForStandardizedName(standardizedName);
    let usersToNotify: UserAttributeWithStaffDetails[] = [];
    try {
      usersToNotify = await userLogic.getUsersByAttribute(attribute);
    } catch {
      usersToNotify = [];
    }
    let deletedAttribute;
    await withTransaction(async (tx) => {
      deletedAttribute = await attributeLogic.rejectAttribute(
        tx,
        standardizedName,
        rejectedBy
      );
    });

    if (isError(deletedAttribute)) {
      res.status(400).json( deletedAttribute );
    } else {
      for (const user of usersToNotify) {
        await queue.enqueue("attribute-rejection-email-queue", {
          displayName: user.displayName,
          upn: user.upn,
          attributeCanonicalName: deletedAttribute.canonicalName,
          attributeType: deletedAttribute.attributeType
        });
      }
      res.status(200).json(deletedAttribute);
    }
  })
);

router.patch(
  "/skills/attribute/:standardizedName",
  handle_errors(async (req, res) => {
    try{
      const { standardizedName } = req.params;
      const attribute = req.body;

      const updatedAttribute = await withTransaction(async (tx) => {
        const existingStandardizedNameForCanonicalName = await getStandardizedNameByCanonicalNameIfExists(tx, attribute.canonicalName);
        if (existingStandardizedNameForCanonicalName && existingStandardizedNameForCanonicalName !== standardizedName) {
          return await attributeLogic.handleAttributeMerge(tx, standardizedName, existingStandardizedNameForCanonicalName);
        } else {
          return await attributeLogic.updateAttribute(
            tx,
            standardizedName,
            attribute
          );
        }

      });

      if (isError(updatedAttribute)) {
        res.status(404).json(updatedAttribute);
      } else {
        res.status(200).send(updatedAttribute);
      }
    } catch(error){
      res.status(500).json({ message: error.message });
    }
  })
);

router.get('/skills/staff-bio', async (req, res) => {
  try {
    const userGroups = await getUserGroups(res.locals.upn);
    if(!userGroups.some(group => GENERATE_BIO_AD_GROUPS.some(groupName => group.toLowerCase() === groupName.toLowerCase()))){
      res.status(403).json({ message: `${res.locals.upn} does not have access to generate a bio` });
    } else{
      const { staffId } = await getStaffId(req.query.upn);
      const staffAttributes = await getGroupedAttributesByTypesInCanonicalNameFormat(staffId);
      const workExperiences = await workExperienceLogic.readWorkExperienceByStaffId(staffId);
      const staffSpokenLanguages = await staffLogic.retrieveStaffSpokenLanguages(staffId);

      const templateBuffer = await bioLogic.generateStaffBio(staffId, staffAttributes, workExperiences, req.query.bioTemplateId, staffSpokenLanguages, req.query.skillsProfileId)
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename=sample.docx');

      res.send(templateBuffer);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/skills/bio-template', async (req, res) => {
  try {
    const bioTemplates = await bioLogic.getBioTemplatesDetails();
    res.status(200).json(bioTemplates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.delete(
  '/skills',
  handle_errors(async (req,res) => {
    try {
      const removedDuplicates = await removeAllDuplicateEdges(client)
      res.status(200).json(removedDuplicates)
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
}))

router.delete(
  "/skills/unratified/available-at/:institutionStandardizedName/:attributeStandardizedName",
  handleErrors(async (
    req: Request<{ institutionStandardizedName: string; attributeStandardizedName: string }>,
    res: Response<BadRequestDetail>
  ) => {
    try {
      const { institutionStandardizedName, attributeStandardizedName } = req.params;
      await institutionLogic.removeOfferedAttributeFromInstitution(institutionStandardizedName, attributeStandardizedName)
      res.status(204).json();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.get(
  '/skills/profile/:upn',
  handle_errors(async (request, response) => {
    try {
      const upn = request.params.upn;
      const staffId = await retrieveStaffId(db, upn);
      const result = await readSkillsProfileForStaffId(staffId);
      response.status(200).json(result);
    } catch (error) {
      response.status(500).json({ message: error.message });
    }
  }))

router.post(
  '/skills/profile/:upn',
  handle_errors(async (request, response) => {
    try {
      if (!MODIFY_BIO_INFORMATION_USERS.includes(response.locals.upn)) {
        response.status(403).json({ message: `${response.locals.upn} does not have access to add skills profiles` });
      } else {
        const upn = request.params.upn;
        const { profile, description } = request.body;
        const staffId = await retrieveStaffId(db, upn);
        const result = await insertSkillsProfileForStaffId(staffId, profile, description);
        response.status(200).json(result);
      }
    } catch (error) {
      response.status(500).json({ message: error.message });
    }
  }));
  
  router.patch('/skills/profile/:upn',
      handle_errors(async (request, response) => {
          try {
            if (!MODIFY_BIO_INFORMATION_USERS.includes(response.locals.upn)) {
              response.status(403).json({ message: `${response.locals.upn} does not have access to update skills profiles` });
            } else {
              const upn = request.params.upn;
              const staffId = await retrieveStaffId(db, upn);
              const { skillsProfilesId, skillsProfile, shortDescription } = request.body;
              await updateSkillsProfileById(skillsProfilesId, staffId, skillsProfile, shortDescription);
              response.status(200).json({ message: `Updated ${skillsProfilesId}` });
            }
          } catch (error) {
              let errorMessage = error.message;
              if (error.causedBy) {
                  errorMessage = `${errorMessage}: caused by (${error.causedBy})`;
              }
              response.status(500).send(errorMessage);
          }
      })
  );

router.patch(
  "/institutions/:standardizedName",
  handleErrors(async (
    req: Request<{ standardizedName: string }>, 
    res: Response<Institution | BadRequestDetail>
  ) => {
    try {
      const { standardizedName } = req.params;
      const institution = req.body;

      const validateInstitution = institutionLogic.isValidInstitutionUpdate(institution);
      if(validateInstitution){
        res.status(400).json(validateInstitution);
      } else {
        const updatedInstitution = await withTransaction(async (tx) => {
          return await institutionLogic.updateInstitution(tx, standardizedName, institution);
        });

        if ( isError(updatedInstitution) ) {
          res.status(400).json(updatedInstitution);
        } else {
          res.status(200).json(updatedInstitution);
        }
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.put(
  "/skills/canonical-names",
  handleErrors(async (
    _, 
    res: Response<CanonicalNameUpdateCounts | BadRequestDetail>
  ) => {
    try {
      const guidsAndStandardizedNames = await retrieveStandardizedNameAndGuid(client);

      const results = await withTransaction(async (tx) => {
        return await canonicalNamesLogic.updateCanonicalNameGuidsByStandardizedNames(tx, guidsAndStandardizedNames);
      })
      res.status(200).json(results);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.get('/skills/proofValidation',
  handle_errors(async (request, response) => {
    try {
      const pageIndex = parseInt(request.query.startIndex as string) || 0;
      const pageSize = parseInt(request.query.pageLength as string) || 10;
      const sortedColumn = request.query.sortedColumn ? request.query.sortedColumn : 'staffId';
      const sortDirection = request.query.sortOrder ? request.query.sortOrder : 'ASC';
      const staffNameSearchText = request.query.searchText;
      const pendingProofValidations = await userLogic.retrievePendingProofValidations();
      const uniqueStaffIds = [...new Set(pendingProofValidations.map(p => p.staffId))];

      const staffDetails = await getAllStaffDetailsByStaffIds(
        db,
        uniqueStaffIds,
        true,
        pageIndex,
        pageSize,
        sortedColumn,
        sortDirection,
        staffNameSearchText
      );

      const pendingValidationMap = new Map(pendingProofValidations.map(v => [v.staffId, v]));

      const pendingProofValidationWithStaffDetails: PendingProofValidation[] = staffDetails.map(s => {

        const pendingValidation = pendingValidationMap.get(s.staffId);
        return {
          staffId: s.staffId,
          staffName: s.displayName ?? "",
          staffEmail: s.upn ?? "",
          qualification: pendingValidation?.qualification ?? "",
          proofFile: pendingValidation?.proofFile ?? "",
          guidOfEdgeRequiringValidation : pendingValidation?.guidOfEdgeRequiringValidation  ?? "",
        };
      });

      response.status(200).json({
        data: pendingProofValidationWithStaffDetails,
        totalCount: pendingProofValidations.length
      });

    } catch (error) {
      let errorMessage = error.message;
      if (error.causedBy) {
        errorMessage = `${errorMessage}: caused by (${error.causedBy})`;
      }
      response.status(500).send(errorMessage);
    }
  })
);

router.patch(
 '/skills/proofValidation/:edgeId',
  handleErrors(async (
    req: Request<{edgeId: Guid}>, 
    res: Response<boolean | BadRequestDetail>
  ) => {
    try {
      const qualificationHasEdgeGuid = req.params.edgeId;
      const updateValueForApproval = res.locals.upn;
      const proofValidationResponse = await userLogic.updateUserProofValidation(qualificationHasEdgeGuid, updateValueForApproval);
      if (isError(proofValidationResponse)){
        res.status(400).json(proofValidationResponse);
      } else {
        res.status(204).send();
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

router.delete(
 '/skills/proofValidation/:edgeId',
  handleErrors(async (
    req: Request<{ edgeId: Guid }, undefined, undefined, { displayName: string; staffUpn: string; rejectedProof: string; rejectedProofFileName: string }>,
    res: Response<boolean | BadRequestDetail>
  ) => {
    try {
      const loggedInUser = res.locals.upn
      const guidOfEdgeRequiringValidation = req.params.edgeId;
      const updateValueForRejecting = parseIfSetElseDefault("SKILL_FILE_DEFAULT", "NoFile");
      const proofValidationResponse = await userLogic.rejectUploadedProofFile(guidOfEdgeRequiringValidation, loggedInUser, updateValueForRejecting);
      if (isError(proofValidationResponse)){
        res.status(400).json(proofValidationResponse);
      } else {
        const {displayName, staffUpn, rejectedProof, rejectedProofFileName} = req.query
        await queue.enqueue("proof-rejection-email-queue", {
          displayName: displayName, 
          staffUpn: staffUpn,
          rejectedProof: rejectedProof})
        await deleteBlob(UPLOADS_CONTAINER_NAME, rejectedProofFileName)
        res.status(204).send()
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

module.exports = router;
