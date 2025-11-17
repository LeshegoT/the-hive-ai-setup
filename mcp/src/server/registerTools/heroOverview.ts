import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { HeroRepository, MissionRepository, QuestRepository } from "../../data";
import { HeroProfileSnapshotSchema, QuestStatusSnapshotSchema } from "../../domain/schema";
import type { MissionOverviewSnapshot, QuestWithMissionsSnapshot } from "../../domain/types";
import { normalizeError } from "../../utils/error";

interface HeroOverviewDependencies {
  heroRepository: HeroRepository;
  questRepository: QuestRepository;
  missionRepository: MissionRepository;
}

const HeroOverviewInputSchema = z.object({
  heroUpn: z.string().min(1, { message: "heroUpn is required" })
});

const HeroOverviewOutputSchema = z.object({
  hero: HeroProfileSnapshotSchema.optional(),
  activeQuest: QuestStatusSnapshotSchema.extend({
    missions: z.array(
      z.object({
        missionId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        link: z.string().optional(),
        questId: z.number(),
        sortOrder: z.number(),
        missionTypeId: z.number(),
        dateCompletedIso: z.string().datetime().optional(),
        deleted: z.boolean().optional(),
        course: z
          .object({
            courseId: z.number(),
            code: z.string(),
            name: z.string(),
            description: z.string().optional(),
            icon: z.string().optional()
          })
          .optional()
      })
    )
  }).optional()
});

export function registerHeroOverviewTool(
  server: McpServer,
  dependencies: HeroOverviewDependencies,
  
): void {
  server.registerTool(
    "hero_overview",
    {
      title: "Hero overview",
      description: "Summarise a hero's current quest with its missions and associated courses.",
      inputSchema: HeroOverviewInputSchema,
      outputSchema: HeroOverviewOutputSchema
    },
    async ({ heroUpn }, _extra) => {

      try {
        const [hero, activeQuest] = await Promise.all([
          dependencies.heroRepository.retrieveHeroProfile(heroUpn),
          dependencies.questRepository.retrieveActiveQuestForHero(heroUpn)
        ]);

        const missions = activeQuest
          ? await dependencies.missionRepository.retrieveMissionsWithCoursesForQuest(activeQuest.questId)
          : [];

        const activeQuestWithMissions: QuestWithMissionsSnapshot | undefined = activeQuest
          ? { ...activeQuest, missions }
          : undefined;

        const structured: Record<string, unknown> = {};
        if (hero) structured.hero = hero;
        if (activeQuestWithMissions) structured.activeQuest = activeQuestWithMissions;

        const textSummary = buildHeroOverviewText(heroUpn, activeQuestWithMissions ?? null);

        return {
          content: [{ type: "text", text: textSummary }],
          structuredContent: structured
        };
      } catch (error) {
        const normalized = normalizeError(error, { includeStack: false });
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Failed to retrieve hero overview; consider involving a human guide if this persists."
            }
          ],
          structuredContent: { error: normalized }
        };
      }
    }
  );
}

function buildHeroOverviewText(heroUpn: string, activeQuest: QuestWithMissionsSnapshot | null): string {
  const lines: string[] = [];
  lines.push(`Hero quest overview for ${heroUpn}:`);
  lines.push("");

  if (!activeQuest) {
    lines.push("- Active quest: none in progress.");
    return lines.join("\n");
  }

  lines.push(`- Active quest ID: ${activeQuest.questId} (${activeQuest.status})`);
  lines.push(`- Quest goal: ${activeQuest.goal ?? "n/a"}`);
  lines.push(`- Quest window: ${activeQuest.startDateIso ?? "?"} → ${activeQuest.endDateIso ?? "?"}`);

  const missions = activeQuest.missions ?? [];
  if (missions.length === 0) {
    lines.push("- Missions: none found for this quest.");
    return lines.join("\n");
  }

  lines.push(`- Missions (${missions.length} total):`);
  for (const mission of missions) {
    lines.push(formatMissionLine(mission));
  }

  return lines.join("\n");
}

function formatMissionLine(mission: MissionOverviewSnapshot): string {
  const completion = mission.dateCompletedIso ? `completed at ${mission.dateCompletedIso}` : "not completed";
  const coursePart = mission.course ? `; course ${mission.course.code} - ${mission.course.name}` : "";
  return `  - [${mission.sortOrder}] ${mission.name} (type ${mission.missionTypeId}) - ${completion}${coursePart}`;
}
