# Guide MCP Server (`@the-hive-guide/mcp-server`)

This package implements a Model Context Protocol (MCP) server that exposes The Hive "Guide" persona over MCP tools/resources/prompts, with a stdio entrypoint suitable for GitHub Copilot / VS Code MCP integration.

## Prerequisites

- Node.js 18+ (recommended: the same version used by the main repo)
- npm (or compatible package manager)
- Access to AWS Bedrock with a configured Knowledge Base

## Installation

From the repo root:

```bash
cd mcp
npm install
```

## Configuration

The server reads configuration from environment variables (via `dotenv`). Create a `.env` file in `mcp/` based on the sample below.

Required variables:

- `BEDROCK_ACCESS_KEY_ID` – AWS access key for Bedrock
- `BEDROCK_SECRET_ACCESS_KEY` – AWS secret key for Bedrock
- `BEDROCK_REGION` – AWS region hosting Bedrock (for example, `eu-west-2`)
- `BEDROCK_KB_ID` – Bedrock Knowledge Base ID

Optional variables:

- `GUIDE_LOG_LEVEL` – Pino log level (`trace|debug|info|warn|error|fatal`, default `info`)
- `SESSION_CACHE_TTL_SECONDS` – Positive integer TTL for in-memory session cache (default `300`)

See `.env.sample` in this directory for a template.

## Scripts

All commands are run from the `mcp/` directory:

```bash
npm run dev    # Run MCP server from TypeScript over stdio (for local development)
npm run build  # Compile TypeScript to dist/
npm start      # Run built stdio entrypoint (node dist/server/stdio.js)

npm run lint        # ESLint over src/**/*.ts
npm run check:types # TypeScript type checking (no emit)
```

## VS Code + GitHub Copilot MCP Setup (stdio)

This server is designed to run as a **local stdio MCP server** for Copilot in VS Code.

### 1. Build or run directly

For development (recommended while iterating):

```bash
cd mcp
npm run dev
```

For a compiled Node entrypoint:

```bash
cd mcp
npm run build
npm start
```

> When used with VS Code MCP, VS Code will spawn the server itself using the configuration below; you do not usually run it manually at the same time.

### 2. Create VS Code MCP configuration

Follow the official docs for [Use MCP servers in VS Code](https://code.visualstudio.com/docs/copilot/chat/mcp-servers).

In your workspace, create `.vscode/mcp.json` with a stdio server definition pointing at this package:

```json
{
  "servers": {
    "guideMcp": {
      "type": "stdio",
      "command": "node",
      "args": [
        "${workspaceFolder}/mcp/dist/server/stdio.js"
      ],
      "envFile": "${workspaceFolder}/mcp/.env"
    }
  }
}
```

Notes:

- `type: "stdio"` matches the server's `StdioServerTransport`.
- `command` + `args` assume you've run `npm run build` and are opening VS Code at the **repo root**.
- `envFile` points VS Code to your `.env` so the MCP server gets Bedrock credentials without hard-coding secrets in `mcp.json`.

Alternatively, you can add the server via the Command Palette:

1. Run **MCP: Add Server**.
2. Choose **Standard I/O (stdio)**.
3. Set:
   - **Name**: `guideMcp` (or any descriptive name)
   - **Command**: `node`
   - **Args**: `${workspaceFolder}/mcp/dist/server/stdio.js`
   - **envFile**: `${workspaceFolder}/mcp/.env`
4. Save the generated `mcp.json`.

### 3. Enable and test tools in Copilot Chat

1. Ensure you are on a VS Code version with MCP support (see the docs link above) and signed into GitHub Copilot.
2. Open the **Chat** view (`Ctrl+Alt+I`).
3. Use **MCP: List Servers** from the Command Palette to verify that `guideMcp` appears and can be started; view output logs if needed.
4. In the Chat tool picker, enable tools from the `guideMcp` server (they will appear once implemented and advertised via MCP).
5. Ask Copilot something that should use the Guide MCP tools (for example: "Use the Guide MCP tools to summarise my hero's current quests").

VS Code will start the MCP server via stdio, read its capabilities, and expose its tools/resources/prompts to Copilot Chat.
