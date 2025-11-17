import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import packageJson from "../../package.json";
import { loadConfig } from "../config/env";
import {
  createHeroRepository,
  createMessageRepository,
  createMissionRepository,
  createQuestRepository
} from "../data";
import { normalizeError } from "../utils/error";
import { PLANNED_TOOL_NAMES, registerTools, type ToolDependencies } from "./registerTools";

type McpLowLevelServer = McpServer["server"];

export interface GuideServerMetadata {
  name: string;
  version: string;
  supportedTools: ReadonlyArray<string>;
  supportedResources: ReadonlyArray<string>;
}

export interface GuideServer {
  server: McpServer;
  metadata: GuideServerMetadata;
}

export function createServer(): GuideServer {
  const name = packageJson.name ?? "guide-mcp-server";
  const version = packageJson.version ?? "0.0.0";

  const instructions = buildInstructions();

  const server = new McpServer(
    { name, version },
    {
      capabilities: {
        tools: { listChanged: true },
        resources: {},
        prompts: {}
      },
      instructions
    }
  );

  attachLifecycleHooks(server.server, name);

  const repositories: ToolDependencies = {
    heroRepository: createHeroRepository(),
    questRepository: createQuestRepository(),
    missionRepository: createMissionRepository(),
    messageRepository: createMessageRepository()
  };

  registerTools(server, repositories);

  const metadata: GuideServerMetadata = {
    name,
    version,
    supportedTools: PLANNED_TOOL_NAMES,
    supportedResources: []
  };

  return { server, metadata };
}

function buildInstructions(): string {
  const lines: string[] = [
    "Guide MCP Server",
    "",
    "Planned tools:",
    ...PLANNED_TOOL_NAMES.map((tool) => `- ${tool}`),
    ""
  ];

  return lines.join("\n");
}

function attachLifecycleHooks(lowLevelServer: McpLowLevelServer, implementationName: string): void {
  lowLevelServer.oninitialized = async () => {
    loadConfig();
  };

  lowLevelServer.onerror = (error: Error) => {
    const normalized = normalizeError(error, { includeStack: true });
    console.error(`[${implementationName}] MCP server error`, normalized);
  };
}
