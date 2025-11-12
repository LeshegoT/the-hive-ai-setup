export interface QuestTemplate {
  questTemplateId: number;
  name: string;
  description: string;
  questTypeId: number;
  specialisationId: number;
  goal: string;
  durationMonths: number;
  createdDate: Date;
  modifiedDate: Date;
}

export interface QuestTemplateGuideResult {
  questTemplateId: number;
  name: string;
  description: string;
  questTypeName: string;
  specialisationName: string;
  goal: string;
  durationMonths: number;
  createdDate: Date;
  modifiedDate: Date;
}

export interface MissionTemplate {
  missionTemplateId: number;
  questTemplateId: number;
  name: string;
  description: string;
  link: string;
  missionTypeId: number;
  sortOrder: number;
  createdDate: Date;
  modifiedDate: Date;
  questTemplateName: string;
  missionTypeName: string;
}

export interface BaseMissionUpdate extends MissionTemplateUpdate {
  missionTemplateId : number;
}

export interface NewMission extends BaseMissionUpdate {
  missionTemplateId : number;
}

export interface ExistingMission extends BaseMissionUpdate {
  missionTemplateId: number;
}
export interface CreateQuestTemplateBody {
  name: string;
  description: string;
  questTypeId: number;
  specialisationId: number;
  goal: string;
  durationMonths: number;
  guideUpns: string[];
  missions: MissionTemplateUpdate[];
}

export interface UpdateQuestTemplateBody {
  questTemplateId: number;
  name: string;
  description: string;
  questTypeId: number;
  specialisationId: number;
  goal: string;
  durationMonths: number;
  missions: BaseMissionUpdate[];
  guideUpns: string[];
}

export type QuestTemplateUpdate = Omit<QuestTemplate, 'questTemplateId' | 'createdDate' | 'modifiedDate' | 'specialisationName' | 'questTypeName'>;
export type MissionTemplateUpdate = Omit<MissionTemplate, 'missionTemplateId' | 'questTemplateId' | 'createdDate' | 'modifiedDate' | 'questTemplateName' | 'missionTypeName'>;
