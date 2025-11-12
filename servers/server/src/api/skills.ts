const { handle_errors } = require('@the-hive/lib-core');
import { isError } from '@the-hive/lib-shared';
import { getEnvironmentName, validateAndParsePagination} from '@the-hive/lib-core';
const {
  getStandardNameByCanonicalNameIfExists,
} = require('../queries/skills.queries');
const {
  getFieldsBaseOnTopLevelTags,
  getTopLevelTags,
  getInstitutionsByAttributeType,
  userHasFile,
  getUsersQualificationsByCount,
} = require('../queries/skills.gremlin.queries');
const {
  transformCanonicalNamesForProperties,
} = require('../shared/skills');
import { getStaffId as retrieveStaffId } from "@the-hive/lib-skills-logic";
const { getStaffId } = require('../queries/staff-overview.queries');
const upload = require('multer')();
import { Router }  from "express";
const router = Router();
const { randomUUID } = require('crypto');

const { uploadFile } = require('../shared/upload-file');
const { downloadBlob } = require('../shared/download-blob');

const CONTAINER_NAME = process.env.SKILLS_UPLOAD_CONTAINER_NAME;
import { NewAttribute, StandardizedName } from "@the-hive/lib-skills-shared";
const { db, withTransaction } = require('../shared/db');
const { client } = require('../shared/skills-db-connection');

import { AttributeLogic, CanonicalNamesLogic, FieldLogic, getSkillsRestrictedWords, InstitutionLogic, UsersLogic } from "@the-hive/lib-skills-logic";
import { JsType, JSTypeScale, UserAttribute } from "@the-hive/lib-skills-shared";
import { getCanonicalNameDetails } from "@the-hive/lib-skills-logic";
import { getExperienceLevelAndDescriptions } from '../queries/skills.queries';
const usersLogic = new UsersLogic(db, client);
const attributeLogic = new AttributeLogic(db, client);
const institutionLogic = new InstitutionLogic(db, client);
const fieldLogic = new FieldLogic(db, client);
const canonicalNamesLogic = new CanonicalNamesLogic(db, client);

router.get(
  "/institutions",
  handle_errors(async (req, res) => {
    try {
      const searchText = req.query.searchText;
      const institutionTypeFilters = req.query.institutionTypes?.split(",");
      const ratified = req.query.ratified === "true" ? true : req.query.ratified === "false" ? false : undefined;
      const attributeOffered = req.query.offers;
      const excludeOffers = req.query.excludeOffers === "true";
      const pagination = validateAndParsePagination(req.query.startIndex, req.query.pageLength);
      if (isError(pagination)) {
        res.status(400).json(pagination);
      } else {
        const institutionSearchResults = await institutionLogic.getInstitutionSearchResults(
          pagination,
          ratified,
          institutionTypeFilters,
          excludeOffers,
          attributeOffered,
          searchText
        );

        res.status(200).json(institutionSearchResults);
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error", detail: error.message });
    }
  }),
);

router.post(
  "/portfolio",
  handle_errors(async (req, res) => {
    try {
      const userAttribute: UserAttribute = req.body;
      const addedAttribute = await withTransaction(async (tx) => {
        return await usersLogic.addUserAttribute(tx,userAttribute,res.locals.upn);
      });
      if (isError(addedAttribute)) {
        res.status(400).json(addedAttribute);
      } else {
        res.status(200).json(addedAttribute);
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error", detail: error.message });
    }
  }),
);

router.get(
  '/qualifications-by-count/:count',
  handle_errors(async (req, res) => {
    try {
      const staffId = await getStaffId(res.locals.upn);
      if (staffId) {
        const amountOfQualification = req.params.count;
        const qualificationsForReviews = await getUsersQualificationsByCount(staffId.staffId, parseInt(amountOfQualification));
        const qualificationsForReviewsWithCanonicalNames = await transformCanonicalNamesForProperties(qualificationsForReviews, 'name');
        res.json(qualificationsForReviewsWithCanonicalNames);
      } else {
        res.status(401).send();
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })
);

router.get(
  '/skills-field',
  handle_errors(async (req, res) => {
    try {
      const fields = await fieldLogic.retrieveSkillField();
      res.status(200).send({fields});
    } catch (error) {
      res.status(500).send(error.message);
    }
  })
);

router.get(
  '/js-type',
  handle_errors(async (req, res) => {
    try {
      const result = await fieldLogic.retrieveJSType();
      const types = Array.from(result, (response :JsType) => ({
        jsTypeId: response.jsTypeId,
        description: response.description,
        javaScriptType: response.javaScriptType,
        displayFormatFunction: response.displayFormatFunction,
        gremlinStringFormatFunction: response.gremlinStringFormatFunction,
        parseFunction: response.parseFunction,
      }));
      res.status(200).send({ types });
    } catch (error) {
      res.status(500).send(error.message);
    }
  })
);

router.get(
  '/js-type-scale',
  handle_errors(async (req, res) => {
    try {
      const result = await fieldLogic.retrieveJSTypeScale();
      const fields = Array.from(result, (response:JSTypeScale) => ({
        jsTypeId: response.jsTypeId,
        rating: response.rating,
        label: response.label,
      }));
      res.status(200).send({ fields });
    } catch (error) {
      res.status(500).send(error.message);
    }
  })
);

router.get(
  '/attachment/:filePath(*)',
  handle_errors(async (req, res) => {
    try {
      let staffId = await getStaffId(res.locals.upn);
      if (staffId) {
        staffId = staffId.staffId;
        const filePath = req.params.filePath;
        if (await userHasFile(staffId, filePath)) {
          const result = await downloadBlob(CONTAINER_NAME, filePath);
          result.readableStreamBody.pipe(res);
        } else {
          res.status(403).send();
        }
      } else {
        res.status(401).send();
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })
);

router.get(
  '/search-exceptions',
  handle_errors(async (_req, res) => {
    try {
      const searchTextExceptions = await canonicalNamesLogic.retrieveSearchTextExceptions();
      res.status(200).json((await attributeLogic.retrieveAttributesForSearchTextExceptions(searchTextExceptions)));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })
);

router.post(
  '/skills-uploads',
  upload.single('file'),
  handle_errors(async (req, res) => {
    const { file } = req;
    try {
      const uuid = randomUUID();
      const indexOfExtensions = file.originalname.lastIndexOf('.');
      const filePath =
        getEnvironmentName(true) +
        '/' +
        uuid +
        file.originalname.substring(indexOfExtensions);
      await uploadFile(file.buffer, filePath, CONTAINER_NAME);
      res.status(200).json({ message: 'File uploaded successfully', filePath });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  })
);

router.get(
  '/fields/:topLevelTag',
  handle_errors(async (req, res) => {
    try {
      const topLevelTag = await getStandardNameByCanonicalNameIfExists(req.params.topLevelTag);
      const fields = await getFieldsBaseOnTopLevelTags(topLevelTag);
      const fieldsWeAreInterestedIn  = {
        ...fields,
        fields: fields.fields.filter((field) => !field.includes('upload'))
      };
      res.status(200).json(fieldsWeAreInterestedIn);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })
);

router.get(
  '/experience-levels-and-descriptions/',
  handle_errors(async (req, res) => {
    try {
      const data = await getExperienceLevelAndDescriptions();
      const descriptionsGroupedByField = data.reduce(
        (result, { fieldName, label, description }) => {
          if (!result[fieldName]) {
            result[fieldName] = {};
          } else {
            // field name already exists on result, don't duplicate
          }

          if (!result[fieldName][label]) {
            result[fieldName][label] = [];
          } else {
            // label for field name already exists, don't duplicate
          }

          result[fieldName][label].push(description);
          return result;
        },
        {}
      );

      res.json(descriptionsGroupedByField);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })
);

router.get(
  '/top-level-tags',
  handle_errors(async (req, res) => {
    try {
      const topLevelTags = await getTopLevelTags();
      const topLevelTagsInCanonicalNameFormat = await Promise.all(
          topLevelTags.map(async (standardizedName:StandardizedName) =>
            await withTransaction(async (tx)=> await getCanonicalNameDetails(tx, standardizedName)
          )
        )
      )
      res.json(topLevelTagsInCanonicalNameFormat);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })
);

router.get(
  '/institutions/old',
  handle_errors(async (req, res) => {
    try {
      const { attributeType } = req.query;
      const attributeTLTInStandardNameForm = await getStandardNameByCanonicalNameIfExists(attributeType);
      const institutions = await getInstitutionsByAttributeType(attributeTLTInStandardNameForm);
      const canonicalInstitutions = await Promise.all(
          institutions.map(async (institution) => await getCanonicalNameDetails(db,institution) || institution)
        )
      res.status(200).json(canonicalInstitutions.filter(institution=>institution.standardizedName && institution.canonicalName));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })
);

router.get(
  '/portfolio',
  handle_errors(async (_req, res) => {
    try {
      const userProfile = await usersLogic.getUserProfile(res.locals.upn);
      if(isError(userProfile)){
        res.status(400).json(userProfile);
      } else {
        res.status(201).json(userProfile);
      }

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  })
);

router.post(
  "/institutions",
  handle_errors(async (req, res) => {
    try{
      const { canonicalName, standardizedName, aliases, attributesOffered } = req.body;
      if(canonicalName){
        // Assume offers doesn't exist
        await withTransaction(async (tx) => {
          const institution = await institutionLogic.addOrUpdateInstitution(tx, canonicalName, standardizedName, aliases, attributesOffered);
          if(isError(institution)){
            res.status(400).json(institution);
          } else {
            res.status(201).json(institution);
          }
        });
      } else {
        res.status(400).json({message: "Canonical name missing", detail: "Canonical name is required to create an institution"});
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.delete(
  "/portfolio/:edgeId",
  handle_errors(async (req, res) => {
    try {
      const removedUserAttribute = await withTransaction(async (tx) => {
        return await usersLogic.removeUserAttribute(tx,res.locals.upn, req.params.edgeId);
      });
      if (isError(removedUserAttribute)) {
        res.status(400).json(removedUserAttribute);
      } else {
        res.status(200).json(removedUserAttribute);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.patch(
  "/portfolio/:guid",
  handle_errors(async (req, res) => {
    try{
      const staffId = await retrieveStaffId(db,res.locals.upn);
      const userAttribute: UserAttribute = req.body;
      if (staffId !== userAttribute.staffId) {
        res.status(401).json({
          message: `You are not allowed to edit a skill on someone else's portfolio`,
        });
      } else {
        withTransaction(async (tx) => {
          const editedUserAttribute = await usersLogic.editUserAttribute(userAttribute);
          if(isError(editedUserAttribute)){
            res.status(400).json(editedUserAttribute);
          } else {
            await usersLogic.updateSkillsLastModifiedForUser(tx,staffId);
            res.status(200).send(editedUserAttribute);
          }
        })
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
);

router.get(
  '/skills-restricted-words',
  handle_errors(async (_req, res) => {
    try {
      const restrictedWords = await getSkillsRestrictedWords(db)
      res.status(200).json(restrictedWords);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  })
);

router.get(
  '/skills/attribute/:standardizedName',
  handle_errors(async (req, res) => {
    try {
      const attribute = await attributeLogic.getAttributeForStandardizedName(req.params.standardizedName)
      if(isError(attribute)){
        res.status(400).json(attribute)
      }
      else{
        res.status(200).send(attribute)
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" ,detail: error.message });
    }
  })
);

router.post(
  "/skills",
  handle_errors(async (req, res) => {
    try {
      const newAttribute: NewAttribute = req.body;
      const errorMessageIfNotValid = attributeLogic.validateAttribute(newAttribute);
      if (errorMessageIfNotValid) {
          res.status(400).json(errorMessageIfNotValid);
      } else {
        const createdAttribute = await withTransaction(async (tx) => {
          return await attributeLogic.addNewAttribute(tx, newAttribute);
        });
        if (isError(createdAttribute)) {
          res.status(400).json(createdAttribute);
        } else {
          res.status(201).json(createdAttribute);
        }
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error", detail: error.message });
    }
  }),
);

router.get(
  '/skills',
  handle_errors(async (req, res) => {
    try {
      const searchText = req.query.searchText;
      const ratified = req.query.ratified === 'true'? true : req.query.ratified === 'false'? false : undefined;
      const attributeTypes = req.query.attributeTypes?.split(",");
      const pagination = validateAndParsePagination(req.query.startIndex, req.query.pageLength);

      if (isError(pagination)) {
        res.status(400).json(pagination);
      } else {
        const attributeSearchResults = await attributeLogic.getAttributeSearchResults(searchText,pagination,attributeTypes,ratified);
        res.status(200).json(attributeSearchResults );
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error", detail: error.message });
    }
  })
);

router.get(
  "/skills/canonical-names/:standardizedName",
  handle_errors(async (req, res) => {
    try{
      const standardizedName = req.params.standardizedName;
      const canonicalNameDetails = await canonicalNamesLogic.retrieveCanonicalNameDetails(standardizedName);
      res.status(200).json(canonicalNameDetails);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }),
);

module.exports = router;
