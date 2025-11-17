/* @format */

import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer as createHttpServer } from "node:http";
import { parse as parseUrl } from "node:url";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { normalizeError } from "../utils/error";
import type { GuideServer } from "./mcp";
import { createServer } from "./mcp";

async function handleMcpRequest(
  server: GuideServer["server"],
  req: IncomingMessage,
  res: ServerResponse
) {
  if (!req.url) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Bad Request");
    return;
  }

  const parsedUrl = parseUrl(req.url, true);
  const pathname = parsedUrl.pathname;

  if (req.method !== "POST" || pathname !== "/sse") {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Not found");
    return;
  }

  let rawBody = "";
  req.setEncoding("utf8");

  try {
    await new Promise<void>((resolve, reject) => {
      req.on("data", (chunk) => {
        rawBody += String(chunk);
      });
      req.on("end", () => resolve(undefined));
      req.on("error", (err) => reject(err));
    });
  } catch (error) {
    const normalized = normalizeError(error, { includeStack: true });
    console.error("[sse] request stream error", normalized);

    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Request stream error"
          },
          id: null
        })
      );
    }

    return;
  }

  if (res.writableEnded) {
    return;
  }

  let body: unknown = undefined;

  if (rawBody.length > 0) {
    try {
      body = JSON.parse(rawBody);
    } catch (error) {
      const normalized = normalizeError(error, { includeStack: false });
      console.error("[sse] failed to parse JSON body", normalized);

      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32700,
            message: "Invalid JSON in request body"
          },
          id: null
        })
      );
      return;
    }
  }

  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    });

    res.on("close", () => {
      transport.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, body);
  } catch (error) {
    const normalized = normalizeError(error, { includeStack: true });
    console.error("[sse] error handling MCP request", normalized);

    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error"
          },
          id: null
        })
      );
    }
  }
}

async function main() {
  const guideServer: GuideServer = createServer();
  const server = guideServer.server;

  const port = Number(process.env.PORT ?? 3000);

  const httpServer = createHttpServer((req, res) => {
    void handleMcpRequest(server, req, res);
  });

  httpServer.listen(port, () => {
    console.log("Guide MCP Server (SSE) listening on http://localhost:" + port + "/sse");
  });

  httpServer.on("error", (error) => {
    const normalized = normalizeError(error, { includeStack: true });
    console.error("[sse] HTTP server error", normalized);
    process.exitCode = 1;
  });

  const shutdown = () => {
    console.log("Shutting down SSE server...");
    httpServer.close(() => {
      console.log("SSE server closed");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

void main();
