import { z } from "zod";

import { CourseEligibilitySnapshotSchema, type CourseEligibilitySnapshot } from "../../domain/schema";
import { timedQuery } from "../sql/client";
import { mapRecordsetKeysToCamelCase } from "../sql/mapping";

const PermittedCourseDbRowSchema = z
  .object({
    courseId: z.number(),
    code: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    icon: z.string().nullable().optional()
  })
  .passthrough();

export interface CourseRepository {
  retrieveEligibleCoursesForHero(upn: string): Promise<CourseEligibilitySnapshot[]>;
}

export function createCourseRepository(): CourseRepository {
  return {
    async retrieveEligibleCoursesForHero(upn: string): Promise<CourseEligibilitySnapshot[]> {
      const result = await timedQuery(ALL_PERMITTED_COURSES_QUERY, "all_permitted_courses", { UPN: upn });
      const rows = mapRecordsetKeysToCamelCase(result.recordset as Array<Record<string, unknown>>);

      if (!rows || rows.length === 0) {
        return [];
      }

      const array = z.array(PermittedCourseDbRowSchema).parse(deduplicateCourses(rows));

      return array.map((course) =>
        CourseEligibilitySnapshotSchema.parse({
          courseId: course.courseId,
          code: course.code,
          name: course.name,
          description: course.description ?? undefined,
          icon: course.icon ?? undefined,
          eligible: true
        })
      );
    }
  };
}

const ALL_PERMITTED_COURSES_QUERY = `
    SELECT
      c.CourseId,
      c.Code,
      c.Name,
      c.Description,
      c.Icon,
      cs.SectionId,
      cs.SortOrder
    FROM Courses c
        INNER JOIN CourseSections cs on cs.CourseId = c.CourseId
    WHERE Restricted = 0
      OR c.CourseId IN (
        SELECT DISTINCT TypeKeyId AS CourseId FROM ContentRestrictions gr
        INNER JOIN
        Groups ug
        ON gr.GroupName = ug.GroupName AND MemberUserPrincipleName = @UPN
        WHERE RestrictionTypeId = 2 AND gr.GroupName IS NOT NULL
      )
      OR c.CourseId IN (
        SELECT TypeKeyId as CourseId
        FROM ContentRestrictions
        WHERE RestrictionTypeId = 2 AND UPN = @UPN
      )
    ORDER BY
        CourseId,
        SortOrder
  `;

function deduplicateCourses(rows: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  const byCourseId = new Map<number, Record<string, unknown>>();

  for (const row of rows) {
    const courseId = row.courseId as number | undefined;
    if (typeof courseId !== "number") {
      continue;
    }
    if (!byCourseId.has(courseId)) {
      byCourseId.set(courseId, row);
    }
  }

  return Array.from(byCourseId.values());
}
