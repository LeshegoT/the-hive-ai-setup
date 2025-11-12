import { SqlRequest } from "@the-hive/lib-db";
import gremlin from "gremlin";
import { getEnvironmentName, uploadRaw } from "@the-hive/lib-core";
import { retrieveGraphDBEdgeExport, retrieveGraphDBVertexExport } from "./queries/export.queries";


export class GraphExportLogic {
  db: () => Promise<SqlRequest>;
  gremlin: gremlin.driver.Client;

  constructor(db: () => Promise<SqlRequest>, gremlin: gremlin.driver.Client) {
    this.db = db;
    this.gremlin = gremlin;
  }

  async exportGraphDB(container_name: string, ): Promise<string> {
    const now = new Date();
    const timestamp = now.toISOString();
    const vertexFileName = now.toISOString() + "_vertices.json";
    const edgeFileName = now.toISOString() + "_edges.json";

    const graphDBVertexExport = await retrieveGraphDBVertexExport(this.gremlin);
    const graphDBEdgeExport = await retrieveGraphDBEdgeExport(this.gremlin);

    await this.saveExportToAzure(graphDBVertexExport, container_name, vertexFileName);
    await this.saveExportToAzure(graphDBEdgeExport, container_name, edgeFileName);

    return timestamp;
  }

  async saveExportToAzure(dataToSave: unknown, container_name: string, fileName: string): Promise<void> {
    const data = Buffer.from(JSON.stringify(dataToSave), "utf-8");
    await uploadRaw(data, container_name, "exports/" + getEnvironmentName(true) + "/" + fileName);

  }


}
