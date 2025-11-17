import { z } from "zod";

import { MissionOverviewSnapshot } from "../../domain/types";
import { timedQuery } from "../sql/client";
import { convertToIsoString, mapRecordsetKeysToCamelCase } from "../sql/mapping";

const MissionWithCourseDbRowSchema = z
  .object({
    missionId: z.number(),
    name: z.string(),
    description: z.string().nullable().optional(),
    link: z.string().nullable().optional(),
    questId: z.number(),
    sortOrder: z.number(),
    missionTypeId: z.number(),
    dateCompleted: z.union([z.date(), z.string()]).nullable().optional(),
    deleted: z.boolean().nullable().optional(),
    courseId: z.number().nullable().optional(),
    courseCode: z.string().nullable().optional(),
    courseName: z.string().nullable().optional(),
    courseDescription: z.string().nullable().optional(),
    courseIcon: z.string().nullable().optional()
  })
  .passthrough();

export interface MissionRepository {
  retrieveMissionsWithCoursesForQuest(questId: number): Promise<ReadonlyArray<MissionOverviewSnapshot>>;
}

export function createMissionRepository(): MissionRepository {
  return {
    async retrieveMissionsWithCoursesForQuest(questId: number): Promise<ReadonlyArray<MissionOverviewSnapshot>> {
      const result = await timedQuery(QUEST_MISSIONS_WITH_COURSES_QUERY, "quest_missions_with_courses", {
        QuestId: questId
      });

      const rows = mapRecordsetKeysToCamelCase(result.recordset as Array<Record<string, unknown>>);

      if (!rows || rows.length === 0) {
        return [];
      }

      const parsed = z.array(MissionWithCourseDbRowSchema).parse(rows);

      return parsed.map((row) => {
        const courseId = row.courseId ?? undefined;
        return {
          missionId: row.missionId,
          name: row.name,
          description: row.description ?? undefined,
          link: row.link ?? undefined,
          questId: row.questId,
          sortOrder: row.sortOrder,
          missionTypeId: row.missionTypeId,
          dateCompletedIso: convertToIsoString(row.dateCompleted),
          deleted: typeof row.deleted === "boolean" ? row.deleted : undefined,
          course:
            typeof courseId === "number"
              ? {
                  courseId,
                  code: row.courseCode ?? "",
                  name: row.courseName ?? "",
                  description: row.courseDescription ?? undefined,
                  icon: row.courseIcon ?? undefined
                }
              : undefined
        } satisfies MissionOverviewSnapshot;
      });
    }
  };
}

const QUEST_MISSIONS_WITH_COURSES_QUERY = `
    SELECT
      m.MissionId,
      m.Name,
      m.Description,
      m.Link,
      m.QuestId,
      m.SortOrder,
      m.MissionTypeId,
      m.DateCompleted,
      m.Deleted,
      mc.CourseId,
      c.Code AS CourseCode,
      c.Name AS CourseName,
      c.Description AS CourseDescription,
      c.Icon AS CourseIcon
    FROM Missions m
    INNER JOIN Quests q
      ON m.QuestId = q.QuestId
    LEFT OUTER JOIN MissionCourses mc
      ON m.MissionId = mc.MissionId
    LEFT OUTER JOIN Courses c
      ON mc.CourseId = c.CourseId
    WHERE m.QuestId = @QuestId
      AND m.Deleted = 0
    ORDER BY m.SortOrder
  `;
