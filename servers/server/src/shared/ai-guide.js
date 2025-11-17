const {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand
} = require("@aws-sdk/client-bedrock-agent-runtime");
const { create_message } = require('../queries/message.queries');
const queue = require('./queue');

const AWS_REGION = process.env.AWS_REGION;
const AGENT_ID = process.env.AGENT_ID;
const AGENT_ALIAS_ID = process.env.AGENT_ALIAS_ID;
const AI_GUIDE_UPN = 'ai.guide@the-hive.com';

const ALLOWED_AI_MESSAGE_TYPES = process.env.ALLOWED_AI_MESSAGE_TYPES;

// Initialize Bedrock Agent Runtime client
let bedrockClient;
if (AGENT_ID && AGENT_ALIAS_ID) {
  try {
    bedrockClient = new BedrockAgentRuntimeClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN,
      }
    });

    console.log("AWS Bedrock AI Agent initialized.", {
      region: AWS_REGION,
      agentId: AGENT_ID,
      agentAliasId: AGENT_ALIAS_ID
    });
  } catch (err) {
    console.error("Failed to initialize Bedrock Agent:", err);
  }
} else {
  console.warn("Bedrock AI disabled due to missing env variables.", {
    hasAgentId: !!AGENT_ID,
    hasAgentAliasId: !!AGENT_ALIAS_ID,
  });
}

function containsAIMention(text) {
  if (text) {
    return /@ai\b/i.test(text);
  } else {
    return false;
  }
}

function removeAIMention(text) {
  if (text) {
    return text.replace(/@ai\s*/gi, '').trim();
  } else {
    return '';
  }
}

function shouldAIRespond(text, messageTypeId, createdByUpn, heroUpn) {
  return (
    ALLOWED_AI_MESSAGE_TYPES.includes(messageTypeId) &&
    bedrockClient &&
    createdByUpn === heroUpn &&
    text &&
    text.trim().length > 0 &&
    containsAIMention(text)
  );
}

function decodeChunkBytes(bytes) {
  try {
    if (typeof TextDecoder !== 'undefined' && (bytes instanceof Uint8Array || bytes instanceof ArrayBuffer)) {
      const td = new TextDecoder('utf-8');
      return td.decode(bytes);
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

// Sanitize sessionId to match Bedrock regex: [0-9a-zA-Z._:-]+
function sanitizeSessionId(input) {
  return input.replace(/[^0-9a-zA-Z._:-]/g, '_');
}

// ========== AI AGENT CALL ==========

async function getAIResponse(text, userMessage) {
  if (!bedrockClient) {
    console.error('Bedrock client not initialized');
    return 'The AI Guide is currently offline. Please try again later.';
  }

  const cleanedText = removeAIMention(text);

  if (cleanedText.length === 0) {
    return 'Hi! I\'m the AI Guide. How can I help you today?';
  }

  let sessionId;
  try {
    // Use stable session ID - sanitize to remove invalid characters
    sessionId = sanitizeSessionId(`${userMessage.createdByUpn}-${userMessage.questId || 'general'}`);

    console.log("Sending request to Bedrock Agent", {
      cleanedTextLen: cleanedText.length,
      sessionId,
      agentId: AGENT_ID,
      agentAliasId: AGENT_ALIAS_ID,
    });

    const command = new InvokeAgentCommand({
      agentId: AGENT_ID,
      agentAliasId: AGENT_ALIAS_ID,
      sessionId,
      inputText: cleanedText,
    });

    const response = await bedrockClient.send(command);

    console.log("Response received, processing stream...");

    const chunks = [];         // changed from let → const
    const citations = [];      // changed from let → const
    let fullResponse = '';
    let sawAnyOutput = false;

    for await (const event of response.completion) {
      if (event.outputText && event.outputText.text) {
        const part = event.outputText.text;
        chunks.push(part);
        fullResponse += part;
        sawAnyOutput = true;
      }
      else if (event.chunk && event.chunk.bytes) {
        const chunkText = decodeChunkBytes(event.chunk.bytes);
        if (chunkText && chunkText.length) {
          chunks.push(chunkText);
          fullResponse += chunkText;
          sawAnyOutput = true;
        }
      }

      if (event.chunk && event.chunk.attribution && event.chunk.attribution.citations) {
        try {
          for (const c of event.chunk.attribution.citations) {
            citations.push({
              text: c?.generatedResponsePart?.textResponsePart?.text || null,
              source: c?.retrievedReferences?.[0]?.location?.s3Location?.uri || null,
            });
          }
        } catch (e) {
          console.warn('Error parsing citations', { error: e.message });
        }
      }
    }

    console.log("Stream processing complete", {
      sawAnyOutput,
      fullResponseLength: fullResponse.length,
      chunksCount: chunks.length,
    });

    const cleanedResponse = fullResponse.replace(/\n\s+/g, ' ').trim();  // changed let → const

    if (!cleanedResponse && !sawAnyOutput) {
      console.warn('Agent produced no output', { sessionId, cleanedText });
      return "I'm not entirely sure how to respond to that.";
    }

    const finalResponse = cleanedResponse || "I'm not entirely sure how to respond to that.";

    console.log("Successfully received response from Bedrock Agent", {
      responseLength: finalResponse.length,
      sessionId,
      citationsCount: citations.length,
    });

    return finalResponse;

  } catch (err) {
    console.log('Bedrock RAG Error:', {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      requestId: err.requestId,
      stack: err.stack
    });
    return 'Sorry, I encountered an error while trying to respond. Please try again later.';
  }
}

async function createAIReply(userMessage, userText) {
  try {
    console.log('Creating AI reply', {
      userUpn: userMessage.createdByUpn,
      questId: userMessage.questId,
      missionId: userMessage.missionId
    });

    const aiResponseText = await getAIResponse(userText, userMessage);

    const aiMessage = await create_message(
      userMessage.messageTypeId,
      userMessage.createdByUpn,
      AI_GUIDE_UPN,
      aiResponseText,
      userMessage.questId,
      userMessage.missionId,
      userMessage.sideQuestId,
      userMessage.courseId,
      null,
      null,
      null,
      'AI Guide Response',
      null
    );

    const aiNotification = {
      ...aiMessage,
      questId: userMessage.questId,
      missionId: userMessage.missionId,
      courseId: userMessage.courseId,
      sideQuestId: userMessage.sideQuestId,
    };

    queue.enqueue('notifications', aiNotification);

  } catch (error) {
    console.log('Failed to create AI response:', error);
  }
}

module.exports = {
  shouldAIRespond,
  createAIReply,
  getAIResponse,
  containsAIMention,
  removeAIMention,
  AI_GUIDE_UPN,
  ALLOWED_AI_MESSAGE_TYPES
};
