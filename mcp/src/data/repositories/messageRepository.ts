import { z } from "zod";

import { timedQuery } from "../sql/client";
import { convertToIsoString, mapRecordsetKeysToCamelCase } from "../sql/mapping";

export interface MessageSnapshot {
  from: "hero" | "guide";
  text: string;
  createdAtIso?: string;
}

export interface MessageRepository {
  retrieveRecentMessages(upn: string, limit?: number): Promise<ReadonlyArray<MessageSnapshot>>;
  retrieveMessagesForQuest(questId: number, limit?: number): Promise<ReadonlyArray<MessageSnapshot>>;
  retrieveMessagesForMission(missionId: number, limit?: number): Promise<ReadonlyArray<MessageSnapshot>>;
  retrieveMessagesForCourse(courseId: number, limit?: number): Promise<ReadonlyArray<MessageSnapshot>>;
}

const MessageDbRowSchema = z
  .object({
    heroUserPrincipleName: z.string(),
    createdByUserPrincipleName: z.string(),
    creationDate: z.union([z.date(), z.string()]),
    text: z.string().nullable().optional()
  })
  .passthrough();

const RECENT_MESSAGES_DEFAULT_LIMIT = 30;
const QUEST_MESSAGES_DEFAULT_LIMIT = 50;
const MISSION_MESSAGES_DEFAULT_LIMIT = QUEST_MESSAGES_DEFAULT_LIMIT;
const COURSE_MESSAGES_DEFAULT_LIMIT = QUEST_MESSAGES_DEFAULT_LIMIT;
const MAX_MESSAGE_LIMIT = 200;

export function createMessageRepository(): MessageRepository {
  return {
    async retrieveRecentMessages(upn: string, limit: number = RECENT_MESSAGES_DEFAULT_LIMIT) {
      const result = await timedQuery(RECENT_MESSAGES_QUERY, "recent_hero_messages", {
        UPN: upn,
        Limit: resolveLimit(limit, RECENT_MESSAGES_DEFAULT_LIMIT)
      });

      return mapRecordsToSnapshots(result.recordset, upn);
    },

    async retrieveMessagesForQuest(questId: number, limit: number = QUEST_MESSAGES_DEFAULT_LIMIT) {
      const result = await timedQuery(QUEST_MESSAGES_QUERY, "quest_messages", {
        QuestId: questId,
        Limit: resolveLimit(limit, QUEST_MESSAGES_DEFAULT_LIMIT)
      });

      return mapRecordsToSnapshots(result.recordset);
    },

    async retrieveMessagesForMission(missionId: number, limit: number = MISSION_MESSAGES_DEFAULT_LIMIT) {
      const result = await timedQuery(MISSION_MESSAGES_QUERY, "mission_messages", {
        MissionId: missionId,
        Limit: resolveLimit(limit, MISSION_MESSAGES_DEFAULT_LIMIT)
      });

      return mapRecordsToSnapshots(result.recordset);
    },

    async retrieveMessagesForCourse(courseId: number, limit: number = COURSE_MESSAGES_DEFAULT_LIMIT) {
      const result = await timedQuery(COURSE_MESSAGES_QUERY, "course_messages", {
        CourseId: courseId,
        Limit: resolveLimit(limit, COURSE_MESSAGES_DEFAULT_LIMIT)
      });

      return mapRecordsToSnapshots(result.recordset);
    }
  } satisfies MessageRepository;
}

function mapRecordsToSnapshots(
  recordset: unknown,
  heroUpnFallback?: string
): ReadonlyArray<MessageSnapshot> {
  if (!Array.isArray(recordset) || recordset.length === 0) {
    return [];
  }

  const rows = mapRecordsetKeysToCamelCase(recordset as Array<Record<string, unknown>>);
  const parsed = z.array(MessageDbRowSchema).parse(rows);

  return parsed
    .map((row) => mapDbRowToMessageSnapshot(row, heroUpnFallback))
    .filter((message) => message.text.trim().length > 0);
}

function mapDbRowToMessageSnapshot(row: z.infer<typeof MessageDbRowSchema>, heroUpnFallback?: string): MessageSnapshot {
  const text = String(row.text ?? "");
  const createdBy = String(row.createdByUserPrincipleName ?? "").toLowerCase();
  const heroUpn = (row.heroUserPrincipleName ?? heroUpnFallback ?? "").toLowerCase();

  const from: MessageSnapshot["from"] = createdBy === heroUpn ? "hero" : "guide";

  return {
    from,
    text,
    createdAtIso: convertToIsoString(row.creationDate)
  };
}

function resolveLimit(requested: number | undefined, fallback: number): number {
  if (typeof requested !== "number" || Number.isNaN(requested)) {
    return fallback;
  }

  const clamped = Math.min(Math.max(Math.trunc(requested), 1), MAX_MESSAGE_LIMIT);
  return clamped;
}

const RECENT_MESSAGES_QUERY = `
  select top (@Limit)
    m.MessageId,
    m.HeroUserPrincipleName,
    m.CreatedByUserPrincipleName,
    m.CreationDate,
    m.Text
  from Messages m
    inner join MessageTypes mt on mt.MessageTypeId = m.MessageTypeId and mt.MessageTypeId not in (15)
  where m.HeroUserPrincipleName = @UPN
     or m.CreatedByUserPrincipleName = @UPN
  order by m.CreationDate desc
`;

const QUEST_MESSAGES_QUERY = `
  select top (@Limit)
    m.MessageId,
    m.HeroUserPrincipleName,
    m.CreatedByUserPrincipleName,
    m.CreationDate,
    m.Text
  from Messages m
    inner join QuestMessages qm on qm.MessageId = m.MessageId
    inner join MessageTypes mt on mt.MessageTypeId = m.MessageTypeId and mt.MessageTypeId not in (15)
  where qm.QuestId = @QuestId
  order by m.CreationDate desc
`;

const MISSION_MESSAGES_QUERY = `
  select top (@Limit)
    m.MessageId,
    m.HeroUserPrincipleName,
    m.CreatedByUserPrincipleName,
    m.CreationDate,
    m.Text
  from Messages m
    inner join MissionMessages mm on mm.MessageId = m.MessageId
    inner join MessageTypes mt on mt.MessageTypeId = m.MessageTypeId and mt.MessageTypeId not in (15)
  where mm.MissionId = @MissionId
  order by m.CreationDate desc
`;

const COURSE_MESSAGES_QUERY = `
  select top (@Limit)
    m.MessageId,
    m.HeroUserPrincipleName,
    m.CreatedByUserPrincipleName,
    m.CreationDate,
    m.Text
  from Messages m
    inner join CourseMessages cm on cm.MessageId = m.MessageId
    inner join MessageTypes mt on mt.MessageTypeId = m.MessageTypeId and mt.MessageTypeId not in (15)
  where cm.CourseId = @CourseId
  order by m.CreationDate desc
`;
