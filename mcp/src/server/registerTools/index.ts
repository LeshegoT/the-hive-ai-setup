import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type {
  HeroRepository,
  MessageRepository,
  MissionRepository,
  QuestRepository
} from "../../data";

import { registerHeroOverviewTool } from "./heroOverview";
import { registerMessagesTools } from "./messages";

export const PLANNED_TOOL_NAMES: ReadonlyArray<string> = [
  "hero_overview",
  "quest_messages",
  "mission_messages",
  "course_messages"
];

export interface ToolDependencies {
  heroRepository: HeroRepository;
  questRepository: QuestRepository;
  missionRepository: MissionRepository;
  messageRepository: MessageRepository;
}

export function registerTools(server: McpServer, dependencies: ToolDependencies): void {
  registerHeroOverviewTool(server, dependencies);
  registerMessagesTools(server, { messageRepository: dependencies.messageRepository });
}
