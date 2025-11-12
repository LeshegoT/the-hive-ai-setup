/** @format */
const { client } = require("../shared/skills-db-connection");
const { formatKeysToCamelCase, listToCamelCase } = require("../shared/field-fix-case");
const { getStandardNameByCanonicalNameIfExists } = require("./skills.queries");
const getInstitutions = async (standardizedName) => {
  const query = `
      g.V()
        .has('attribute','identifier', within([standardizedName]))
        .out('available-at')
        .values('identifier')
        .dedup()
    `;
  const resultPromise = client.submit(query, { standardizedName });
  const result = await resultPromise;
  return result._items;
};

const getUsersQualificationsByCount = async (staffId, limit) => {
  const query = `
    g.V().has('person', 'identifier', staffId)
      .outE('has')
      .where(inV().repeat(out()).emit().has('identifier', 'qualification'))
      .order().by('dateOfGraduation', decr)
      .project('name', 'year')
        .by(inV().values('identifier'))
        .by(values('dateOfGraduation'))
      .limit(limit)
    `;
  const input = {
    staffId,
    limit,
  };
  return (await client.submit(query, input))._items;
};

const getUserAttributes = async (staffId) => {
  const query = `
    g.V()
      .has('person', 'identifier', staffId)
      .outE('has')
      .project('edgeId', 'id', 'attribute', 'attributeType', 'attributesDetails')
        .by(id())
        .by(inV().id())
        .by(inV().values('identifier'))
            .by(inV().repeat(out())
            .until(hasLabel('topLevelTag').and().outE('has-field'))
            .values('identifier')
            .dedup()
          )
        .by(valueMap())
  `;
  const input = {
    staffId: staffId,
  };
  const resultPromise = client.submit(query, input);
  const result = await resultPromise;
  return formatKeysToCamelCase(result._items);
};

const getUserAttribute = async (staffId, attributeId) => {
  const query = `
    g.V()
      .has('person', 'identifier', staffId)
      .outE('has')
      .where(inV().hasId(attributeId))
      .project('edgeId', 'id', 'attribute', 'attributeType', 'attributesDetails')
        .by(id())
        .by(inV().id())
        .by(inV().values('identifier'))
            .by(inV().repeat(out())
            .until(hasLabel('topLevelTag').and().outE('has-field'))
            .values('identifier')
            .dedup()
          )
        .by(valueMap())
  `;
  const input = {
    staffId: staffId,
    attributeId: attributeId,
  };
  const resultPromise = client.submit(query, input);
  const result = await resultPromise;
  return formatKeysToCamelCase(result._items);
};

const getRequiredFields = async (attributeId) => {
  const query = `
    g.V(attributeId)
      .repeat(out()).until(hasLabel('field'))
      .dedup()
      .values('identifier').fold()
  `;
  const obj = {
    attributeId,
  };
  const resultPromise = client.submit(query, obj);
  const result = await resultPromise;
  return listToCamelCase(result._items[0]);
};

async function doesVertexExist(type, name) {
  const query = `
    g.V().has(type, 'identifier', name)
  `;
  const obj = {
    type,
    name,
  };
  const resultPromise = client.submit(query, obj);
  const result = await resultPromise;
  return result._items.length > 0;
}

async function addVertex(type, name) {
  const query = `
    g.addV(type).property('identifier', name)
  `;
  const obj = {
    type,
    name,
  };
  return (await client.submit(query, obj))._items[0];
}

async function dropEdgeIfExists(from, to) {
  const query = `
    g.V().has(fromType, 'identifier', fromName)
      .outE()
      .where(inV().has(toType, 'identifier', toName))
      .drop()
  `;
  const input = {
    fromType: from.type,
    fromName: from.name,
    toType: to.type,
    toName: to.name,
  };
  await client.submit(query, input);
}

async function getTopLevelTags() {
  const query = `
    g.V().hasLabel('topLevelTag').outE('has-field')
      .outV()
      .values('identifier')
      .dedup()
  `;
  const resultPromise = client.submit(query);
  const result = await resultPromise;
  return result._items;
}

async function removePeopleWithoutAnyAttributes() {
  const query = `
    g.V().hasLabel('person').where(out().count().is(0)).drop()
  `;
  await client.submit(query);
}

async function getGraphDBExport() {
  await removePeopleWithoutAnyAttributes();
  const query = `
  g.V().hasLabel('person')
  .as('person')
  .outE()
  .as('edge')
  .inV()
  .as('attribute')
  .project('staffId', 'edgeProperties', 'attributeName')
  .by(select('person').values('identifier'))
  .by(select('edge').valueMap())
  .by(select('attribute').values('identifier'))
  `;
  const resultPromise = client.submit(query);
  const result = await resultPromise;
  return result._items;
}

async function addEdgeAndPropertiesUsingId(fromId, toId, edgeLabel, edgeProperties) {
  let query = `
    g.V(fromId).addE(edgeLabel).to(g.V(targetVertexId))
  `;
  for (const [key, value] of Object.entries(edgeProperties)) {
    query += `.property('${key}', ${JSON.stringify(value)})`;
  }
  const obj = {
    fromId,
    targetVertexId: toId,
    edgeLabel,
  };

  await client.submit(query, obj);
}

async function addEdge(from, to, edgeName) {
  const query = `
    g.V().has(fromType, 'identifier', fromName).as('1')
      .V().has(toType,'identifier',toName).as('2')
      .addE(edgeName).from('1')
  `;
  const obj = {
    fromType: from.type,
    fromName: from.name,
    toType: to.type,
    toName: to.name,
    edgeName,
  };

  await client.submit(query, obj);
}

async function addOrUpdateEdge(from, to, edgeName, property) {
  const query = `
    g.V().has(fromType, 'identifier', fromName)
      .outE(edgeName)
      .where(inV().has(toType, 'identifier', toName))
      .property(propertyName,propertyValue)
  `;
  const obj = {
    fromType: from.type,
    fromName: from.name,
    toType: to.type,
    toName: to.name,
    edgeName,
    propertyName: property.name,
    propertyValue: property.value,
  };

  await client.submit(query, obj);
}

async function getAttribute(standardizedName) {
  const query = `
    g.V()
      .has('attribute', 'identifier', within([standardizedName]))
      .as('attribute')
      .project('attribute', 'type', 'tags', 'fields')
        .by(values('identifier'))
        .by(
          repeat(out())
            .until(hasLabel('topLevelTag').and().outE('has-field'))
            .values('identifier')
        )
        .by(
          repeat(out('is-a'))
            .until(hasLabel('tag').and().not(outE('has-field')))
            .values('identifier')
            .dedup()
            .fold()
        )
        .by(
          repeat(out())
            .emit()
            .out('has-field')
            .hasLabel('field')
            .values('identifier')
            .dedup()
            .fold()
        )
  `;
  const [result] = await client.submit(query, { standardizedName });
  result.fields = listToCamelCase(result.fields);
  return result;
}

async function getFieldsBaseOnTopLevelTags(topLevelTag) {
  topLevelTag = topLevelTag.replace(" ", "");
  const query = `
    g.V()
      .has('topLevelTag', 'identifier', topLevelTag)
      .as('topLevelTag')
      .project('topLevelTag', 'fields')
        .by(values('identifier'))
        .by(
          repeat(out())
            .emit()
            .hasLabel('field')
            .values('identifier')
            .dedup()
            .fold()
        )
  `;
  const input = {
    topLevelTag,
  };
  const resultPromise = client.submit(query, input);
  const [result] = await resultPromise;
  result.fields = listToCamelCase(result.fields);
  return result;
}

async function getAllAttributes(staffId, canonicalAndStandardizedNames) {
  const query = `
  g.V().has('attribute', 'identifier', within(canonicalAndStandardizedNames))
    .as('attribute')
    .project('id' ,'attribute', 'type', 'achieved', 'metaDataTags')
    .by(id())
    .by(values('identifier'))
    .by(
      repeat(out()).until(hasLabel('topLevelTag').and().outE('has-field')).values('identifier').dedup().fold()
    )
    .by(
      choose(
        inE('has').outV().has('person', 'identifier', staffId),
        constant(true),
        constant(false)
      )
    )
    .by(
      repeat(out()).until(hasLabel('metaDataTag')).values('identifier').dedup().fold()
    )
  `;
  const input = {
    staffId: staffId,
    canonicalAndStandardizedNames: canonicalAndStandardizedNames,
  };
  return (await client.submit(query, input))._items;
}

async function editUserAttribute(staffId, field, edgeId) {
  const query = `
  g.V().has('person', 'identifier', staffId)
    .outE('has').where(inV().hasLabel('attribute'))
    .hasId(edgeId)
    .property(fieldName, fieldValue)
  `;
  const input = {
    staffId: staffId,
    fieldName: field.name,
    fieldValue: field.value,
    edgeId: edgeId,
  };
  await client.submit(query, input);
}

async function getInstitutionsByAttributeType(attributeType) {
  const query = `
    g.V().has('identifier', attributeType)
      .repeat(inE('is-a').outV())
      .until(outE('available-at'))
      .outE('available-at')
      .inV()
      .values('identifier')
      .dedup()
  `;
  const input = {
    attributeType: attributeType,
  };

  return (await client.submit(query, input))._items;
}

async function doesAttributeExist(attribute, attributeType) {
  const query = `
     g.V().has('attribute', 'identifier', attribute)
      .or(
        out().has('new', 'identifier', newAttributeType),
        repeat(out()).until(has('topLevelTag', 'identifier', attributeType))
      )
  `;
  const input = {
    attribute: attribute,
    newAttributeType: `New${attributeType}`,
    attributeType: attributeType,
  };
  return (await client.submit(query, input))._items.length > 0;
}

async function addNewEdge(attribute, newVertex, edgeName) {
  const query = `
    g.V().has(fromType, 'identifier', fromName).not(bothE()).as('1')
      .V().has(toType, 'identifier', toName).as('2')
      .addE(edgeName).from('1')
  `;

  const obj = {
    fromType: attribute.type,
    fromName: attribute.name,
    toType: newVertex.type,
    toName: newVertex.name,
    edgeName,
  };

  await client.submit(query, obj);
}

async function linkPersonToAttribute(attributeId, staffId) {
  const query = `
    g.V().hasLabel('attribute')
      .hasId(attributeId)
      .as('attribute')
      .V().has('person', 'identifier', staffId)
      .addE('has').to('attribute')
      .property('addedAt', addedAt)
      .id()
  `;
  const currentDate = new Date();
  const input = {
    attributeId: attributeId,
    staffId: staffId,
    addedAt: currentDate.toISOString(),
  };
  const [result] = (await client.submit(query, input))._items;
  return result;
}

async function getUserAttributeEdgeId(attributeId, staffId) {
  const query = `
    g.V().has('person', 'identifier', staffId).
      outE('has').where(inV()
        .hasLabel('attribute')
        .hasId(attributeId)
      )
      .id()
  `;

  const input = {
    attributeId: attributeId,
    staffId: staffId,
  };
  const [result] = (await client.submit(query, input))._items;
  return result;
}

async function updateUserToAttributeEdge(attributeId, staffId, fieldsMap, edgeId) {
  let query = `
    g.V().has('person', 'identifier', staffId).
      outE('has').where(inV()
        .hasLabel('attribute')
        .hasId(attributeId)
      )
      .hasId(edgeId)
  `;
  const input = {
    attributeId: attributeId,
    staffId: staffId,
    edgeId,
  };
  query = await fieldsMapToProperties(fieldsMap, query, input);
  await client.submit(query, input);
}

async function fieldsMapToProperties(fieldsMap, query, input) {
  for (const field of fieldsMap) {
    query += `.property('${field.name}', ${field.name})`;
    if (field.name === "obtainedFrom") {
      input[field.name] = await getStandardNameByCanonicalNameIfExists(field.value);
    } else {
      input[field.name] = field.value;
    }
  }
  return query;
}

async function doesEdgeExistForId(attributeId, institution) {
  const query = `
    g.V(attributeId).out('available-at')
      .has('tag', 'identifier', institution)
  `;
  const input = {
    attributeId: attributeId,
    institution: institution,
  };

  return (await client.submit(query, input))._items.length > 0;
}

async function addAttributeToInstitutionById(attributeId, institution) {
  const query = `
    g.V(attributeId).as('1')
      .V().has('tag', 'identifier', institution).as('2')
      .addE('available-at').from('1').to('2')
  `;
  const input = {
    attributeId: attributeId,
    institution: institution,
  };

  await client.submit(query, input);
}

async function getAttributeIdByNameAndType(attribute, attributeType) {
  const query = `
    g.V().has('attribute', 'identifier', attribute)
      .or(
        out().has('new', 'identifier', newAttributeType),
        repeat(out()).until(has('topLevelTag', 'identifier', attributeType))
      ).id()
  `;
  const input = {
    attribute: attribute,
    attributeType: attributeType,
    newAttributeType: `New${attributeType}`,
  };

  return (await client.submit(query, input))._items[0];
}

async function userHasFile(staffId, filePath) {
  const query = `
    g.V()
      .has('person', 'identifier', staffId)
      .outE('has').has('proof', filePath)
  `;
  const input = {
    staffId: staffId,
    filePath: filePath,
  };
  return (await client.submit(query, input))._items.length > 0;
}

async function getAttributesType(attributeId) {
  const query = `
    g.V().hasId(attributeId)
      .repeat(out())
      .until(hasLabel('topLevelTag').and().outE('has-field'))
      .values('identifier')
      .dedup()
      .unfold()
  `;

  const input = {
    attributeId: attributeId,
  };

  return (await client.submit(query, input))._items[0];
}

async function getExistingInstitutionType(name) {
  const query = `
    g.V().has('tag', 'identifier', name)
      .repeat(out())
      .until(hasLabel('topLevelTag').and().outE('has-field'))
      .values('identifier')
      .dedup()
      .unfold()
  `;
  const input = {
    name: name,
  };
  return (await client.submit(query, input))._items[0];
}

async function hasMetadataTag(attributeId, metaDataTag) {
  const query = `
    g.V(attributeId)
      .repeat(out())
      .until(has('metaDataTag', 'identifier', metaDataTag))
      .valueMap(true)
  `;
  const input = {
    attributeId: attributeId,
    metaDataTag: metaDataTag,
  };
  return (await client.submit(query, input))._items.length > 0;
}

/**
 * Retrieves user attribute information based on the provided filters and operators, returning an array of user objects with `staffId` fields.
 * Filters are applied to attributes or attribute types, and Gremlin operators are used to execute the query.
 * @param {Object} filters - An object containing:
 *   - `attributeFilters`: An array of objects that define filters for attributes. Each object contains:
 *     - `attribute`: The attribute to filter on.
 *     - `fieldFilters`: An array of conditions for filtering attribute fields (e.g., `between`, `after`, `less-than`).
 *   - `attributeTypeFilters`: An array of objects that define filters for attribute types. Each object contains:
 *     - `attributeType`: The type of attribute to filter on.
 *     - `fieldFilters`: An array of conditions for filtering attribute type fields (e.g., `before`).
 * @param {Array<Object>} filterOperators - An array of objects that maps field names and comparison types to their corresponding Gremlin operators for filtering.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of objects, where each object contains:
 *   - `attribute` (string): The name of the attribute.
 *   - `staffId` (number): The identifier of the staff member.
 *   - `userExperience` (Object): An object containing details about the user's experience with the attribute. The properties within `userExperience` vary depending on the attribute type and may include:
 *     - **For skills or industry knowledge:**
 *       - `lastUsed` (string): The last time the skill or industry was used (e.g., 'current', '2024-10').
 *       - `yearsExperience` (number): The number of years of experience.
 *       - `industryKnowledgeLevel` (number): The level of industry knowledge.
 *     - **For certifications:**
 *       - `expiryDate` (string): The expiration date of the certification.
 *       - `achievedDate` (string): The date the certification was achieved.
 *       - `obtainedFrom` (string): The issuing organization of the certification.
 *       - `proof` (string) (optional): Evidence of the certification (e.g., 'NoFile').
 *     - **For qualifications:**
 *       - `dateOfGraduation` (string): The graduation date.
 *       - `obtainedFrom` (string): The institution where the qualification was obtained.
 *       - `proof` (string): Evidence of the qualification (e.g., 'NoFile').
 * * Example output:
 *  [
 *   {
 *     "attribute": "Compliance",
 *     "staffId": 139910,
 *     "userExperience": {
 *       "lastUsed": "current",
 *       "yearsExperience": 2,
 *       "industryKnowledgeLevel": 2
 *     }
 *   }
 *  ]
 */
async function getUsersAttributeInformation(filters, filterOperators, staffIdsToIncludeInSearchResults, pagination) {
  if (staffIdsToIncludeInSearchResults.length === 0) {
    return [];
  } else {
  const { fieldFiltersQuery, queryValues } = await buildFilters(filters, filterOperators);
  const { startIndex, pageLength } = pagination;
  const fromIndex = startIndex * pageLength;
  const toIndex = fromIndex + pageLength;
    const query = `
    g.V().hasLabel('person').has('identifier', within(staffIdsToIncludeInSearchResults)).
        and(${fieldFiltersQuery}).
        order().by(id()).
        range(fromIndex, toIndex).
        union(${fieldFiltersQuery}).dedup().
        project('standardizedName', 'staffId', 'guid', 'fieldValues').
          by(inV().values('identifier')).
          by(outV().values('identifier')).
          by(id()).
          by(
            valueMap()
              .unfold()
              .map(
                project('standardizedName', 'value')
                  .by(select(keys))
                  .by(select(values).unfold())
              )
              .fold()
          )
  `;
  const input = { ...queryValues, staffIdsToIncludeInSearchResults, fromIndex, toIndex };
  return (await client.submit(query, input))._items;
  }
}

async function getUsersAttributeInformationCount(filters, filterOperators, staffIdsToIncludeInSearchResults) {
  const { fieldFiltersQuery, queryValues } = await buildFilters(filters, filterOperators);
  const query = `
    g.V().hasLabel('person').has('identifier', within(staffIdsToIncludeInSearchResults)).
        and(${fieldFiltersQuery}).
        count()
  `;
  const input = { ...queryValues, staffIdsToIncludeInSearchResults };
  return (await client.submit(query, input))._items[0];
}

/**
 * Constructs the field filters query string and corresponding query values based on the provided attribute filters and attribute type filters.
 * Iterates over both `attributeFilters` and `attributeTypeFilters` to generate the query conditions and assigns unique parameter names for each filter.
 *
 * @param {Object} filters - An object containing:
 *   - `attributeFilters`: An array of objects that define filters for attributes. Each object contains:
 *     - `attribute`: The attribute to filter on.
 *     - `fieldFilters`: An array of conditions for filtering attribute fields (e.g., `between`, `after`, `less-than`).
 *   - `attributeTypeFilters`: An array of objects that define filters for attribute types. Each object contains:
 *     - `attributeType`: The type of attribute to filter on.
 *     - `fieldFilters`: An array of conditions for filtering attribute type fields (e.g., `before`).
 * @param {Array<Object>} filterOperators - An array of objects that map field names and comparison operators (e.g., `between`, `less-than`) to their corresponding Gremlin operators.
 * @returns {Object} - An object containing:
 *   - `fieldFiltersQuery`: The string representing the full query constructed based on the filters and operators.
 *   - `queryValues`: An object containing parameterized values used in the query, where each filter value is associated with a unique key (e.g., `filter0Min`, `filter1`, `filter3`).
 * Example queryValues:
 *   {
 *     filter0Min: 0,
 *     filter0Max: 5,
 *     filter1: '2024-11',
 *     filter2: 'Banking',
 *     filter3: 'Certification',
 *     filter4: 'Qualification'
 *   }
 */
async function buildFilters(filters, filterOperators) {
  let fieldFiltersQuery = "";
  const queryValues = {};
  let filterCount = 0;
  for (const filter of Object.values(filters)) {
    const attributeFilters = await buildFiltersForAttributes(
      filter,
      fieldFiltersQuery,
      queryValues,
      filterOperators,
      filterCount,
    );
    fieldFiltersQuery = attributeFilters.fieldFiltersQuery;
    filterCount = attributeFilters.filterCount;
  }
  return { fieldFiltersQuery, queryValues };
}

/**
 * Updates the field filters query to locate the appropriate attribute or attribute type based on the provided attribute filter.
 * Constructs the necessary query condition using Gremlin steps and updates the query values with a unique parameter name for each attribute or attribute type.
 *
 * @param {Object} attributeFilter - The object specifying the attribute or attributeType to be used in the query. It either contains:
 *   - `attribute`: The specific attribute to filter (e.g., "Banking") or `attributeType`: The type of attribute to filter (e.g., "Certification", "Qualification").
 * @param {string} fieldFiltersQuery - The current query string representing the field filters, to be appended with new conditions for attributes or attribute types.
 * @param {Object} queryValues - The object storing query parameters and their corresponding values, updated with the new attribute filter value.
 * @param {number} filterCount - A counter used to generate unique parameter names for each filter in the query (e.g., `filter0`, `filter1`).
 * @returns {Object} - An object containing:
 *   - `fieldFiltersQuery`: The updated query string with the appended conditions for attributes or attribute types.
 *   - `filterCount`: The updated filter count, ensuring each condition in the query has a unique parameter name.
 */
async function findAttribute(attributeFilter, fieldFiltersQuery, queryValues, filterCount) {
  const filterParam = `filter${filterCount++}`;
  if (attributeFilter.attribute) {
    const attributeName = await getStandardNameByCanonicalNameIfExists(attributeFilter.attribute);
    fieldFiltersQuery += `.where(
                inV().or(
                  repeat(outE('is-related-to').inV()).
                    until(has('attribute', 'identifier', within(${filterParam}))),
                  has('attribute', 'identifier', within(${filterParam})))
              ),`;
    queryValues[filterParam] = [attributeName, attributeFilter.attribute];
  } else if (attributeFilter.attributeType) {
    fieldFiltersQuery += `.where(
                inV().repeat(out()).
                until(has('topLevelTag', 'identifier', ${filterParam}))
              ),`;
    queryValues[filterParam] = attributeFilter.attributeType;
  } else {
    //We use the attribute name or type to find attributes
  }
  return { fieldFiltersQuery, filterCount };
}

/**
 * Adds a condition to the field filters query string and updates the query values object with the specified value.
 * Constructs the query condition by appending a `.has()` clause using the provided field name, operator, and parameter.
 *
 * @param {string} fieldFiltersQuery - The current query string representing the field filters, to be appended with a new condition.
 * @param {Object} queryValues - The object storing query parameters and their corresponding values, updated with the new filter parameter and value.
 * @param {string} fieldName - The name of the field to which the filter condition will be applied (e.g., "yearsExperience").
 * @param {string} operator - The Gremlin operator to be used for the condition (e.g., `gte`, `lte`).
 * @param {string|number} value - The value against which the field will be compared (e.g., a number for `gte` or a date string for `after`).
 * @param {string} filterParam - The name of the parameter to be used in the query and stored in the `queryValues` object (e.g., `filter0Min`).
 * @returns {string} The updated `fieldFiltersQuery` string, with the newly added condition for the field.
 */
function addCondition(fieldFiltersQuery, queryValues, fieldName, operator, value, filterParam) {
  fieldFiltersQuery += `.has('${fieldName}', ${operator}(${filterParam}))`;
  queryValues[filterParam] = value;
  return fieldFiltersQuery;
}

/**
 * Builds and appends the necessary filters for attributes by processing the provided attribute filters and updating the query string and filter count.
 * It iterates over attribute filters, applies corresponding field filters (if any), and ensures that each filter is uniquely named.
 *
 * @param {Array<Object>} attributeFilters - An array of attribute filter objects, where each object contains:
 *   - `attribute` or `attributeType`: The attribute name (e.g., "Banking") or type (e.g., "Qualification") to be filtered.
 *   - `fieldFilters`: (Optional) An array of field filter conditions, where each field filter defines:
 *     - `field`: The field name (e.g., "yearsExperience").
 *     - Conditions such as:
 *       - `between`: An object with `min` and `max` values for range-based filters.
 *       - `after`: A date string for filtering values after a specific date.
 *       - `less-than`: A numeric comparison for filtering values less than a specific number.
 * @param {string} fieldFiltersQuery - The current state of the field filters query string, which is appended with new conditions based on the attribute filters.
 * @param {Object} queryValues - An object holding the current query parameter values, to be updated with new values based on the attribute filters and their fields.
 * @param {Array<Object>} filterOperators - An array mapping field names and comparison types (e.g., `between`, `less-than`) to their corresponding Gremlin operators for constructing the query.
 * @param {number} filterCount - A counter used to ensure unique parameter names for each filter condition in the query.
 * @returns {Object} - An object containing:
 *   - `fieldFiltersQuery`: The updated query string with newly appended conditions for the processed attributes and fields.
 *   - `filterCount`: The updated filter count after processing the filters, ensuring unique parameter names in the query.
 */
async function buildFiltersForAttributes(
  attributeFilters,
  fieldFiltersQuery,
  queryValues,
  filterOperators,
  filterCount,
) {
  for (const attributeFilter of attributeFilters) {
    fieldFiltersQuery += `outE()`;

    if (attributeFilter.fieldFilters) {
      const fieldFilters = await buildFiltersForFields(
        attributeFilter.fieldFilters,
        fieldFiltersQuery,
        queryValues,
        filterOperators,
        filterCount,
      );
      filterCount = fieldFilters.filterCount;
      fieldFiltersQuery = fieldFilters.fieldFiltersQuery;
    } else {
      //There are no fields to validate.
    }

    const attributeQuery = await findAttribute(attributeFilter, fieldFiltersQuery, queryValues, filterCount);
    filterCount = attributeQuery.filterCount;
    fieldFiltersQuery = attributeQuery.fieldFiltersQuery;
  }
  return { fieldFiltersQuery, filterCount };
}

/**
 * Processes each field filter to build the corresponding query and update the query values, ensuring unique parameter names for each filter.
 * Handles different filter types, such as range-based filters (e.g., between `min` and `max`) and direct comparisons (e.g., `gte`, `lte`).
 *
 * @param {Array<Object>} fieldFilters - An array of field filter objects. Each object contains:
 *   - `field`: The name of the field to be filtered (e.g., "yearsExperience", "lastUsed").
 *   - Other properties representing the filter criteria (e.g., `between`, `after`, `less-than`), with the key being the comparison type.
 * @param {string} fieldFiltersQuery - The current query string for filtering fields, which will be appended with new conditions as filters are processed.
 * @param {Object} queryValues - An object holding parameterized values for the query. This will be updated with new values as filters are processed.
 * @param {Array<Object>} filterOperators - An array of objects that map field names and comparison types to corresponding Gremlin operators, where each object contains:
 *   - `fieldName`: The name of the field.
 *   - `skillSearchComparison`: The comparison type (e.g., "between", "after").
 *   - `gremlinComparison`: The Gremlin operator to use (e.g., `gte`, `lte`, `range`).
 * @param {number} filterCount - A counter used to generate unique parameter names for each filter (e.g., `filter0Min`, `filter1`, etc.).
 * @returns {Object} - An object containing:
 *   - `fieldFiltersQuery`: The updated query string after adding all the new filter conditions.
 *   - `filterCount`: The updated filter count after processing the filters, ensuring each filter has a unique parameter name.
 * @throws {Error} - Throws an error if an invalid filter operator is encountered for a field.
 */
async function buildFiltersForFields(fieldFilters, fieldFiltersQuery, queryValues, filterOperators, filterCount) {
  for (const filter of fieldFilters) {
    const filterParam = `filter${filterCount++}`;
    const fieldName = filter.field;
    const filterKey = Object.keys(filter).find((filter) => filter !== "field");
    const filterValue = filter[filterKey];
    const [filterOperator] = filterOperators.filter(
      (filterOperator) =>
        filterOperator.fieldName.toLowerCase() === filter.field.toLowerCase() &&
        filterOperator.skillSearchComparison === filterKey,
    );

    if (
      filterOperator?.gremlinComparison === "range" &&
      filterValue.min !== undefined &&
      filterValue.max !== undefined
    ) {
      fieldFiltersQuery = addCondition(
        fieldFiltersQuery,
        queryValues,
        fieldName,
        "gte",
        filterValue.min,
        `${filterParam}Min`,
      );
      fieldFiltersQuery = addCondition(
        fieldFiltersQuery,
        queryValues,
        fieldName,
        "lte",
        filterValue.max,
        `${filterParam}Max`,
      );
    } else if (filterOperator?.gremlinComparison === "within") {
      const institutions = await Promise.all(
        filterValue.map((institution) => getStandardNameByCanonicalNameIfExists(institution)),
      );
      fieldFiltersQuery = addCondition(
        fieldFiltersQuery,
        queryValues,
        fieldName,
        filterOperator.gremlinComparison,
        institutions,
        filterParam,
      );
    } else if (filterOperator?.gremlinComparison) {
      fieldFiltersQuery = addCondition(
        fieldFiltersQuery,
        queryValues,
        fieldName,
        filterOperator.gremlinComparison,
        filterValue,
        filterParam,
      );
    } else {
      throw new Error(`invalid filter operator for ${fieldName}`);
    }
  }
  return { fieldFiltersQuery, filterCount };
}


async function getNewInstitutions() {
  const query = `
    g.V()
      .where(outE('is-a').inV().has('new', 'identifier', 'new-institution'))
      .project('standardizedName', 'institutionId', 'tag', 'qualifications', 'certifications')
        .by(values('identifier'))
        .by(values('id'))
        .by(outE('is-a').inV().hasLabel('new').values('identifier'))
        .by(inE('available-at').has('needs-ratification', true).outV()
          .where(repeat(out()).until(has('topLevelTag', 'identifier', 'qualification')))
          .project('standardizedName', 'qualificationId', 'needsRatification')
            .by(values('identifier')).by(values('id')).by(constant(true)).fold())
        .by(inE('available-at').has('needs-ratification', true).outV()
          .where(repeat(out()).until(has('topLevelTag', 'identifier', 'certification')))
          .project('standardizedName', 'certificationId', 'needsRatification')
            .by(values('identifier')).by(values('id')).by(constant(true)).fold())
  `;
  return formatKeysToCamelCase((await client.submit(query))._items);
}

async function getAllInstitutions() {
  const query = `
    g.V().hasLabel('tag')
      .where(or(inE('available-at').has('needs-ratification', true), outE('is-a').inV().hasLabel('new')))
      .project('standardizedName', 'institutionId', 'needsRatification', 'qualifications', 'certifications')
        .by(values('identifier'))
        .by(values('id'))
        .by(choose(outE('is-a').inV().hasLabel('new').values('identifier'), constant(true), constant(false)))
        .by(inE('available-at').has('needs-ratification', true).outV()
          .where(repeat(out()).until(has('topLevelTag', 'identifier', 'qualification')))
          .project('standardizedName', 'qualificationId', 'needsRatification')
            .by(values('identifier')).by(values('id')).by(constant(true)).fold())
        .by(inE('available-at').has('needs-ratification', true).outV()
          .where(repeat(out()).until(has('topLevelTag', 'identifier', 'certification')))
          .project('standardizedName', 'certificationId', 'needsRatification')
            .by(values('identifier')).by(values('id')).by(constant(true)).fold())
    `;
  return formatKeysToCamelCase((await client.submit(query))._items);
}

async function getNewQualifications() {
  const query = `
    g.V()
      .where(outE('is-a').inV().has('new', 'identifier', 'new-qualification'))
      .project('standardizedName', 'qualificationId', 'tag', 'institutions')
        .by(values('identifier'))
        .by(values('id'))
        .by(outE('is-a').inV().hasLabel('new').values('identifier'))
        .by(outE('available-at').has('needs-ratification', true).inV()
          .project('standardizedName', 'institutionId', 'needsRatification')
            .by(values('identifier')).by(values('id')).by(constant(true)).fold())
    `;
  return formatKeysToCamelCase((await client.submit(query))._items);
}

async function getAllQualifications() {
  const query = `
    g.V()
      .hasLabel('attribute')
      .where(
        outE('is-a').inV().has('identifier', 'new-qualification')
        .or()
        .outE('is-a').inV().has('topLevelTag', 'identifier', 'qualification')
      )
      .project('standardizedName', 'qualificationId', 'needsRatification', 'institutions')
        .by(values('identifier'))
        .by(values('id'))
        .by(choose(
            outE('is-a').inV().hasLabel('new').values('identifier'),
            constant(true),constant(false)))
        .by(outE('available-at').has('needs-ratification', true).inV()
            .project('standardizedName', 'institutionId', 'needsRatification')
              .by(values('identifier'))
              .by(values('id'))
              .by(constant(true))
            .fold())
      .where(select('institutions').unfold())
    `;

  return formatKeysToCamelCase((await client.submit(query))._items);
}

async function getNewCertifications() {
  const query = `
    g.V()
      .where(outE('is-a').inV().has('new', 'identifier', 'new-certification'))
      .project('standardizedName', 'certificationId', 'tag', 'institutions', 'expires')
        .by(values('identifier'))
        .by(values('id'))
        .by(outE('is-a').inV().hasLabel('new').values('identifier'))
        .by(outE('available-at').has('needs-ratification', true).inV()
          .project('standardizedName', 'institutionId', 'needsRatification')
            .by(values('identifier')).by(values('id')).by(constant(true)).fold())
        .by(choose(outE('need').inV().hasLabel('metaDataTag').values('identifier'), constant(true), constant(false)))
    `;
  return formatKeysToCamelCase((await client.submit(query))._items);
}

async function getAllCertifications() {
  const query = `
    g.V()
      .hasLabel('attribute')
      .where(
        outE('is-a').inV().has('identifier', 'new-certification')
        .or()
        .outE('is-a').inV().has('topLevelTag', 'identifier', 'certification')
      )
      .project('standardizedName', 'certificationId', 'needsRatification', 'institutions', 'expires')
        .by(values('identifier'))
        .by(values('id'))
        .by(choose(
            outE('is-a').inV().hasLabel('new').values('identifier'),
            constant(true),constant(false)))
        .by(outE('available-at').has('needs-ratification', true).inV()
            .project('standardizedName', 'institutionId', 'needsRatification')
              .by(values('identifier'))
              .by(values('id'))
              .by(constant(true))
            .fold())
        .by(choose(outE('need').inV().hasLabel('metaDataTag')
            .values('identifier'), constant(true), constant(false)))
      .where(select('institutions').unfold())
    `;

  return formatKeysToCamelCase((await client.submit(query))._items);
}

async function getNewIndustryKnowledge() {
  const query = `
    g.V()
      .where(outE('is-a').inV().has('new', 'identifier', 'new-industry-knowledge'))
      .project('standardizedName', 'attributeId', 'tag')
        .by(values('identifier'))
        .by(values('id'))
        .by(outE('is-a').inV().hasLabel('new').values('identifier'))
    `;
  return formatKeysToCamelCase((await client.submit(query))._items);
}

async function getNewSkills() {
  const query = `
    g.V()
      .where(outE('is-a').inV().has('new', 'identifier', 'new-skill'))
      .project('standardizedName', 'attributeId', 'tag')
        .by(values('identifier'))
        .by(values('id'))
        .by(outE('is-a').inV().hasLabel('new').values('identifier'))
    `;
  return formatKeysToCamelCase((await client.submit(query))._items);
}

async function getAttributesWithInstitutions(topLevelTag) {
  const query = `
    g.V().hasLabel('attribute')
      .where(repeat(out()).until(has('topLevelTag', 'identifier', topLevelTag)))
      .project('name', 'attributeId', 'institutions')
        .by(values('identifier'))
        .by(values('id'))
        .by(outE('available-at').inV().values('identifier').fold())
    `;
  const input = {
    topLevelTag,
  };
  return formatKeysToCamelCase((await client.submit(query, input))._items);
}

async function getAttributesWithNoInstitutions(topLevelTag) {
  const query = `
    g.V().hasLabel('attribute')
      .where(repeat(out()).until(has('topLevelTag', 'identifier', topLevelTag)))
      .project('standardizedName', 'attributeId')
        .by(values('identifier'))
        .by(values('id'))
    `;
  const input = {
    topLevelTag,
  };
  return formatKeysToCamelCase((await client.submit(query, input))._items);
}

async function removeVertex(vertexId) {
  const query = `
    g.V(vertexId).drop()
  `;
  const input = {
    vertexId: vertexId,
  };
  await client.submit(query, input);
}

async function getAttributeConnectedEdges(attributeId) {
  const query = `
    g.V(attributeId)
      .inE('has')
      .project('staffId', 'userExperience')
        .by(outV().values('identifier'))
        .by(valueMap())
    `;
  const input = {
    attributeId,
  };
  return formatKeysToCamelCase((await client.submit(query, input))._items);
}

async function getVertexConnectedEdges(vertexId) {
  const query = `
    g.V(vertexId)
      .bothE()
      .project('sourceVertexId', 'targetVertexId', 'edgeLabel', 'edgeDetails')
        .by(outV().id())
        .by(inV().id())
        .by(label())
        .by(valueMap())
    `;
  const input = {
    vertexId,
  };
  return formatKeysToCamelCase((await client.submit(query, input))._items);
}

async function getVertexLabelById(vertexId) {
  const query = `
    g.V(vertexId).label()
    `;
  const input = {
    vertexId,
  };
  return formatKeysToCamelCase((await client.submit(query, input))._items[0]);
}

async function getInstitutionConnectedEdges(institutionId) {
  const query = `
   g.V(institutionId)
      .inE()
      .project('attributeId', 'name', 'edges')
        .by(outV().hasLabel('attribute').id())
        .by(outV().hasLabel('attribute').values('identifier'))
        .by(
          outV().hasLabel('attribute')
            .inE('has')
            .project('edgeId', 'person', 'properties')
              .by(id())
              .by(outV().values('identifier'))
              .by(valueMap())
              .fold())
    `;
  const input = {
    institutionId,
  };
  return formatKeysToCamelCase((await client.submit(query, input))._items);
}

async function removeInstitutionConnectedEdges(institution) {
  const query = `
    g.E().has('obtainedFrom', institution).drop()
    `;
  const input = {
    institution,
  };
  await client.submit(query, input);
}

async function getVertexIdentifier(vertexId) {
  const query = `
    g.V(vertexId).values('identifier')
  `;
  const input = { vertexId };
  const result = await client.submit(query, input);
  return result._items[0];
}

const getInstitutionsQualificationAvailableAt = async (qualificationId) => {
  const query = `
      g.V()
        .has('attribute','id', qualificationId)
        .out('available-at')
        .project('name', 'institutionId')
          .by(values('identifier'))
          .by(values('id'))
    `;
  const input = {
    qualificationId,
  };
  const result = await client.submit(query, input);
  return result._items;
};

async function connectCertificationToExpires(certificationId) {
  const query = `
    g.V(certificationId).as('1')
      .V().has('metaDataTag', 'identifier', 'Expires').as('2')
      .addE('need').from('1').to('2')
  `;
  const input = { certificationId };
  await client.submit(query, input);
}

const getInstitutionsCertificationIsAvailableAt = async (certificationId) => {
  const query = `
      g.V()
        .has('attribute','id', certificationId)
        .out('available-at')
        .project('name', 'institutionId')
          .by(values('identifier'))
          .by(values('id'))
    `;
  const input = {
    certificationId,
  };
  const result = await client.submit(query, input);
  return result._items;
};

async function getNewQualities() {
  const query = `
    g.V()
      .where(outE('is-a').inV().has('new', 'identifier', 'new-quality'))
      .project('standardizedName', 'attributeId')
        .by(values('identifier'))
        .by(values('id'))
    `;
  return formatKeysToCamelCase((await client.submit(query))._items);
}

async function getAllQualities() {
  const query = `
    g.V().hasLabel('attribute')
      .where(repeat(out()).until(has('topLevelTag', 'identifier', 'quality')))
      .project('standardizedName', 'attributeId')
        .by(values('identifier'))
        .by(values('id'))
    `;
  return formatKeysToCamelCase((await client.submit(query))._items);
}

async function addEdgeById(fromId, targetVertexId, edgeLabel) {
  const query = `
     g.V(fromId).addE(edgeLabel).to(g.V(targetVertexId))
  `;
  const input = {
    fromId,
    targetVertexId,
    edgeLabel,
  };

  await client.submit(query, input);
}

async function addInstitutionNeedingRatification(attributeId, institutionCanonicalName, institutionStandardizedName) {
  const query = `
    g.V(attributeId).as('1')
    .coalesce(
        __.V().has('tag', 'identifier', institutionCanonicalName),
        __.V().has('tag', 'identifier', institutionStandardizedName)
      ).as('2')
      .addE('available-at').from('1').to('2')
      .property('needs-ratification', true)
  `;
  const input = {
    attributeId,
    institutionCanonicalName,
    institutionStandardizedName,
  };

  await client.submit(query, input);
}

async function isAttributeConnectedToTopLevelTag(attribute, topLevelTag) {
  const query = `
     g.V().has('attribute', 'identifier', attribute)
      .outE()
      .where(inV().has('topLevelTag', 'identifier', topLevelTag))
  `;

  const input = {
    attribute,
    topLevelTag,
  };
  return (await client.submit(query, input))._items.length > 0;
}

async function getUsersConnectedToAttributeForInstitution(attributeId, institutionNames) {
  const query = `
    g.V(attributeId)
      .inE('has')
      .as('edge')
      .where(valueMap().select('obtainedFrom').is(within(institutionNames)))
      .project('staffId', 'userExperience')
        .by(outV().values('identifier'))
        .by(valueMap());
    `;
  const input = {
    attributeId,
    institutionNames,
  };

  return formatKeysToCamelCase((await client.submit(query, input))._items);
}

async function ratifyAttributeAvailableAtInstitution(attributeId, institutionId) {
  const query = `
    g.V().hasId(attributeId)
      .outE('available-at')
      .where(inV().hasId(institutionId))
      .property('needs-ratification', false)
  `;

  const input = {
    attributeId,
    institutionId,
  };
  await client.submit(query, input);
}

async function checkIfAttributeIsNew(attributeId, attributeType) {
  const query = `
    g.V().hasId(attributeId)
      .outE('is-a')
      .inV()
      .has('identifier', newAttributeType)
  `;

  const input = {
    attributeId,
    newAttributeType: `New${attributeType}`,
  };
  return (await client.submit(query, input))._items.length > 0;
}

async function getNewInstitutionId(institution) {
  const query = `
    g.V().has('identifier', institution)
      .where(outE('is-a')
      .inV().has('identifier', 'new-institution'))
      .id()
  `;

  const input = {
    institution,
  };
  return (await client.submit(query, input))._items[0];
}

async function updateEdgeProperty(field, canonicalAndStandardizedValues, newFieldValue) {
  const query = `
    g.E().has(field, within(canonicalAndStandardizedValues))
      .property(field, newFieldValue)
  `;
  const input = {
    field,
    canonicalAndStandardizedValues,
    newFieldValue,
  };
  await client.submit(query, input);
}

async function getVertexIdByCanonicalAndStandardizedNames(canonicalName, standardizedName) {
  const query = `
    g.V().
      coalesce(
        has('identifier', standardizedName),
        has('identifier', canonicalName)
      ).id()
  `;
  const input = {
    standardizedName,
    canonicalName,
  };
  return (await client.submit(query, input))._items;
}

module.exports = {
  getInstitutions,
  getUserAttributes,
  getRequiredFields,
  getFieldsBaseOnTopLevelTags,
  doesVertexExist,
  addVertex,
  dropEdgeIfExists,
  addEdge,
  addOrUpdateEdge,
  getAttribute,
  getTopLevelTags,
  getAllAttributes,
  editUserAttribute,
  getInstitutionsByAttributeType,
  doesAttributeExist,
  addNewEdge,
  linkPersonToAttribute,
  getUserAttributeEdgeId,
  updateUserToAttributeEdge,
  getUserAttribute,
  doesEdgeExistForId,
  addAttributeToInstitutionById,
  getAttributeIdByNameAndType,
  userHasFile,
  getAttributesType,
  getExistingInstitutionType,
  getUsersAttributeInformation,
  hasMetadataTag,
  getNewInstitutions,
  getAllInstitutions,
  getNewQualifications,
  getNewCertifications,
  getNewIndustryKnowledge,
  getNewSkills,
  getAttributesWithInstitutions,
  getAttributesWithNoInstitutions,
  removeVertex,
  getAttributeConnectedEdges,
  getInstitutionConnectedEdges,
  removeInstitutionConnectedEdges,
  getVertexIdentifier,
  getUsersQualificationsByCount,
  getVertexConnectedEdges,
  getVertexLabelById,
  addEdgeAndPropertiesUsingId,
  getInstitutionsQualificationAvailableAt,
  connectCertificationToExpires,
  getInstitutionsCertificationIsAvailableAt,
  getNewQualities,
  getAllQualities,
  addEdgeById,
  getGraphDBExport,
  addInstitutionNeedingRatification,
  isAttributeConnectedToTopLevelTag,
  getUsersConnectedToAttributeForInstitution,
  ratifyAttributeAvailableAtInstitution,
  checkIfAttributeIsNew,
  getNewInstitutionId,
  getAllQualifications,
  updateEdgeProperty,
  getVertexIdByCanonicalAndStandardizedNames,
  getAllCertifications,
  getUsersAttributeInformationCount,
};
