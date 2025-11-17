/* @format */

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { normalizeError } from "../utils/error";
import { createServer } from "./mcp";

async function main(): Promise<void> {
  const { server } = createServer();

  const transport = new StreamableHTTPServerTransport({
    // Optional: customize the server options
    sessionIdGenerator: () => Math.random().toString(36).substring(7),
    enableJsonResponse: true
  });

  try {
    await server.connect(transport);
    console.log("HTTP MCP Server started on http://localhost:3000/mcp");
  } catch (error) {
    normalizeError(error, { includeStack: true });
    process.exitCode = 1;
  }
}

void main();