const {
  getCanonicalNames,
  searchThroughCanonicalNames,
  getAliases,
  addCanonicalNameAndCategoryIfNotExists,
  standardizeName,
  getCanonicalNameIdFromCanonicalName,
  updateCanonicalName,
  deleteCanonicalName,
  deleteAliasesForCanonicalName,
  getCanonicalNameByStandardizedNameIfExists,
  getConnectedStaffMemberEmails
} = require('../queries/skills.queries');
const {
  doesVertexExist,
  dropEdgeIfExists,
  addOrUpdateEdge,
  addEdge,
  addVertex,
  doesAttributeExist,
  linkPersonToAttribute,
  getUserAttributeEdgeId,
  updateUserToAttributeEdge,
  addNewEdge,
  doesEdgeExistForId,
  getAttributeIdByNameAndType,
  hasMetadataTag,
  getVertexConnectedEdges,
  getVertexLabelById,
  removeVertex,
  addEdgeAndPropertiesUsingId,
  getVertexIdentifier,
  addInstitutionNeedingRatification,
  getUserAttributes
} = require('../queries/skills.gremlin.queries');
const { listFolder } = require('@the-hive/lib-core');
const { getEnvironmentName } = require('@the-hive/lib-core');
const { groupBy } = require("../shared/mapping");

function handleVertex(type, name) {
  return doesVertexExist(type, name).then((exists) => {
    return exists ? { result: 'Vertex already exists' } : addVertex(type, name);
  });
}

async function handleLink(from, to, edgeName, property) {
  await dropEdgeIfExists(from, to);
  await addEdge(from, to, edgeName);
  await addOrUpdateEdge(from, to, edgeName, property);
}

async function addOrUpdateFieldsForUserAttribute(
  attributeId,
  staffId,
  fields
) {
  let edgeId = await getUserAttributeEdgeId(attributeId, staffId);
  if (!edgeId || (await hasMetadataTag(attributeId, 'Repeatable'))) {
    edgeId = await linkPersonToAttribute(attributeId, staffId);
  } else {
    // Do nothing since the link exist.
  }
  if (edgeId) {
    await updateUserToAttributeEdge(
      attributeId,
      staffId,
      fields,
      edgeId
    );
  } else {
    // Do not add fields to a field that doesnt exist.
  }
}

async function checkForAliasOrCanonicalName(name, canonicalNames, aliases) {
  let output = '';
  if (Object.values(canonicalNames).includes(name)) {
    output = name;
  } else if (aliases.some((alias) => alias.alias === name)) {
    const alias = aliases.find((alias) => alias.alias === name);
    output = canonicalNames[alias.canonicalNamesId];
  } else if (name === 'Unknown') {
    //All "unknowns" are invalid aliases
    output = undefined;
  } else {
    //Alias not found
    output = undefined;
  }
  return output;
}

async function handleRow(row, canonicalNames, aliases) {
  const from = {
    type: row.fromType ? row.fromType : 'person',
    name: row.staffID ? row.staffID : row.from,
  };
  const to = {
    type: row.toType ? row.toType : 'attribute',
    name: row.to,
  };

  if (from.type !== 'person') {
    from.name = await checkForAliasOrCanonicalName(
      from.name,
      canonicalNames,
      aliases
    );
  } else {
    //person names don't have aliases
  }
  to.name = await checkForAliasOrCanonicalName(
    to.name,
    canonicalNames,
    aliases
  );

  if (from.name && to.name) {
    const fromVertex = await handleVertex(from.type, from.name);
    const toVertex = await handleVertex(to.type, to.name);

    for (const [key, value] of Object.entries(row)) {
      const excludedKeys = [
        'staffID',
        'to',
        'fromType',
        'toType',
        'from',
        'relationship',
        'originalLineNumber',
      ];
      if (!excludedKeys.includes(key) && value !== '') {
        const property = {
          name: key,
          value: value,
        };
        const relationship = row.relationship ? row.relationship : 'has';
        await handleLink(from, to, relationship, property);
      }
    }
    return { row, fromVertex, toVertex };
  } else {
    return {
      row,
      message: 'No action required',
      fromName: from.name,
      toName: to.name,
    };
  }
}

async function processFile(fileData) {
  try {
    const canonicalNamesRecordSet = await getCanonicalNames();
    const aliases = await getAliases();

    const canonicalNames = canonicalNamesRecordSet.reduce((acc, item) => {
      acc[item.canonicalNamesId] = item.canonicalName;
      return acc;
    }, {});

    const results = [];

    for (line of fileData) {
      results.push(await handleRow(line, canonicalNames, aliases));
    }
    return results;
  } catch (err) {
    return { error: err };
  }
}

async function getListOfFiles(containerName) {
  const folders = await listFolder(
    containerName,
    getEnvironmentName(true),
    true
  );
  return folders.folders[0].items.blobs.map((file) => file.nameInFolder);
}

async function addNewAttribute(identifier, attributeType) {
  identifier = identifier.replace("'", '');
  const newAttributeName = identifier;
  if (!(await doesAttributeExist(newAttributeName, attributeType))) {
    await addVertex('attribute', newAttributeName);
    const attribute = {
      name: newAttributeName,
      type: 'attribute',
    };
    const newVertex = {
      name: `new-${attributeType}`,
      type: 'new',
    };
    await addNewEdge(attribute, newVertex, 'is-a');
  }
  return {attributeName: newAttributeName , attributeId: (await getAttributeIdByNameAndType(newAttributeName, attributeType))};
}

async function connectEdgesToVertex(edges){
  for(const edge of edges){
    const targetVertexId = edge.targetVertexId;
    const sourceVertexId = edge.sourceVertexId;
    const edgeLabel = edge.edgeLabel;
    const edgeDetails = edge.edgeDetails;
    await addEdgeAndPropertiesUsingId(sourceVertexId, targetVertexId, edgeLabel, edgeDetails);
  }
}

async function updateVertexName(vertexId, updatedName) {
  const connectedEdges = await getVertexConnectedEdges(vertexId);
  const oldLabel = await getVertexLabelById(vertexId);

  const newVertexId = (await addVertex(oldLabel, updatedName))['id'];
  const updatedEdges = connectedEdges.map(edge => ({
    ...edge,
    sourceVertexId: edge.sourceVertexId === vertexId ? newVertexId : edge.sourceVertexId,
    targetVertexId: edge.targetVertexId === vertexId ? newVertexId : edge.targetVertexId
  }));
  await connectEdgesToVertex(updatedEdges);

  await removeVertex(vertexId);
}

async function addNewInstitution(identifier, attributeId) {
  identifier = identifier.replace("'", '');
  let canonicalNameForInstitution = (
    await searchThroughCanonicalNames(identifier, 'Institution')
  )[0]?.canonicalName;

  if(!canonicalNameForInstitution){
    const standardizedName = await standardizeName(identifier);
    await addCanonicalNameAndCategoryIfNotExists(identifier,'Institution', standardizedName)
  }
  else{
    //institution already exists in the sql database, don't duplicate
  }
  canonicalNameForInstitution = canonicalNameForInstitution ? canonicalNameForInstitution : identifier;
  const standardizedName = await standardizeName(canonicalNameForInstitution)
  const institution = {
    name: standardizedName,
    type: 'tag',
  };
  if (!(await doesVertexExist('tag', standardizedName)) && !(await doesVertexExist('tag', canonicalNameForInstitution))) {
    const newVertex = {
      name: 'new-institution',
      type: 'new',
    };
    await addVertex('tag', standardizedName);
    await addEdge(institution, newVertex, 'is-a');
  } else {
    // don't connect it to a new vertex
  }

    if (!(await doesEdgeExistForId(attributeId, standardizedName)) && !(await doesEdgeExistForId(attributeId, canonicalNameForInstitution))) {
      await addInstitutionNeedingRatification(attributeId, canonicalNameForInstitution, standardizedName);
    } else {
      // don't add the edge if it already exists
    }
    return canonicalNameForInstitution;

}

async function removeCanonicalNameAndAliases(vertexId, category) {
  const vertexName = await getVertexIdentifier(vertexId);
  const canonicalName = await getCanonicalNameByStandardizedNameIfExists(vertexName);
  const canonicalNameId = await getCanonicalNameIdFromCanonicalName(canonicalName, category);
  await deleteAliasesForCanonicalName(canonicalNameId);
  await deleteCanonicalName(canonicalNameId);
}

async function transformCanonicalNamesForProperties(attributes, attributeNameKey) {
  return (await Promise.all(
    attributes.map(async (attributeObject) => {
      return {
        ...attributeObject,
        standardizedName: attributeObject[attributeNameKey],
        [attributeNameKey]: await getCanonicalNameByStandardizedNameIfExists(attributeObject[attributeNameKey]),
      };
    })
  ))
}

async function changeCanonicalName(vertexId, updatedName, category) {
  const vertexName = await getVertexIdentifier(vertexId);
  const canonicalName = await getCanonicalNameByStandardizedNameIfExists(vertexName);
  const canonicalNameId = await getCanonicalNameIdFromCanonicalName(canonicalName, category);
  await updateCanonicalName(canonicalNameId, updatedName);
}

async function addCanonicalNameToAttributesOrInstitutions(attributesOrInstitutions) {
  return await Promise.all(
    attributesOrInstitutions.map(async (attributeOrInstitution) => ({
      ...attributeOrInstitution,
      canonicalName: await getCanonicalNameByStandardizedNameIfExists(attributeOrInstitution.standardizedName),
    }))
  );
}


async function replaceStandardizedNamesWithCanonicalNames(institutions) {
  return await Promise.all(
    institutions.map(async (institution) => {
      return {
        ...institution,
        qualifications: await transformCanonicalNamesForProperties(
          institution.qualifications,
          'name'
        ),
        certifications: await transformCanonicalNamesForProperties(
          institution.certifications,
          'name'
        ),
      };
    })
  );
}

async function createStaffDetailsWithEmailsObject(staffDetails) {
  const staffIdList = staffDetails.map(staff => `${staff.staffId}`).join(', ');
  const staffEmails = await getConnectedStaffMemberEmails(staffIdList);

  const staffDetailsWithEmails = staffDetails.map(detail => {
    const emailObj = staffEmails.find(email => email.staffId === detail.staffId);
    return {
      staffId: detail.staffId,
      email: emailObj?.email || 'No email',
      proof: detail.userExperience.proof
    };
  });

  return staffDetailsWithEmails;
}

async function getGroupedAttributesByTypesInCanonicalNameFormat(staffId){
  const userAttributes = await getUserAttributes(staffId);
  const userAttributesWithCanonicalAttributeName = await transformCanonicalNamesForProperties(
    userAttributes,
    "attribute",
  );
  const userAttributesWithCanonicalInstitutionName = await Promise.all(
    userAttributesWithCanonicalAttributeName.map(getCanonicalInstitutionNameForUserAttribute),
  );
  const groupedByAttributeType = groupBy(
    userAttributesWithCanonicalInstitutionName,
    (attribute) => attribute.attributeType,
  );
  const groupedAttributesByTypesInCanonicalNameFormat = Object.fromEntries(
    await Promise.all(
      Object.entries(groupedByAttributeType).map(async ([key, value]) => [
        await getCanonicalNameByStandardizedNameIfExists(key),
        value,
      ]),
    ),
  );
  return groupedAttributesByTypesInCanonicalNameFormat;
}

async function getCanonicalInstitutionNameForUserAttribute(userAttribute) {
  if (userAttribute.attributesDetails.obtainedFrom) {
    userAttribute.attributesDetails.obtainedFrom = await getCanonicalNameByStandardizedNameIfExists(
      userAttribute.attributesDetails.obtainedFrom,
    );
  } else {
    //user attribute does not have institution
  }
  return userAttribute;
}

module.exports = {
  processFile,
  getListOfFiles,
  handleVertex,
  addNewInstitution,
  addNewAttribute,
  handleLink,
  updateVertexName,
  addOrUpdateFieldsForUserAttribute,
  changeCanonicalName,
  removeCanonicalNameAndAliases,
  transformCanonicalNamesForProperties,
  replaceStandardizedNamesWithCanonicalNames,
  createStaffDetailsWithEmailsObject,
  getGroupedAttributesByTypesInCanonicalNameFormat,
  addCanonicalNameToAttributesOrInstitutions
};
