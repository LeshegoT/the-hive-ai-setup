import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { MessageRepository, MessageSnapshot } from "../../data";
import { normalizeError } from "../../utils/error";

const MAX_MESSAGE_LIMIT = 200;

const MessageSnapshotSchema = z.object({
  from: z.enum(["hero", "guide"]),
  text: z.string(),
  createdAtIso: z.string().datetime().optional()
});

const SharedOutputSchema = z.object({
  messages: z.array(MessageSnapshotSchema)
});

const BaseInputSchema = z.object({
  maxMessages: z.number().int().min(1).max(MAX_MESSAGE_LIMIT).optional()
});

interface MessageToolDependencies {
  messageRepository: MessageRepository;
}

type MessageFetcher<Input extends object> = (
  input: Input
) => Promise<ReadonlyArray<MessageSnapshot>>;

interface MessageToolConfig<InputSchema extends z.ZodType<object>> {
  name: "quest_messages" | "mission_messages" | "course_messages";
  title: string;
  description: string;
  subjectLabel: string;
  inputSchema: InputSchema;
  getSubject(input: z.infer<InputSchema>): string;
  fetchMessages: MessageFetcher<z.infer<InputSchema>>;
}

export function registerMessagesTools(
  server: McpServer,
  dependencies: MessageToolDependencies,
): void {
  registerMessagesTool(server, {
    name: "quest_messages",
    title: "Quest messages",
    description: "Fetch recent messages associated with a specific quest ID.",
    subjectLabel: "quest",
    inputSchema: BaseInputSchema.extend({
      questId: z.number().int().positive()
    }),
    getSubject: (input) => input.questId.toString(),
    fetchMessages: (input) =>
      dependencies.messageRepository.retrieveMessagesForQuest(input.questId, input.maxMessages)
  });

  registerMessagesTool(server, {
    name: "mission_messages",
    title: "Mission messages",
    description: "Fetch recent messages associated with a specific mission ID.",
    subjectLabel: "mission",
    inputSchema: BaseInputSchema.extend({
      missionId: z.number().int().positive()
    }),
    getSubject: (input) => input.missionId.toString(),
    fetchMessages: (input) =>
      dependencies.messageRepository.retrieveMessagesForMission(input.missionId, input.maxMessages)
  });

  registerMessagesTool(server, {
    name: "course_messages",
    title: "Course messages",
    description: "Fetch recent messages associated with a specific course ID.",
    subjectLabel: "course",
    inputSchema: BaseInputSchema.extend({
      courseId: z.number().int().positive()
    }),
    getSubject: (input) => input.courseId.toString(),
    fetchMessages: (input) =>
      dependencies.messageRepository.retrieveMessagesForCourse(input.courseId, input.maxMessages)
  });
}

function registerMessagesTool<InputSchema extends z.ZodType<object>>(
  server: McpServer,
  config: MessageToolConfig<InputSchema>
): void {
  const handler = async (input: any, _extra: any) => {
      const subject = config.getSubject(input);

      try {
        const messages = await config.fetchMessages(input);

        if (messages.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No messages found for ${config.subjectLabel} ${subject}.`
              }
            ],
            structuredContent: { messages: [] }
          };
        }

        const summary = buildMessagesSummary(config.subjectLabel, subject, messages);

        return {
          content: [
            {
              type: "text",
              text: summary
            }
          ],
          structuredContent: { messages }
        };
      } catch (error) {
        const normalized = normalizeError(error, { includeStack: false });
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to retrieve ${config.subjectLabel} messages; consider reviewing the conversation manually.`
            }
          ],
          structuredContent: { error: normalized }
        };
      }
    };

  server.registerTool(
    config.name,
    {
      title: config.title,
      description: config.description,
      inputSchema: config.inputSchema,
      outputSchema: SharedOutputSchema
    },
    handler as unknown as ToolCallback<InputSchema>
  );
}

function buildMessagesSummary(
  subjectLabel: string,
  subject: string,
  messages: ReadonlyArray<MessageSnapshot>
): string {
  const lines: string[] = [];
  lines.push(`Recent messages for ${subjectLabel} ${subject} (most recent first):`);
  for (const message of messages) {
    const prefix = message.from === "hero" ? "[Hero]" : "[Guide]";
    const timestamp = message.createdAtIso ?? "unknown time";
    lines.push(`- ${timestamp} ${prefix} ${message.text}`);
  }
  return lines.join("\n");
}
