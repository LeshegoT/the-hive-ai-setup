import { handleErrors } from '@the-hive/lib-core';
import { QuestTemplatesLogic } from '@the-hive/lib-learning-logic';
import { CreateQuestTemplateBody, MissionTemplate, QuestTemplate, QuestTemplateGuideResult, UpdateQuestTemplateBody } from '@the-hive/lib-learning-shared';
import type { Request, Response } from 'express';
import express from 'express';
import { db, withTransaction } from '../shared/db';

const router = express.Router();
const questTemplatelogic = new QuestTemplatesLogic(db);

type ErrorResponse = {error:string}
type QuestTemplateResponse = {questTemplate:QuestTemplate, guides: string[] , missions: MissionTemplate[]}

router.post(
  '/quest-templates',
  handleErrors(async (req: Request<never, QuestTemplateResponse|ErrorResponse, CreateQuestTemplateBody>, res: Response<QuestTemplateResponse|ErrorResponse>) => {
    const questTemplateData = req.body;
    if (!Array.isArray(questTemplateData.missions) || questTemplateData.missions.length === 0) {
       res.status(400).json({ error: 'At least one mission template is required' });
    }else{
      //We have a valid missions array
    }
    if (!Array.isArray(questTemplateData.guideUpns) || questTemplateData.guideUpns.length === 0) {
       res.status(400).json({ error: 'At least one guide UPN is required' });
    }else{
      //We have atleast one guide UPN
    }

    await withTransaction(async (tx) => {

      const questTemplateUpdate = {
        name: questTemplateData.name,
        description: questTemplateData.description,
        questTypeId: questTemplateData.questTypeId,
        specialisationId: questTemplateData.specialisationId,
        goal: questTemplateData.goal,
        durationMonths: questTemplateData.durationMonths,
      };
      const questTemplate = await questTemplatelogic.createQuestTemplate(tx, questTemplateUpdate);
      await questTemplatelogic.addGuidesToQuestTemplate(tx, questTemplate.questTemplateId, questTemplateData.guideUpns);
      const createdMissions = await questTemplatelogic.createMissionTemplates(tx, questTemplateData.missions, questTemplate.questTemplateId);
      res.status(201).json({ questTemplate, guides: questTemplateData.guideUpns, missions: createdMissions });
    });
  })
);

router.patch(
  '/quest-templates',
  handleErrors(async (req: Request<never, {error?:string}, UpdateQuestTemplateBody>, res: Response<{error?:string}>) => {
    const questTemplateIdRaw = req.body.questTemplateId;
    const updates = req.body;
    const questTemplateId = Number(questTemplateIdRaw);
    if (!Number.isFinite(questTemplateId)) {
       res.status(400).json({ error: 'Invalid questTemplateId' });
    }
    else{
      //We have a valid questTemplateId
    }

    if (!Array.isArray(updates.missions) || updates.missions.length === 0) {
       res.status(400).json({ error: 'At least one mission template is required' });
    }else{
      //We have a valid missions array
    }

    await withTransaction(async (tx) => {
      await questTemplatelogic.updateQuestTemplate(tx, questTemplateId, updates);
    });
    res.status(200).send();
  })
);

router.get(
  '/quest-templates/:questTemplateId',
  handleErrors(async (req: Request<{questTemplateId:string}, QuestTemplateResponse|ErrorResponse>, res: Response<QuestTemplateResponse|ErrorResponse>) => {
    const questTemplateId = parseInt(req.params.questTemplateId);
    if (!req.params.questTemplateId || isNaN(questTemplateId)) {
      res.status(400).json({ error: 'Invalid quest template ID' });
    }
    const questTemplate = await questTemplatelogic.getQuestTemplateById(questTemplateId);
    if (!questTemplate) {
      res.status(404).json({ error: 'Quest template not found' });
    } else {
      const missions = await questTemplatelogic.getMissionTemplatesByQuestTemplateId(questTemplateId);
      const guides = await questTemplatelogic.getGuidesForQuestTemplate(questTemplateId);
      res.status(200).json({ questTemplate, guides, missions });
    }
  })
);

// TODO: RE - The response type here is incorrect, the array should not be mapped to a property name, the array should be returned as is.
type AllQuestTemplatesResponse = {
  guideQuestTemplates:{
    missions: MissionTemplate[];
    guides: string[];
    questTemplateId: number;
    name: string;
    description: string;
    questTypeName: string;
    specialisationName: string;
    goal: string;
    durationMonths: number;
    createdDate: Date;
    modifiedDate: Date;
  }[]
};

router.get(
  '/quest-templates',
  handleErrors(async (req: Request<never,AllQuestTemplatesResponse|ErrorResponse,never,{guideUpn?:string}>, res: Response<AllQuestTemplatesResponse|ErrorResponse>) => {
    if (!req?.query?.guideUpn) {
       res.status(400).json({ error: 'Invalid guide UPN' });
    } else {
      const questTemplates: QuestTemplateGuideResult[] = await questTemplatelogic.getQuestTemplatesByGuideUpn(req.query.guideUpn);
      const guideQuestTemplates = await Promise.all(
        questTemplates.map(async (questTemplate) => {
          const missions = await questTemplatelogic.getMissionTemplatesByQuestTemplateId(questTemplate.questTemplateId);
          const guides = await questTemplatelogic.getGuidesForQuestTemplate(questTemplate.questTemplateId);
          return { ...questTemplate, missions, guides };
        })
      );
      res.status(200).json({ guideQuestTemplates });
    }
  })
);

module.exports = router;
