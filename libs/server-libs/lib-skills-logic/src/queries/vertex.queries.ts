import { DuplicateEdge, FieldValue, Staff, StandardizedName, StandardizedNameAndCanonicalNameGuid, VertexLabel } from "@the-hive/lib-skills-shared";
import gremlin from "gremlin";

export type EdgeWithProperties = {
  identifier: StandardizedName | Staff["staffId"];
  fieldValues: FieldValue[];
  edgeLabel: string;
};

export async function doesStandardizedNameExistInGraph(
  gremlin: gremlin.driver.Client,
  standardizedName: string,
): Promise<boolean> {
  const query = `
    g.V().has('identifier', standardizedName)
  `;
  const result = await gremlin.submit(query, { standardizedName });
  return result._items.length > 0;
}

export async function findStandardizedNamesInGraph(
  gremlin: gremlin.driver.Client,
  standardizedNames: string[],
): Promise<string[]> {
  const query = `
    g.V().has('identifier', within(standardizedNames)).values('identifier')
  `;
  const result = await gremlin.submit(query, { standardizedNames });
  return result._items;
}

export async function getAllVertexNamesExcludingPersons(gremlin: gremlin.driver.Client): Promise<string[]> {
  const query = `
  g.V().not(hasLabel('person')).values('identifier')
  `;

  const result = await gremlin.submit(query);
  return result._items;
}

export async function addVertex(
  gremlin: gremlin.driver.Client,
  vertexType: string,
  vertexName: string,
): Promise<string> {
  const query = `
    g.addV(vertexType).property('identifier', vertexName)
  `;
  const input = {
    vertexType,
    vertexName,
  };

  return (await gremlin.submit(query, input))._items[0].id;
}

export async function removeVertex(gremlin: gremlin.driver.Client, standardizedName: string): Promise<void> {
  const query = `
    g.V().has('identifier', standardizedName).drop()
  `;
  const input = {
    standardizedName: standardizedName,
  };
  await gremlin.submit(query, input);
}

export async function addEdge(
  gremlin: gremlin.driver.Client,
  fromType: VertexLabel,
  fromName: StandardizedName,
  toType: VertexLabel,
  toName: StandardizedName,
  edgeName: EdgeWithProperties["edgeLabel"],
): Promise<void> {
  const query = `
    g.V().has(fromType, 'identifier', fromName).as('1')
      .V().has(toType,'identifier',toName).as('2')
      .addE(edgeName).from('1').to('2')
  `;
  const obj = {
    fromType,
    fromName,
    toType,
    toName,
    edgeName,
  };

  await gremlin.submit(query, obj);
}

export async function removeEdge(
  gremlin: gremlin.driver.Client,
  fromType: VertexLabel,
  fromName: StandardizedName,
  toType: VertexLabel,
  toName: StandardizedName,
): Promise<void> {
  const query = `
    g.V().has(fromType, 'identifier', fromName).outE().where(inV().has(toType, 'identifier', toName)).drop()
  `;
  const obj = {
    fromType,
    fromName,
    toType,
    toName,
  };

  await gremlin.submit(query, obj);
}

export async function isStandardizedNameAnInstitution(client: gremlin.driver.Client, standardizedName: string): Promise<boolean>{
  const query = `
    g.V()
      .has('identifier', standardizedName)
      .repeat(out('is-a'))
      .until(out('is-a').count().is(0))
      .has('identifier', 'institution')
    `;

    const input = {
      standardizedName,
    };
    const result = await client.submit(query, input);
    return result._items.length > 0;
}

export async function retrieveIncomingEdges(
  client: gremlin.driver.Client,
  standardizedName: StandardizedName,
): Promise<EdgeWithProperties[]> {
  const query = `g.V().has('identifier',standardizedName).inE().project('identifier', 'fieldValues','edgeLabel')
                .by(outV().values('identifier'))
                .by(properties().project('standardizedName', 'value').by(key()).by(value()).fold())
                .by(label())`;
  const input = {
    standardizedName,
  };
  const result = await client.submit(query, input);
  return result._items;
}

export async function retrieveOutGoingEdges(
  client: gremlin.driver.Client,
  standardizedName: StandardizedName,
): Promise<EdgeWithProperties[]> {
  const query = `g.V().has('identifier',standardizedName).outE().project('identifier', 'fieldValues','edgeLabel')
                .by(inV().values('identifier'))
                .by(properties().project('standardizedName', 'value').by(key()).by(value()).fold())
                .by(label())`;
  const input = {
    standardizedName,
  };
  const result = await client.submit(query, input);
  return result._items;
}

export async function addEdgeWithProperties(
  client: gremlin.driver.Client,
  to: StandardizedName | Staff["staffId"],
  from: StandardizedName | Staff["staffId"],
  edgeWithProperties: EdgeWithProperties,
) {
  const input = {};
  let addPropertiesToEdgeQuery = "";
  for (let index = 0; index < edgeWithProperties.fieldValues.length; index++) {
    const field = edgeWithProperties.fieldValues[index];
    const propertyName = field.standardizedName;
    const paramKey = `property${index}`;
    
    input[paramKey] = field.value;
    addPropertiesToEdgeQuery += `.property('${propertyName}', ${paramKey})`;
  }
  const query = `g.V().has('identifier',toVertex).addE(edgeLabel).from(g.V().has('identifier',fromVertex))${addPropertiesToEdgeQuery}`;
  await client.submit(query, { ...input, fromVertex: from, toVertex: to, edgeLabel: edgeWithProperties.edgeLabel });
}

export async function retrieveEdgeWithProperties(
  client: gremlin.driver.Client,
  toName: StandardizedName,
  fromName: StandardizedName
):Promise<EdgeWithProperties>{
  const query = 
    `g.V().has('identifier', toName)   
    .inE()   
    .where(outV().has('identifier', fromName))
    .project('identifier', 'fieldValues','edgeLabel')
    .by(outV().values('identifier'))
    .by(properties().project('standardizedName', 'value').by(key()).by(value()).fold())
    .by(label())`;
  const input = {
    fromName,
    toName
  };
  const result = await client.submit(query, input);
  return result._items[0];
}

export async function addIncomingEdges(
  client: gremlin.driver.Client,
  toVertex: StandardizedName,
  edgeWithProperties: EdgeWithProperties[],
) {
  for (const edge of edgeWithProperties) {
    await addEdgeWithProperties(client, toVertex, edge.identifier, edge);
  }
}

export async function addOutGoingEdges(
  client: gremlin.driver.Client,
  fromVertex: StandardizedName,
  edgeWithProperties: EdgeWithProperties[],
) :Promise<void> {
  for (const edge of edgeWithProperties) {
    await addEdgeWithProperties(client, edge.identifier, fromVertex, edge);
  }
}

export async function getVerticesWithLabel(gremlin: gremlin.driver.Client, label: string) :Promise<string[]> {
  const query = `g.V().hasLabel(label).values()`;
  const result = await gremlin.submit(query, { label });
  return result._items;
}

export async function retrieveStandardizedNameAndGuid(gremlin: gremlin.driver.Client ): Promise<StandardizedNameAndCanonicalNameGuid[]> {
  const query = `g.V().not(hasLabel('person')).
                  project('standardizedName','canonicalNameGuid').
                  by('identifier').
                  by(id())`;
  const result = await gremlin.submit(query);
  return result._items;
}

export async function removeEdgesGivenDuplicates(gremlin: gremlin.driver.Client, duplicateEdge:DuplicateEdge): Promise<void>{
  const query = `g.E(guids)
                .range(1,-1)
                .drop()`;
  await gremlin.submit(query, { guids: duplicateEdge.edges });
}

export async function retrieveVerticesWithDuplicateEdges(
  gremlin: gremlin.driver.Client
) :Promise<DuplicateEdge[]>{
  const query = `g.E()
    .hasLabel(without('has'))
    .group()
    .by(
    project('out', 'in')
    .by(outV().values('identifier'))
    .by(inV().values('identifier'))).unfold().where(select(values).count(local).is(gt(1)))
      .project('outV', 'inV', 'edges')
        .by(select(keys).select('out'))
        .by(select(keys).select('in'))
        .by(select(values).unfold().id().fold())`

  const result = await gremlin.submit(query);
  return result._items;
}

export async function removeAllDuplicateEdges(
  gremlin: gremlin.driver.Client
) : Promise<{edgesRemoved: DuplicateEdge[], failedEdgeRemovals: (DuplicateEdge & { errorMessage: string })[]}> {
  const edgesRemoved = []
  const failedEdgeRemovals = []
  const duplicateEdges = await retrieveVerticesWithDuplicateEdges(gremlin);
  for (const duplicateEdge of duplicateEdges){
    try {
      await removeEdgesGivenDuplicates(gremlin, duplicateEdge)
      edgesRemoved.push(duplicateEdge)
    } catch(error) {
      failedEdgeRemovals.push({
        ...duplicateEdge,
        errorMessage: error.message
      });
    }
  }
  return {
    edgesRemoved,
    failedEdgeRemovals
  };
}
