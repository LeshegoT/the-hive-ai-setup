const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { withTransaction } = require('../../shared/db');
const { randomUUID } = require('crypto');
const {
  insertBursarAssessment,
  retrieveBursarAssessments,
  insertAssessmentStatusProgression,
  retrieveAllBursarAssessmentStatusses,
  updateBursarAssessmentDueDate,
} = require('../../queries/bursarAssessment.queries');

router.post(
  '/bursarAssessment',
  handle_errors(async (req, res) => {
    const { name, email, dueDate } = req.body;
    const pendingAssessmentStatusID = 1;

    await withTransaction(async (tx) => {
      const uuid = randomUUID();
      const bursarAssessmentId = await insertBursarAssessment(
        tx,
        name,
        email,
        dueDate,
        uuid
      );
      await insertAssessmentStatusProgression(
        tx,
        bursarAssessmentId,
        pendingAssessmentStatusID,
        res.locals.upn
      );
    });

    res.status(201).send();
  })
);

router.get(
  '/bursarAssessmentStatus',
  handle_errors(async (req, res) => {
    const result = await retrieveAllBursarAssessmentStatusses();
    res.json(result);
  })
);

router.get(
  '/bursarAssessment',
  handle_errors(async (req, res) => {
    const { page, size, search } = req.query;
    if (page && size) {
      const result = await retrieveBursarAssessments(page, size, search);
      const overallAssessmentCount = result[0] ? result[0].overallCount : 0;

      const bursarAssessments = result.map((assessment) => {
        return {
          id: assessment.bursarAssessmentId,
          name: assessment.name,
          email: assessment.email,
          dueDate: assessment.dueDate,
          gameState: assessment.gameState,
          nudged: false,
          progress: {
            id: assessment.bursarAssessmentStatusProgressionId,
            actionBy: assessment.actionBy,
            actionDate: assessment.actionDate,
            status: {
              id: assessment.bursarAssessmentStatusId,
              name: assessment.status,
            },
          },
        };
      });

      const response = {
        pageInfo: {
          pageNumber: page,
          pageSize: size,
          resultSetSize: overallAssessmentCount,
          totalPages: Math.ceil(overallAssessmentCount / size),
        },
        data: bursarAssessments,
      };

      res.json(response);
    } else {
      res
        .status(400)
        .send(
          'Failed to retrieve bursar assessments: Missing parameters for page and size '
        );
    }
  })
);

router.patch(
  '/bursarAssessment/:id',
  handle_errors(async (req, res) => {
    try {
      await updateBursarAssessmentDueDate(req.params.id, req.body.dueDate);
      res.status(200).send();
    } catch (error) {
      res.status(400).send(error);
    }
  })
);

router.delete(
  '/bursarAssessment/:id',
  handle_errors(async (req, res) => {
    const cancelledAssessmentStatusID = 8;

    try {
      await withTransaction(async (tx) => {
        await insertAssessmentStatusProgression(
          tx,
          req.params.id,
          cancelledAssessmentStatusID,
          res.locals.upn
        );
      });
    } catch (error) {
      res.status(400).send(error);
    }

    res.status(200).send();
  })
);

module.exports = router;
