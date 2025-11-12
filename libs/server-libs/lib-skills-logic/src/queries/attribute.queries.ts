/** @format */
import { fixCase, isOfType } from "@the-hive/lib-core";
import { SqlRequest } from "@the-hive/lib-db";
import { Pagination } from "@the-hive/lib-shared";
import {
  Attribute,
  AttributeType,
  BadRequestDetail,
  BadRequestItem,
  FieldValue,
  Guid,
  NewAttribute,
  RequiredField,
  SkillsEntity,
  StandardizedName,
  AttributeTotals,
  skillPathEdgeLabels,
  MetaDataTags,
  TopLevelTag,
  RatificationSummary,
  AttributeStandardizedNameWithUnratifiedOffers,
} from "@the-hive/lib-skills-shared";
import gremlin from "gremlin";
import { standardizeName } from "./canonical-name.queries";
import { doesStandardizedNameExistInGraph } from "./vertex.queries";
export interface CanonicalGuidAndName {
  canonicalNameGuid: Guid;
  standardizedName: StandardizedName;
}

interface AttributeData {
  canonicalNameGuid: Guid;
  standardizedName: StandardizedName;
  attributeType: AttributeType;
  skillPath: CanonicalGuidAndName[];
  requiredFields: CanonicalGuidAndName[];
  needsRatification: boolean;
  metaDataTags? : MetaDataTags[]
}

export type UserAttributeEdgeDetails = {
  staffId: number,
  fieldValues: Partial<FieldValue>[]
}

export type EdgeProperty = Record<string, string | number | boolean | undefined>;

export type AttributeOutgoingEdgeDetails = {
  edgeName: string,
  targetCanonicalNameGuid: Guid,
  properties: EdgeProperty
}

export type TagWithoutCanonicalNameDetails = {
  canonicalNameGuid: string;
  standardizedName: string;
  needsRatification: boolean;
  isTopLevel: boolean;
};

export async function addMetaDataTagsToAttribute(
  gremlin: gremlin.driver.Client,
  standardizedName: StandardizedName,
  metaDataTags: MetaDataTags[],
): Promise<void> {
  const query = `g.V().has('identifier', standardizedName).as('target')
                .flatMap(
                 __.V().hasLabel('metaDataTag').has('identifier', within(metaDataTags)).as('tag')
                .coalesce(
                 __.select('target').outE('need').where(__.inV().as('tag')),
                __.select('target').addE('need').to('tag')))
                .select('target')
                .valueMap(true)`;
  const input = { standardizedName, metaDataTags }
  await gremlin.submit(query, input);
}

async function getMetaDataTagsForFields(
  gremlin: gremlin.driver.Client,
  fields: StandardizedName[],
): Promise<MetaDataTags[]> {
  const query = `
   g.V().hasLabel('metaDataTag')
  .as('tag')
  .where(inE().outV().hasLabel('attribute'))
  .where(repeat(out())
         .until(has('field', 'identifier', within(fields))))
  .values('identifier')
  `;
  const input = { fields };
  return (await gremlin.submit(query, input))._items;
}

export async function getSkillPathForAttribute(
  gremlin: gremlin.driver.Client,
  attributeId: string,
  edgeLabel: skillPathEdgeLabels,
): Promise<TagWithoutCanonicalNameDetails[]> {
  const query = `g.V(attributeId)
                .repeat(out().simplePath())
                .until(hasLabel('topLevelTag').and().not(has('identifier','institution')))
                .path()
                .unfold()
                .where(__.not(hasLabel('new')))
                .map(
                  project('canonicalNameGuid', 'standardizedName', 'isTopLevel', 'needsRatification')
                    .by(id)
                    .by(values('identifier').limit(1))
                    .by(choose(hasLabel('topLevelTag'), constant(true), constant(false)))
                    .by(
                      choose(
                        or(
                          outE(edgeLabel).hasLabel('new'),
                          outE('available-at').has('needs-ratification', true)
                        ),
                        constant(true),
                        constant(false)
                      )
                    )
                )
                .fold()
`;

  const input = {
    attributeId,
    edgeLabel,
  };
  const resultPromise = gremlin.submit(query, input);
  const result = await resultPromise;
  return result._items[0] || [];
}

export async function retrieveAllTopLevelTags(db: () => Promise<SqlRequest>): Promise<TopLevelTag[]> {
  const query = `
    SELECT c.StandardizedName, c.CanonicalName, ato.AttributeTypeOrder, c.CanonicalNamesId AS canonicalNameId, cc.CanonicalNameCategory
    FROM CanonicalNames c
    INNER JOIN CanonicalNameCategories cc ON cc.CanonicalNameCategoryId = c.CanonicalNameCategoryId
    LEFT JOIN AttributeTypeOrder ato ON ato.AttributeTypeId = c.CanonicalNamesId
    WHERE cc.CanonicalNameCategory = 'topLevelTag'
  `;

  const request = await db();
  const result = await request.timed_query(query, "retrieveAllTopLevelTags");
  return fixCase(result.recordset) as TopLevelTag[];
}

export async function getTopLevelTag(
  canonicalNameGuid: Guid,
  gremlin: gremlin.driver.Client,
): Promise<string | BadRequestDetail> {
  const attributeTopLevelTag = `
    g.V(guid)
      .repeat(__.out())
      .until(__.hasLabel('topLevelTag'))
  `;
  const input = {
    guid: canonicalNameGuid,
  };

  try {
    const result = await gremlin.submit(attributeTopLevelTag, input);
    if (!result || result._items.length === 0) {
      return {
        message: `Failed to get topLevelTag`,
        detail: `${canonicalNameGuid}'s topLevelTag could not be found in the GremlinDB`,
      };
    }
    if (
      result._items[0].properties &&
      result._items[0].properties.identifier &&
      result._items[0].properties.identifier.length > 0
    ) {
      return result._items[0].properties.identifier[0].value;
    } else {
      return {
        message: "Invalid result structure",
        detail: `The expected 'identifier' property was not found for ${canonicalNameGuid}`,
      };
    }
  } catch (error) {
    return {
      message: "Error in querying Gremlin DB",
      detail: error.message,
    };
  }
}

export async function deleteAttributeOrInstitutionFromGraph(
  gremlin: gremlin.driver.Client,
  standardizedName: StandardizedName,
) {
  const query = `
    g.V().hasLabel(within('tag','attribute')).has('identifier',name).drop()
  `;
  const input = {
    name: standardizedName,
  };
  await gremlin.submit(query, input);
}

export async function getRequiredFieldDetails(
  db: () => Promise<SqlRequest>,
  fieldNames: string[],
): Promise<RequiredField[]> {
  const query = `
      SELECT
        sf.SkillsFieldId,
        cn.CanonicalName,
        cn.StandardizedName,
        cn.CanonicalNamesId as CanonicalNameId
      FROM SkillsField sf
      INNER JOIN CanonicalNames cn ON cn.StandardizedName = sf.FieldName
      WHERE cn.StandardizedName IN (SELECT value FROM STRING_SPLIT(@FieldNames, ','))
    `;

  const request = await db();
  const fieldNamesString = fieldNames.join(",");
  const result = await request.input("FieldNames", fieldNamesString).timed_query(query, "requiredFieldDetails");
  return fixCase(result.recordset as RequiredField[]);
}

export async function getSkillRequiredFields(gremlin: gremlin.driver.Client, attributeId: string) {
  const query = `
      g.V(attributeId)
        .repeat(out())
        .emit().until(hasLabel('field'))
        .hasLabel('field')
        .project('canonicalNameGuid', 'name')
          .by(id())
          .by(values('identifier')).dedup()
    `;
  const input = {
    attributeId: attributeId,
  };
  const result = await gremlin.submit(query, input);
  return result._items;
}

export async function getStandardizedNamesForWhatAnInstitutionOffers(
  gremlin: gremlin.driver.Client,
  institutionId: Guid,
): Promise<string[]> {
  const query = `
      g.V(institutionId)
      .inE('available-at')
      .outV()
      .values('identifier')
    `;
  const input = {
    institutionId: institutionId,
  };
  const result = await gremlin.submit(query, input);
  return result._items;
}

export async function isStandardizedNameOfferedByInstitution(
  gremlin: gremlin.driver.Client,
  standardizedName: StandardizedName,
  institutionGuid: Guid,
): Promise<boolean> {
  const query = `
    g.V(institutionGuid)
      .inE('available-at')
      .outV()
      .has('identifier', standardizedName)
  `;
  const input = {
    standardizedName,
    institutionGuid,
  };
  const result = await gremlin.submit(query, input);
  return result._items.length > 0;
}

export async function retrieveStandardizedNamesOfUnratifiedOfferedAttributes(
  gremlin: gremlin.driver.Client,
  pagination: Pagination,
  standardizedNamesOfAttributesToInclude?: StandardizedName[]
): Promise<AttributeStandardizedNameWithUnratifiedOffers[]> {
  const includeFilter = standardizedNamesOfAttributesToInclude && standardizedNamesOfAttributesToInclude.length > 0;
  const filterClause = includeFilter ? ".has('identifier', within(standardizedNamesOfAttributesToInclude))" : "";
  const query = `
  g.V()
    ${filterClause}
    .where(outE().has('needs-ratification', true))
    .order().by('identifier')
    .range(startIndex, endIndex)
    .project('attributeStandardizedName', 'institutionStandardizedNames')
      .by(values('identifier'))
      .by(
        outE().has('needs-ratification', true)
          .inV()
          .values('identifier')
          .fold()
      )
`;
  const input: {
    startIndex: number;
    endIndex: number;
    standardizedNamesOfAttributesToInclude?: StandardizedName[];
  } = {
    startIndex: pagination.startIndex,
    endIndex: pagination.startIndex + pagination.pageLength,
    ...(includeFilter && { standardizedNamesOfAttributesToInclude })
  };
  const result = await gremlin.submit(query, input);
  return result._items;
}

export async function retrieveUnratifiedOfferedAttributesCount(
  gremlin: gremlin.driver.Client,
  standardizedNamesOfAttributesToInclude?: StandardizedName[]
): Promise<number> {
  const includeFilter = standardizedNamesOfAttributesToInclude && standardizedNamesOfAttributesToInclude.length > 0;
  const filterClause = includeFilter ? ".has('identifier', within(standardizedNamesOfAttributesToInclude))" : "";
  const query = `
  g.V()
    ${filterClause}
    .where(outE().has('needs-ratification', true))
    .count()
`;
  const input: { standardizedNamesOfAttributesToInclude?: StandardizedName[] } = includeFilter
    ? { standardizedNamesOfAttributesToInclude }
    : {};
  const result = await gremlin.submit(query, input);
  return result._items[0] || 0;
}

export async function getRequiredFields(
  gremlin: gremlin.driver.Client,
  attributeId: string,
): Promise<{ canonicalNameGuid: string; standardizedName: string }[]> {
  const query = `
    g.V(attributeId)
      .repeat(out())
      .emit().until(hasLabel('field'))
      .hasLabel('field')
      .dedup()
      .project('canonicalNameGuid', 'standardizedName')
        .by(id())
        .by(values('identifier'))
  `;
  const input = {
    attributeId: attributeId,
  };
  const resultPromise = gremlin.submit(query, input);
  const result = await resultPromise;
  return result._items;
}

export async function getSkillsFieldId(
  db: () => Promise<SqlRequest>,
  fieldName: string,
): Promise<{ skillsFieldId: number }> {
  const query = `
    SELECT SkillsFieldId
    FROM SkillsField
    WHERE FieldName = @FieldName
  `;
  const request = await db();
  const result = await request.input("FieldName", fieldName).timed_query(query, "getSkillsFieldId");
  return fixCase(result.recordset)[0] as { skillsFieldId: number };
}

export async function getUnratifiedTotals(gremlin: gremlin.driver.Client): Promise<RatificationSummary[]> {
  const query = `
    g.V()
      .hasLabel('new')
      .project('standardizedName', 'count')
        .by('identifier')
        .by(inE('is-a').count())

  `;
  const resultPromise = gremlin.submit(query);
  const result = await resultPromise;
  return result._items;
}

export async function retrieveUnratifiedAvailableAtTotal(gremlin: gremlin.driver.Client): Promise<RatificationSummary[]> {
  const query = `
     g.V().hasLabel('attribute')    
     .where(outE().has('needs-ratification', true))     
     .count().
      project('standardizedName','count').
        by(constant('available-at')).
        by()
  `

  const result = await gremlin.submit(query);
  return result._items;
}

export async function retrieveUnratifiedSkills(
  client: gremlin.driver.Client,
  topLevelTag: StandardizedName,
  pagination: Pagination,
  standardizedNamesOfSkillsToInclude?: StandardizedName[]
): Promise<StandardizedName[]> {
  const standardizedNameFilterQuery = ".has('identifier', within(standardizedNamesOfSkillsToInclude))"
  const includeStandardizedNameFilter = standardizedNamesOfSkillsToInclude && standardizedNamesOfSkillsToInclude.length > 0;

  const query = `
    g.V()
    ${includeStandardizedNameFilter ? standardizedNameFilterQuery : ''}
    .where(
      outE('is-a').inV()
        .and(
          hasLabel('new'),
          outE('is-a').inV().has('identifier', topLevelTag)
        )
    )
    .order().by('identifier')
    .range(startIndex, endIndex)
    .values('identifier')
  `;
  const input = {
    topLevelTag,
    startIndex: pagination.startIndex,
    endIndex: pagination.startIndex + pagination.pageLength,
    ...(standardizedNamesOfSkillsToInclude && standardizedNamesOfSkillsToInclude.length > 0 && { standardizedNamesOfSkillsToInclude })
  };
  const result = await client.submit(query, input);
  return result._items;
}

export async function retrieveUnratifiedSkillsCount(
  client: gremlin.driver.Client,
  topLevelTag: StandardizedName,
  standardizedNamesOfSkillsToInclude?: StandardizedName[]
): Promise<number> {
  const includeStandardizedNameFilter = standardizedNamesOfSkillsToInclude && standardizedNamesOfSkillsToInclude.length > 0;

  const query = `
    g.V()
    ${includeStandardizedNameFilter ? ".has('identifier', within(standardizedNamesOfSkillsToInclude))" : ''}
    .where(
      outE('is-a').inV()
        .and(
          hasLabel('new'),
          outE('is-a').inV().has('identifier', topLevelTag)
        )
    )
    .count()
  `;
  
  const input = {
    topLevelTag,
    ...(includeStandardizedNameFilter && { standardizedNamesOfSkillsToInclude })
  };
  
  const result = await client.submit(query, input);
  return result._items[0];
}

export async function retrieveCanonicalNameByStandardizedNameIfExists(
  db: () => Promise<SqlRequest>,
  standardizedName: StandardizedName,
): Promise<string> {
  const query = `
  SELECT CanonicalName as canonicalName
  FROM CanonicalNames
  WHERE StandardizedName = @StandardizedName
  `;
  const request = await db();
  const results = await request
    .input("StandardizedName", standardizedName)
    .timed_query(query, "retrieveCanonicalNameByStandardizedNameIfExists");
  return (results.recordset as { canonicalName: string }[])[0]?.canonicalName || standardizedName;
}

export async function retrieveAttributeTotals(
  gremlin: gremlin.driver.Client,
  staffIds: number[],
): Promise<AttributeTotals> {
  if (staffIds.length > 0) {
    const query = `
      g.V().hasLabel('topLevelTag')
      .where(outE('has-field'))
      .group()
      .by('identifier')
      .by(
        __.coalesce(
          __.repeat(__.in()).until(__.hasLabel('attribute'))
            .where(__.in('has').has('identifier', within(staffIds)))
            .count(),
          __.constant(0)
        )
      )
    `;

    const input = {
      staffIds,
    };

    const result = (await gremlin.submit(query, input))._items[0];
    return {
      skill: result["skill"],
      certification: result["certification"],
      qualification: result["qualification"],
      quality: result["quality"],
      industryKnowledge: result["industry-knowledge"],
    };
  } else {
    return {
      skill: 0,
      certification: 0,
      qualification: 0,
      quality: 0,
      industryKnowledge: 0,
    };
  }
}

export async function deleteEdgeByGuid(gremlin: gremlin.driver.Client, edgeId: Guid) {
  const query = `
    g.E(edgeId).drop()
  `;
  const input = {
    edgeId,
  };

  await gremlin.submit(query, input);
}

export async function doesAttributeExistInCanonicalNamesTable(db: () => Promise<SqlRequest>, standardizedName: string) {
  const query = `SELECT CanonicalNamesId, CanonicalName, StandardizedName FROM CanonicalNames WHERE StandardizedName = @StandardizedName`;
  const request = await db();
  const result = await request.input("StandardizedName", standardizedName).timed_query(query, "doesAttributeExist");
  return result.recordset.length > 0;
}

export async function doesAttributeExistInSystem(
  db: () => Promise<SqlRequest>,
  gremlin: gremlin.driver.Client,
  canonicalName: string,
) {
  const standardizedName = await standardizeName(db, canonicalName);
  return {
    existsInGraphDatabase: await doesAttributeExistInCanonicalNamesTable(db, standardizedName),
    existsInCanonicalNames: await doesStandardizedNameExistInGraph(gremlin, standardizedName),
  };
}

export async function getAttributeData(
  gremlin: gremlin.driver.Client,
  standardizedNames: string[],
): Promise<AttributeData[]> {
  const query = `g.V().
      has('attribute', 'identifier', within(standardizedNames)).as('attribute').
      project(
        'canonicalNameGuid',
        'standardizedName',
        'attributeType',
        'skillPath',
        'requiredFields',
        'needsRatification',
        'metaDataTags').
        by(id()).
        by(values('identifier')).
        by(
          repeat(out()).until(hasLabel('topLevelTag').and().outE('has-field')).
          values('identifier')).
        by(
          repeat(out()).
          until(hasLabel('topLevelTag').or().not(outE())).
          path().
          unfold().
          project("canonicalNameGuid", "standardizedName").
          by(id).
          by(values("identifier")).
          fold()).
        by(
          repeat(out()).emit().
          out('has-field').
          hasLabel('field').
          project('canonicalNameGuid', 'standardizedName').
          by(id()).
          by(values('identifier')).fold())
        .by(
          choose(
            outE('is-a').inV().hasLabel('new'),
            constant(true),
            constant(false)
          )
        )
        .by(repeat(out()).until(hasLabel('metaDataTag')).values('identifier').fold()
    )
      `;
  const input = {
    standardizedNames,
  };
  const resultPromise = gremlin.submit(query, input);
  const result = await resultPromise;
  return result._items;
}

export async function getAttributesOrInstitutionsThatNeedsRatification(
  client: gremlin.driver.Client,
): Promise<string[]> {
  const query = `
  g.V()
    .where(
      outE()
        .has('needs-ratification', true)
        .or()
        .outE()
        .inV()
        .hasLabel('new')
    )
    .values('identifier')
`;
  const resultPromise = client.submit(query);
  const result = await resultPromise;
  return result._items;
}

export async function getAllAttributeTypes(client: gremlin.driver.Client): Promise<AttributeType[]> {
  const query = `
  g.V().hasLabel('topLevelTag').outE('has-field')
  .outV()
  .values('identifier')
`;
  const resultPromise = client.submit(query);
  const result = await resultPromise;
  return result._items;
}

export async function addAttributeToGraph(
  gremlin: gremlin.driver.Client,
  attribute: NewAttribute & Omit<SkillsEntity, "canonicalNameGuid">,
): Promise<CanonicalGuidAndName> {

    const query = `
    g.addV('attribute').property('identifier', newAttributeName).as('newAttribute')
     .V().has('identifier', attributeType).as('attributeType')
     .addE('is-a').from('newAttribute').to('attributeType')
     .select('newAttribute')
     .project('canonicalNameGuid', 'standardizedName')
     .by(id)
     .by(values('identifier'))
  `;

  const input = {
    newAttributeName: attribute.standardizedName,
    attributeType: `new-${attribute.attributeType}`,
  };
  const result = await gremlin.submit(query, input);
  const metaDataTagsForFields = await getMetaDataTagsForFields(gremlin, attribute.requiredFields);
  if (metaDataTagsForFields && metaDataTagsForFields.length > 0) {
    await addMetaDataTagsToAttribute(gremlin, attribute.standardizedName, metaDataTagsForFields);
  } else {
    //no metaDataTags for the fields, so we don't need to add them
  }
  return result._items[0];
}

export interface AttributePath {
  canonicalNameGuid: string;
  standardizedName: string;
  needsRatification: boolean;
  isTopLevel: boolean;
}

export async function getAttributeId(client: gremlin.driver.Client, standardizedName: string): Promise<Guid> {
  const query = `
    g.V().has('identifier', standardizedName).id()
  `;

  const input = {
    standardizedName,
  };
  const resultPromise = client.submit(query, input);
  const result = await resultPromise;
  return result._items;
}



export async function getEdgeProperties<T>(client: gremlin.driver.Client, guid: Guid): Promise<T | BadRequestItem>{
  const query = `
    g.E(guid).valueMap()
  `;

  const input = {
    guid,
  };
  const result = await client.submit(query, input);
  const valueToCheck = result._items[0];
  if(isOfType<T>(valueToCheck)){
    return valueToCheck
  } else {
    return `Edge with guid: ${guid} does not have the expected properties`
  }
}

export async function isStandardizedNameAnAttribute(client: gremlin.driver.Client, standardizedName: string): Promise<boolean>{
  const query = `
    g.V()
      .has('identifier', standardizedName)
      .hasLabel('attribute')
  `;

  const input = {
    standardizedName
  };
  const result = await client.submit(query, input);
  return result._items.length > 0;
}

export async function getAttributeOutgoingEdges(
  client: gremlin.driver.Client,
  attribute: Attribute,
): Promise<AttributeOutgoingEdgeDetails[]> {
  const query = `g.V()
    .has("identifier", standardizedName)
    .outE()
    .project("edgeName", "targetCanonicalNameGuid", "properties")
    .by(label())
    .by(inV().values("id"))
    .by(valueMap());
  `;
  const input = {
    standardizedName: attribute.standardizedName,
  };
  return (await client.submit(query, input))._items;
}

export async function addAttributeOutgoingEdgeIfNotExists(
  client: gremlin.driver.Client,
  attributeStandardizedName: string,
  targetCanonicalNameGuid : Guid,
  edgeName: string,
  properties: EdgeProperty[],
) {
  const input = {
    attributeStandardizedName: attributeStandardizedName,
    targetCanonicalNameGuid: targetCanonicalNameGuid,
    edgeName: edgeName,
  };

  let addPropertiesToEdgeQuery = "";
  for (const property of properties) {
    for (const key in property) {
      input[key] = property[key];
      addPropertiesToEdgeQuery += `.property('${key}', ${property[key]})`;
    }
  }

  const query = `
    g.V().has('identifier', attributeStandardizedName).as('attribute')
      .V(targetCanonicalNameGuid).as('vertexToConnectTo')
      .coalesce(
        __.select('attribute').outE(edgeName).where(__.inV().as('vertexToConnectTo')),
        __.select('attribute').addE(edgeName).to(__.select('vertexToConnectTo'))${addPropertiesToEdgeQuery}
      )
  `;
  await client.submit(query, input);
}



export async function updateEdgePropertyForProofRejection(
  gremlin: gremlin.driver.Client,
  edgeId?: string, 
  validatingUser?: string,
  proofPropertyValue?: string,
): Promise<boolean | BadRequestDetail>{
  const query = `g.E('${edgeId}').property('uploadVerifiedBy', '${validatingUser}').property('proof', '${proofPropertyValue}') `;

  try{
    const result = await gremlin.submit(query);
    return result._items.length > 0;
  }catch (error){
    return {
        message: "Gremlin query execution failed",
        detail: error.message,
      };
  }
}
