import { z } from "zod";

import { HeroProfileSnapshotSchema, type HeroProfileSnapshot } from "../../domain/schema";
import { timedQuery } from "../sql/client";
import { convertToIsoString, mapRecordsetKeysToCamelCase } from "../sql/mapping";

const HeroDetailsDbRowSchema = z
  .object({
    heroUserPrincipleName: z.string(),
    specialisation: z.string().nullable().optional(),
    goal: z.string().nullable().optional(),
    lastHeroActivityDate: z.union([z.date(), z.string()]).nullable().optional(),
    startDate: z.union([z.date(), z.string()]).nullable().optional(),
    endDate: z.union([z.date(), z.string()]).nullable().optional(),
    guideUserPrincipleName: z.string().nullable().optional()
  })
  .passthrough();

export interface HeroRepository {
  retrieveHeroProfile(upn: string): Promise<HeroProfileSnapshot | null>;
}

export function createHeroRepository(): HeroRepository {
  return {
    async retrieveHeroProfile(upn: string): Promise<HeroProfileSnapshot | null> {
      const result = await timedQuery(HERO_DETAILS_QUERY, "hero_details", { UPN: upn });
      const rows = mapRecordsetKeysToCamelCase(result.recordset as Array<Record<string, unknown>>);

      if (!rows[0]) {
        return null;
      }

      const dbRow = HeroDetailsDbRowSchema.parse(rows[0]);

      return HeroProfileSnapshotSchema.parse({
        upn: dbRow.heroUserPrincipleName,
        goal: dbRow.goal ?? undefined,
        specialisation: dbRow.specialisation ?? undefined,
        startDateIso: convertToIsoString(dbRow.startDate),
        endDateIso: convertToIsoString(dbRow.endDate),
        lastHeroActivityDateIso: convertToIsoString(dbRow.lastHeroActivityDate),
        guideUpn: dbRow.guideUserPrincipleName ?? undefined
      });
    }
  };
}

const HERO_DETAILS_QUERY = `
    select
      q.HeroUserPrincipleName,
      s.Name as Specialisation,
      q.Goal,
      p.LastHeroActivityDate,
      q.StartDate,
      q.EndDate,
      q.GuideUserPrincipleName
    from Quests q
    inner join Specialisations s on q.SpecialisationId = s.SpecialisationId
    left outer join Profiles p on q.HeroUserPrincipleName = p.UserPrincipleName
    where q.HeroUserPrincipleName = @UPN AND STATUS = 'in-progress'
  `;
