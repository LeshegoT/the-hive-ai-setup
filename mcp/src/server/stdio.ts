/* @format */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { normalizeError } from "../utils/error";
import { createServer } from "./mcp";

async function main(): Promise<void> {
  const { server } = createServer();

  const transport = new StdioServerTransport();

  try {
    await server.connect(transport);
  } catch (error) {
    normalizeError(error, { includeStack: true });
    process.exitCode = 1;
  }
}

void main();
