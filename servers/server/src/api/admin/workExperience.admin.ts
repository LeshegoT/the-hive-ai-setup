import { handleErrors } from '@the-hive/lib-core';
import { getStaffId, WorkExperienceLogic } from '@the-hive/lib-skills-logic';
import { WorkExperience, WorkExperienceRole, WorkExperienceSector, WorkExperienceUpdate } from '@the-hive/lib-skills-shared';
import { Router } from "express";
import { withTransaction } from '../../shared/db';
import { BadRequestDetail, parseDate } from '@the-hive/lib-shared';
const router = Router();
const { db } = require("../../shared/db");
import type { Request, Response } from 'express';
import { parseIfSetElseDefault } from '@the-hive/lib-core';

const MODIFY_BIO_INFORMATION_USERS = parseIfSetElseDefault('MODIFY_BIO_INFORMATION_USERS', []);
const workExperienceLogic = new WorkExperienceLogic(db);

router.get('/skills/work-experience/:upn',
  handleErrors(async (
    req: Request<{ upn: string; }>,
    res: Response<BadRequestDetail | WorkExperience[]>
  ) => {
    try {
      if(!req.params.upn) {
        res.status(404)
      } else {
        const upn = req.params.upn;
        const staffId = await getStaffId(db, upn);
        const workExperience = await workExperienceLogic.readWorkExperienceByStaffId(staffId)
        if(workExperience) {
          res.status(200).json(workExperience)
        } else {
          res.status(404)
        }
      }
    } catch(err) {
      res.status(500).json({message: err.message});
    }
  })
);

router.post('/skills/work-experience/:upn',
  handleErrors(async (
    req: Request<{ upn: string; }, BadRequestDetail, WorkExperienceUpdate>,
    res: Response<BadRequestDetail>
  ) => {
    try {
      if(!req.params.upn) {
        res.status(404)
      } else {
        const upn = req.params.upn;
        if(!MODIFY_BIO_INFORMATION_USERS.includes(res.locals.upn)){
          res.status(403).json({ message: `${res.locals.upn} does not have access to add work experience for ${upn}` });
        } else {
          const workExperience = req.body;
          workExperience.startDate = parseDate(workExperience.startDate);
          workExperience.endDate = parseDate(workExperience.endDate);
          const staffId = await getStaffId(db, upn);
          workExperience.staffId = staffId;
          if(!workExperience.companyName) {
            res.status(400).json({message: "CompanyName is missing"});
          } else if(!workExperience.sectorName) {
            res.status(400).json({message: "CompanySector is missing"});
          } else if(!workExperience.roleName) {
            res.status(400).json({message: "Role is missing"});
          } else if(!workExperience.startDate) {
            res.status(400).json({message: "Startdate is missing"});
          } else if(!workExperience.staffId) {
            res.status(400).json({message: "Invalid or unknown UPN"})
          } else {
            await withTransaction(async (tx) => {
              await workExperienceLogic.createWorkExperience(tx, workExperience);
            });
            res.status(201).send()
          }
        }
      }
    } catch(err) {
      res.status(500).json({message: err.message});
    }
  })
);

router.put('/skills/work-experience/:upn/:workExperienceId',
  handleErrors(async (
    req: Request<{ upn: string; workExperienceId: number; }, BadRequestDetail, WorkExperience>,
    res: Response<BadRequestDetail>
  ) => {
    try {
    if(!req.params.upn || !req.params.workExperienceId) {
        res.status(404)
      } else {
        const upn = req.params.upn;
        if(!MODIFY_BIO_INFORMATION_USERS.includes(res.locals.upn)){
          res.status(403).json({ message: `${upn} does not have access to update work experience for ${upn}` });
        } else {
          const workExperienceId = req.params.workExperienceId;
          const workExperience = req.body;
          workExperience.startDate = parseDate(workExperience.startDate);
          workExperience.endDate = parseDate(workExperience.endDate);
          const staffId = await getStaffId(db, upn);
          workExperience.staffId = staffId;
          if(!workExperience.companyName) {
            res.status(400).json({message: "CompanyName is missing"});
          } else if(!workExperience.sectorName) {
            res.status(400).json({message: "CompanySector is missing"});
          } else if(!workExperience.roleName) {
            res.status(400).json({message: "Role is missing"});
          } else if(!workExperience.startDate) {
            res.status(400).json({message: "Startdate is missing"});
          } else if(!workExperience.staffId) {
            res.status(400).json({message: "Invalid or unknown UPN"})
          } else {
            await withTransaction(async (tx) => {
              await workExperienceLogic.updateWorkExperience(tx, staffId, workExperienceId, workExperience);
            });
            res.status(201).send()
          }
        }
      }
    } catch(err) {
      res.status(500).json({message: err.message});
    }
  })
);

router.delete('/skills/work-experience/:upn/:workExperienceId',
  handleErrors(async (
    req: Request<{ upn: string; workExperienceId: number; }>,
    res: Response<BadRequestDetail>
  ) => {
    try{
      if(!req.params.upn || !req.params.workExperienceId) {
        res.status(404)
      } else {
        const upn = req.params.upn;
        if(!MODIFY_BIO_INFORMATION_USERS.includes(res.locals.upn)){
          res.status(403).json({ message: `${upn} does not have access to delete work experience for ${upn}` });
        } else {
          const staffId = await getStaffId(db, upn);
          const workExperienceId = req.params.workExperienceId;
          await withTransaction(async (tx) => {
            await workExperienceLogic.deleteWorkExperience(tx, staffId, workExperienceId);
          });
        }
        res.status(200).send();
      }
    } catch(error) {
      res.status(500).json({message: error.message});
    }
  })
);



router.get('/skills/work-experience-roles',
  handleErrors(async (
    _,
    res: Response<BadRequestDetail | WorkExperienceRole[]>
  ) => {
    try {
      const roles = await workExperienceLogic.readRoles();
      res.status(200).json(roles);
    } catch(err) {
      res.status(500).json({message: err.message});
    }
  })
);

router.put('/skills/work-experience-roles/:roleId',
  handleErrors(async (
    req: Request<{ roleId: number; }, BadRequestDetail,{ upn: string; }>, 
    res: Response<BadRequestDetail, { upn: string; }>
  ) => {
    try {
      if(!req.params.roleId) {
        res.status(404)
      } else {
        const roleId = req.params.roleId;
        const upn = res.locals.upn;
        await withTransaction(async (tx) => {
          await workExperienceLogic.approveRole(tx, roleId, upn);
        });
        res.status(200).send();
      }
    } catch(err) {
      res.status(500).json({message: err.message});
    }
  })
);

router.delete('/skills/work-experience-roles/:roleId',
  handleErrors(async (
    req: Request<{ roleId: number; }>, 
    res: Response<BadRequestDetail>
  ) => {
    try{
      if(!req.params.roleId) {
        res.status(404)
      } else {
        const roleId = req.params.roleId;
        await withTransaction(async (tx) => {
          await workExperienceLogic.deleteRole(tx, roleId);
        });
        res.status(200).send();
      }
    } catch(error) {
      res.status(500).json({message: error.message});
    }
  })
)

router.get('/skills/work-experience-sectors',
  handleErrors(async (
    _,
    res:  Response<BadRequestDetail | WorkExperienceSector[]>
  ) => {
    try {
      const sectors = await workExperienceLogic.readSectors();
      res.status(200).json(sectors);
    } catch(err) {
      res.status(500).json({message: err.message});
    }
  })
);

router.put('/skills/work-experience-sectors/:sectorId',
  handleErrors(async (
    req: Request<{ sectorId: number; }, BadRequestDetail,{ upn: string; }>, 
    res: Response<BadRequestDetail, { upn: string; }>
  ) => {
    try {
      if(!req.params.sectorId) {
        res.status(404)
      } else {
        const sectorId = req.params.sectorId;
        const upn = res.locals.upn;
        await withTransaction(async (tx) => {
          await workExperienceLogic.approveSector(tx, sectorId, upn);
        });
        res.status(200).send();
      }
    } catch(err) {
      res.status(500).json({message: err.message});
    }
  })
);

router.delete('/skills/work-experience-sectors/:sectorId',
  handleErrors(async (
    req: Request<{ sectorId: number; }, BadRequestDetail>, 
    res: Response<BadRequestDetail>
  ) => {
    try {
      if(!req.params.sectorId) {
        res.status(404)
      } else {
        const sectorId = req.params.sectorId;
        await withTransaction(async (tx) => {
          await workExperienceLogic.deleteSector(tx, sectorId);
        });
        res.status(200).send();
      }
    } catch(err) {
      res.status(500).json({message: err.message});
    }
  })
)

router.post('/skills/work-experience-sectors',
  handleErrors(async (
    req: Request<undefined, BadRequestDetail, { sectorName: string; }>, 
    res: Response<BadRequestDetail | WorkExperienceSector>
  ) => {
    try {
      if(!req.body.sectorName) {
        res.status(400).json({message: "Sector name is missing"});
      } else {
        const sectorName = req.body.sectorName;
        const sector = await withTransaction<WorkExperienceSector>(async (tx) => await workExperienceLogic.addNewSector(tx, sectorName));
        res.status(201).json(sector);
      }
    } catch(error) {
      res.status(500).json({message: error.message});
    }
  })
);

router.post('/skills/work-experience-roles',
  handleErrors(async (
    req: Request<undefined, BadRequestDetail, { roleName: string; }>, 
    res: Response<BadRequestDetail | WorkExperienceRole>
  ) => {
    try {
      if(!req.body.roleName) {
        res.status(400).json({message: "Role name is missing"});
      } else {
        const roleName = req.body.roleName;
        const role = await withTransaction<WorkExperienceRole>(async (tx) => await workExperienceLogic.addNewRole(tx, roleName));
        res.status(201).json(role);
      }
    } catch(error) {
      res.status(500).json({message: error.message});
    }
  })
)

module.exports = router;
