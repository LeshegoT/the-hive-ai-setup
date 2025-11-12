/** @format */
import gremlin from "gremlin";
import { BadRequestDetail, Guid } from "@the-hive/lib-skills-shared";

export async function updateEdgeProperty(
  client: gremlin.driver.Client,
  guid: Guid,
  propertyName: string,
  propertyValue: string,
): Promise<boolean> {
  const query = `
    g.E(guid).property(propertyName, propertyValue)
  `;

  const input = {
    guid,
    propertyName,
    propertyValue,
  };
  const result = await client.submit(query, input);
  return result._items.length > 0;
}

export async function updateEdgeProperties(
  gremlinClient: gremlin.driver.Client,
  edgeId: string,
  propertiesAndValuesForUpdate: Record<string, string | number | boolean | Date>,
): Promise<boolean | BadRequestDetail> {

  if (!edgeId){
    return {
      message: "No EdgeId provided",
      detail: "You must provide an edge id for updating"
    }
  } else if (!propertiesAndValuesForUpdate || Object.keys(propertiesAndValuesForUpdate).length === 0){
    return {
      message: "No Properties provided",
      detail: "You must provide at least one property to update on the edge."
    }
  } else {
    let query = "g.E(edgeId)";
    const bindings: Record<string, string | number | boolean | Date> = { edgeId };
    const keys = Object.keys(propertiesAndValuesForUpdate);

    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      const value = propertiesAndValuesForUpdate[key];
      const keyParam = `key${index}`;
      const valueParam = `value${index}`;
      query += `.property(${keyParam}, ${valueParam})`;
      bindings[keyParam] = key;
      bindings[valueParam] = value;
    }
    try {
      const result = await gremlinClient.submit(query, bindings);
      return result._items.length > 0;
    } catch (error) {
      return {
        message: "Gremlin query execution failed",
        detail: (error as Error).message,
      };
    }
  }
}


