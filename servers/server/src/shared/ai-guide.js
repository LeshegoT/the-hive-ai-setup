const {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand
} = require("@aws-sdk/client-bedrock-agent-runtime");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");

const AWS_REGION = process.env.AWS_REGION;
const AGENT_ID = process.env.AGENT_ID;
const AGENT_ALIAS_ID = process.env.AGENT_ALIAS_ID;

let bedrockClient;
let mcpClient;

// Initialize Bedrock client
if (AGENT_ID && AGENT_ALIAS_ID) {
  bedrockClient = new BedrockAgentRuntimeClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    }
  });
}

// Initialize MCP client
async function initMcpClient() {
  if (mcpClient) return mcpClient;

  const transport = new StdioClientTransport({
    command: "node",
    args: ["mcp/dist/server/stdio.js"]
  });

  mcpClient = new Client(
    { name: "ai-agent-mcp-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await mcpClient.connect(transport);
  console.log("MCP client connected");
  
  return mcpClient;
}

// Get user context via MCP
async function getUserContext(userMessage) {
  try {
    const client = await initMcpClient();
    
    // Get hero overview
    const heroOverview = await client.callTool({
      name: "hero_overview",
      arguments: {
        heroUpn: userMessage.createdByUpn
      }
    });

    let context = "";
    
    if (heroOverview.content && heroOverview.content[0]) {
      context += "USER CONTEXT:\n" + heroOverview.content[0].text + "\n\n";
    }

    // Get recent quest messages if quest exists
    if (userMessage.questId) {
      const questMessages = await client.callTool({
        name: "quest_messages",
        arguments: {
          questId: userMessage.questId,
          maxMessages: 10
        }
      });

      if (questMessages.content && questMessages.content[0]) {
        context += "RECENT CONVERSATION:\n" + questMessages.content[0].text + "\n\n";
      }
    }

    // Get mission messages if applicable
    if (userMessage.missionId) {
      const missionMessages = await client.callTool({
        name: "mission_messages",
        arguments: {
          missionId: userMessage.missionId,
          maxMessages: 10
        }
      });

      if (missionMessages.content && missionMessages.content[0]) {
        context += "MISSION CONVERSATION:\n" + missionMessages.content[0].text + "\n\n";
      }
    }

    return context;
  } catch (error) {
    console.error("Error getting user context from MCP:", error);
    return ""; // Gracefully degrade if MCP fails
  }
}

// Enhanced getAIResponse with MCP context
async function getAIResponseWithContext(text, userMessage) {
  if (!bedrockClient) {
    console.error('Bedrock client not initialized');
    return 'The AI Guide is currently offline. Please try again later.';
  }

  const cleanedText = removeAIMention(text);

  if (cleanedText.length === 0) {
    return 'Hi! I\'m the AI Guide. How can I help you today?';
  }

  try {
    // Get context from MCP
    const userContext = await getUserContext(userMessage);
    
    // Combine user context with their question
    const enrichedInput = userContext 
      ? `${userContext}USER QUESTION:\n${cleanedText}`
      : cleanedText;

    const sessionId = sanitizeSessionId(
      `${userMessage.createdByUpn}-${userMessage.questId || 'general'}`
    );

    console.log("Sending enriched request to Bedrock Agent", {
      cleanedTextLen: cleanedText.length,
      contextLen: userContext.length,
      sessionId
    });

    const command = new InvokeAgentCommand({
      agentId: AGENT_ID,
      agentAliasId: AGENT_ALIAS_ID,
      sessionId,
      inputText: enrichedInput,
    });

    const response = await bedrockClient.send(command);

    let fullResponse = '';
    for await (const event of response.completion) {
      if (event.outputText?.text) {
        fullResponse += event.outputText.text;
      } else if (event.chunk?.bytes) {
        const chunkText = decodeChunkBytes(event.chunk.bytes);
        if (chunkText) fullResponse += chunkText;
      }
    }

    const cleanedResponse = fullResponse.replace(/\n\s+/g, ' ').trim();

    if (!cleanedResponse) {
      console.warn('Agent produced no output', { sessionId, cleanedText });
      return "I'm not entirely sure how to respond to that.";
    }

    return cleanedResponse;

  } catch (err) {
    console.error('Bedrock/MCP Error:', err);
    return 'Sorry, I encountered an error while trying to respond. Please try again later.';
  }
}

// Helper functions from original code
function removeAIMention(text) {
  return text ? text.replace(/@ai\s*/gi, '').trim() : '';
}

function sanitizeSessionId(input) {
  return input.replace(/[^0-9a-zA-Z._:-]/g, '_');
}

function decodeChunkBytes(bytes) {
  try {
    if (typeof TextDecoder !== 'undefined' && (bytes instanceof Uint8Array || bytes instanceof ArrayBuffer)) {
      return new TextDecoder('utf-8').decode(bytes);
    }
    if (bytes && typeof bytes === 'object') {
      const arr = Object.values(bytes);
      return Buffer.from(arr).toString('utf8');
    }
    return String(bytes);
  } catch (err) {
    console.warn('Failed to decode chunk bytes', { err: err.message });
    return '';
  }
}

// Cleanup on process exit
process.on('exit', async () => {
  if (mcpClient) {
    await mcpClient.close();
  }
});

module.exports = {
  getAIResponseWithContext,
  initMcpClient,
  getUserContext
};