import express, { Request, Response } from 'express';
import { handle_errors } from '@the-hive/lib-core';
import { updateMissionTemplate } from '../queries/mission-template.queries';

const router = express.Router();


router.patch(
  '/missionTemplates/:missionTemplateId',
  handle_errors(async (req: Request, res: Response) => {
    const missionTemplateId = Number(req.params.missionTemplateId);
    if (!Number.isInteger(missionTemplateId)) {
      return res.status(400).json({ error: 'Invalid mission template ID' });
    } else {
      const result = await updateMissionTemplate(missionTemplateId, req.body);
      res.status(200).json(result);
    }
  })
);

module.exports = router;
