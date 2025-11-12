import { getQuestTemplateById, createQuestTemplate, update_quest_template } from '../queries/quest-template.queries';
import { SqlTransaction } from '@the-hive/lib-db';
import { QuestTemplate, QuestTemplateUpdate,
  UpdateQuestTemplateBody, BaseMissionUpdate, MissionTemplateUpdate,
  NewMission, ExistingMission, MissionTemplate
 }
from '@the-hive/lib-learning-shared';
import { addGuidesToQuestTemplate, deleteGuidesForQuestTemplate, getGuidesForQuestTemplate,getQuestTemplatesByGuideUpn } from '../queries/quest-templateGuides.queries';
import { SqlRequest } from '@the-hive/lib-db';
import { getMissionTemplatesByQuestTemplateId, createMissionTemplate} from '../queries/mission-template.queries';
import {QuestTemplateGuideResult} from '@the-hive/lib-learning-shared';

export class QuestTemplatesLogic {
  db: () => Promise<SqlRequest>;

  constructor(db: () => Promise<SqlRequest>) {
    this.db = db;
  }

  async getQuestTemplateById(questTemplateId: number): Promise<QuestTemplate | undefined> {
    return getQuestTemplateById(this.db,questTemplateId);
  }


  async createQuestTemplate(
    tx: SqlTransaction,
    data: QuestTemplateUpdate
  ): Promise<QuestTemplate> {
    return createQuestTemplate(tx, data);
  }

  async getGuidesForQuestTemplate(questTemplateId: number): Promise<string[]> {
    return getGuidesForQuestTemplate(this.db, questTemplateId);
  }

  async addGuidesToQuestTemplate(
    tx: SqlTransaction,
    questTemplateId: number,
    upns: string[]
  ): Promise<void> {
    return addGuidesToQuestTemplate(this.db, tx, questTemplateId, upns);
  }

async getQuestTemplatesByGuideUpn(guideUpn: string): Promise<QuestTemplateGuideResult[]> {
    return getQuestTemplatesByGuideUpn(this.db, guideUpn);
  }

  static isNewMission(mission: BaseMissionUpdate): mission is NewMission {
  return !mission.missionTemplateId || mission.missionTemplateId < 0;
  }

  static isExistingMission(mission: BaseMissionUpdate): mission is ExistingMission {
  return typeof mission.missionTemplateId === 'number' && mission.missionTemplateId > 0;
  }

  async updateQuestTemplate(
    tx: SqlTransaction,
    questTemplateId: number,
    updates: UpdateQuestTemplateBody
  ): Promise<void> {

  const newMissions = updates.missions.filter(QuestTemplatesLogic.isNewMission);
  const existingMissions = updates.missions.filter(QuestTemplatesLogic.isExistingMission);

    const questTemplateUpdate = {
        name: updates.name,
        description: updates.description,
        questTypeId: updates.questTypeId,
        specialisationId: updates.specialisationId,
        goal: updates.goal,
        durationMonths: updates.durationMonths,
      };
      await update_quest_template(tx, questTemplateId, questTemplateUpdate, newMissions, existingMissions);
      await deleteGuidesForQuestTemplate(this.db,tx, questTemplateId);
      await addGuidesToQuestTemplate(this.db,tx, questTemplateId, updates.guideUpns);
  }

  async updateQuestTemplateWithMissions(
    tx: SqlTransaction,
    questTemplateId: number,
    updates: QuestTemplateUpdate,
    newMissions: MissionTemplateUpdate[],
    existingMissions: (MissionTemplateUpdate & { missionTemplateId: number;})[]
  ): Promise<void> {
    if (!questTemplateId || questTemplateId < 1) {
      throw new Error('Invalid questTemplateId');
    }
    return update_quest_template(tx, questTemplateId, updates, newMissions, existingMissions);
  }


  async createMissionTemplates(
    tx: SqlTransaction,
    data: MissionTemplateUpdate[],
    questTemplate : number
  ): Promise<MissionTemplate[]> {
      const createdMissions = [] as MissionTemplate[];
      for (const mission of data) {
        const newMission = await createMissionTemplate(tx, {
          questTemplateId: questTemplate,
          ...mission
        });
        createdMissions.push(newMission);
      }
    return createdMissions;
  }

  async getMissionTemplatesByQuestTemplateId(questTemplateId: number): Promise<MissionTemplate[]> {
    return getMissionTemplatesByQuestTemplateId(this.db, questTemplateId);
  }
}
