import { z } from "zod";

import { QuestStatusSnapshotSchema, type QuestStatusSnapshot } from "../../domain/schema";
import { timedQuery } from "../sql/client";
import { convertToIsoString, mapRecordsetKeysToCamelCase } from "../sql/mapping";

const QuestDbRowSchema = z
  .object({
    questId: z.number(),
    heroUserPrincipleName: z.string(),
    guideUserPrincipleName: z.string().nullable().optional(),
    questTypeId: z.number().nullable().optional(),
    specialisationId: z.number().nullable().optional(),
    goal: z.string().nullable().optional(),
    startDate: z.union([z.date(), z.string()]).nullable().optional(),
    endDate: z.union([z.date(), z.string()]).nullable().optional(),
    status: z.string()
  })
  .passthrough();

export interface QuestRepository {
  retrieveActiveQuestForHero(upn: string): Promise<QuestStatusSnapshot | null>;
}

export function createQuestRepository(): QuestRepository {
  return {
    async retrieveActiveQuestForHero(upn: string): Promise<QuestStatusSnapshot | null> {
      const result = await timedQuery(USER_QUEST_QUERY, "user_quest", { UPN: upn });
      const rows = mapRecordsetKeysToCamelCase(result.recordset as Array<Record<string, unknown>>);

      if (!rows[0]) {
        return null;
      }

      const row = QuestDbRowSchema.parse(rows[0]);

      return QuestStatusSnapshotSchema.parse({
        questId: row.questId,
        status: row.status,
        goal: row.goal ?? undefined,
        specialisationId: row.specialisationId ?? undefined,
        startDateIso: convertToIsoString(row.startDate),
        endDateIso: convertToIsoString(row.endDate),
        guideUpn: row.guideUserPrincipleName ?? undefined
      });
    }
  };
}

const USER_QUEST_QUERY = `
    select *
    from Quests
    where HeroUserPrincipleName = @UPN
    and Status = 'in-progress'
  `;
