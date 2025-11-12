/**@format */
import gremlin from "gremlin";

export async function retrieveGraphDBVertexExport(gremlin: gremlin.driver.Client): Promise<unknown> {
  const query = `
  g.V().map(valueMap(true).unfold().group().by(keys).by(select(values).limit(local,1)))
  `;

  const result = await gremlin.submit(query);
  return result._items;
}

export async function retrieveGraphDBEdgeExport(gremlin: gremlin.driver.Client): Promise<unknown> {
  const query = `
  g.E()
  `;

  const result = await gremlin.submit(query);
  return result._items;
}
