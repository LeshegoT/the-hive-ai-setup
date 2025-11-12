import { Router }  from "express";
const router = Router();
const { handle_errors } = require('@the-hive/lib-core');
import { ProfileLogic } from "@the-hive/lib-skills-logic";
const { db, withTransaction } = require('../shared/db');
const profileLogic = new ProfileLogic(db);
const { getStaffId } = require('../queries/staff-overview.queries');

router.get('/skills/profile/',
    handle_errors(async (request, response) => {
        try {
            const staffId = await getStaffId(response.locals.upn);
            if (!staffId) {
                response.status(400).send({error: `Bad Request. UPN ${response.locals.upn} not found`});
            } else {
                const skillsProfiles = await profileLogic.readSkillsProfileByStaffId(staffId.staffId);
                if (skillsProfiles) {
                    response.json(skillsProfiles);
                } else {
                    response.status(404).send({error: `Profiles for staffId ${staffId.staffId} not found.`});
                }
            }
        } catch (error) {
            let errorMessage = error.message;
            if (error.causedBy) {
                errorMessage = `${errorMessage}: caused by (${error.causedBy})`;
            }
            response.status(500).send(errorMessage);
        }
    })
);

router.post('/skills/profile/',
    handle_errors(async (request, response) => {
        try {
            const { profile, description } = request.body;
            const staffId = await getStaffId(response.locals.upn);
            if (staffId.staffId) {
                await withTransaction(async (tx) => {
                    const result = await profileLogic.insertSkillsProfile(tx, staffId.staffId, profile, description);
                    response.status(201).json(result);
                });
            } else {
                response.status(400).send({error: `Bad Request. UPN ${response.locals.upn} not found`});
            }

        } catch (error) {
            let errorMessage = error.message;
            if (error.causedBy) {
                errorMessage = `${errorMessage}: caused by (${error.causedBy})`;
            }
            response.status(500).send(errorMessage);
        }
    })
);

router.delete('/skills/profile/:profileId',
    handle_errors(async (request, response) => {
        try {
            const profileId = request.params.profileId;
            if (profileId && profileId < 1) {
                response.status(400).send({error: "Bad Request. ProfileId not found in request"});
            } else {
                await withTransaction(async (tx) => {
                    await profileLogic.deleteSkillsProfile(tx, profileId);
                    response.status(200).json({ message: 'Deleted ' + profileId });
                });
            }
        } catch (error) {
            let errorMessage = error.message;
            if (error.causedBy) {
                errorMessage = `${errorMessage}: caused by (${error.causedBy})`;
            }
            response.status(500).send(errorMessage);
        }
    })
);

router.put('/skills/profile/:profileId',
    handle_errors(async (request, response) => {
        try {
            const profileId = request.params.profileId;
            if (!profileId || profileId < 1) {
                response.status(400).send({error: "Bad Request. ProfileId not found in request"});
            } else {
                const { staffId, profile, description } = request.body;
                await withTransaction(async (tx) => {
                    await profileLogic.updateSkillsProfile(tx, profileId, staffId, profile, description);
                    response.status(200).json({ message: `Updated ${profileId}` });
                });
            }
        } catch (error) {
            let errorMessage = error.message;
            if (error.causedBy) {
                errorMessage = `${errorMessage}: caused by (${error.causedBy})`;
            }
            response.status(500).send(errorMessage);
        }
    })
);

module.exports = router;
