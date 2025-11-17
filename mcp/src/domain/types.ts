import type { QuestStatusSnapshot } from "./schema";

export type {
  CourseEligibilitySnapshot, HeroProfileSnapshot,
  QuestStatusSnapshot
} from "./schema";

export interface MissionOverviewSnapshotCourse {
  courseId: number;
  code: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface MissionOverviewSnapshot {
  missionId: number;
  name: string;
  description?: string;
  link?: string;
  questId: number;
  sortOrder: number;
  missionTypeId: number;
  dateCompletedIso?: string;
  deleted?: boolean;
  course?: MissionOverviewSnapshotCourse;
}

export type QuestWithMissionsSnapshot = QuestStatusSnapshot & {
  missions: ReadonlyArray<MissionOverviewSnapshot>;
};


