import { z } from "zod";

export const HeroProfileSnapshotSchema = z.object({
  upn: z.string(),
  goal: z.string().optional(),
  specialisation: z.string().optional(),
  startDateIso: z.string().datetime().optional(),
  endDateIso: z.string().datetime().optional(),
  lastHeroActivityDateIso: z.string().datetime().optional(),
  guideUpn: z.string().optional()
});

export type HeroProfileSnapshot = z.infer<typeof HeroProfileSnapshotSchema>;

export const QuestStatusSnapshotSchema = z.object({
  questId: z.number(),
  status: z.string(),
  goal: z.string().optional(),
  specialisationId: z.number().optional(),
  startDateIso: z.string().datetime().optional(),
  endDateIso: z.string().datetime().optional(),
  guideUpn: z.string().optional()
});

export type QuestStatusSnapshot = z.infer<typeof QuestStatusSnapshotSchema>;

export const CourseEligibilitySnapshotSchema = z.object({
  courseId: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  eligible: z.literal(true)
});

export type CourseEligibilitySnapshot = z.infer<typeof CourseEligibilitySnapshotSchema>;
