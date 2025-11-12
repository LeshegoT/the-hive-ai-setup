const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  GetSubmittedIdeas,
  getFormationStage,
  getLevelUpFormationStage,
  SubmitIdea,
  RankIdea,
  RemoveIdea,
  getTeamMemberships,
  IdeaVotes,
  joinSyndicate,
  getTeamMembers,
  getUserPastTeamMembers,
  getIdeaSyndicateFormationDetails,
  getIdeaFormationStage,
  updateIdea,
  updateIdeaDetails,
} = require('../queries/syndicates.queries');
const { getSyndicateFormationDetails } = require('../shared/syndicates');
const { IsAdminUser } = require('../queries/security.queries');
const { level_up_users } = require('../queries/level-up.queries');
const { withTransaction } = require('../shared/db');

const IDEATION_STAGE = 2;
const VOTING_STAGE = 3;
const COMPLETED_STAGE = 5;

router.get(
  '/syndicateDetails/:levelUpId',
  handle_errors(async (req, res) => {
    const { levelUpId } = req.params;
    const formationDetails = await getSyndicateFormationDetails(
      levelUpId,
      res.locals.upn
    );
    res.json(formationDetails);
  })
);

router.post(
  '/submitIdea',
  handle_errors(async (req, res) => {
    const idea = {
      ...req.body,
      upn: res.locals.upn,
    };

    if (!IsAdminUser(res.locals.upn)) {
      const formationStage = await getFormationStage(idea.syndicateFormationId);
      if (!formationStage || formationStage != IDEATION_STAGE) {
        res
          .status(403)
          .json({
            message: 'Not allowed in current syndicate formation stage!',
          });
      }
    }

    await SubmitIdea(idea);
    const updatedDetails = await getSyndicateFormationDetails(
      idea.levelUpId,
      res.locals.upn
    );
    res.json(updatedDetails);
  })
);

router.patch(
  '/syndicate/idea/:ideaId/git',
  handle_errors(async (req, res) => {
    const { gitLink } = req.body;

    const teamMembers = (await getTeamMembers(req.params.ideaId)).map(
      (t) => t.userPrincipleName
    );
    if (!teamMembers.includes(res.locals.upn)) {
      res
        .status(403)
        .json({
          message:
            'You cannot update the git link for a team you do not belong to!',
        });
    } else {
      const status = await updateIdea(req.params.ideaId, null, null, gitLink);
      res.json(status);
    }
  })
);

router.patch(
  '/syndicate/idea/:ideaId/details',
  handle_errors(async (req, res) => {
    const { title, description } = req.body;

    const formationStage = await getIdeaFormationStage(req.params.ideaId);

    if (formationStage == IDEATION_STAGE) {
      const status = await updateIdeaDetails(
        req.params.ideaId,
        title,
        description,
        res.locals.upn
      );

      if (status) {
        res.status(204);
      } else {
        res.status(404).send({ message: 'Idea not found!' });
      }
    } else {
      res
        .status(403)
        .json({ message: 'Not allowed in current syndicate formation stage!' });
    }
  })
);

router.patch(
  '/syndicate/:syndicateIdeaId/members/',
  handle_errors(async (req, res) => {
    const upn = res.locals.upn;
    const syndicateIdeaId = Number(req.params.syndicateIdeaId);
    const formationDetails = await getIdeaSyndicateFormationDetails(
      syndicateIdeaId
    );
    if (!formationDetails) {
      res.status(400);
    }
    const heroes = await level_up_users(formationDetails.levelUpId);
    const maxGroupSize = Math.ceil(
      heroes.length / formationDetails.numberOfGroups
    );
    const memberships = await getTeamMemberships(
      formationDetails.syndicateFormationId
    );
    const teamMembers = memberships
      .filter((t) => t.syndicateIdeaId == syndicateIdeaId)
      .map((h) => h.hero);

    if (teamMembers.length > maxGroupSize) {
      res.status(409).json({
        message: 'Team already full',
      });
    } else {
      const pastTeamMembers = (await getUserPastTeamMembers(res.locals.upn)).map(
        (tm) => tm.userPrincipleName
      );
      if (teamMembers.some((member) => pastTeamMembers.includes(member))) {
        res.status(409).json({
          message: 'Team includes past teammembers',
        });
      } else {
        const status = await joinSyndicate(upn, syndicateIdeaId);
        res.json({
          message: status,
        });
      }
    }
  })
);

router.post(
  '/rankIdea',
  handle_errors(async (req, res) => {
    const { levelUpId, ideaRankChanges } = req.body;
    const upn = res.locals.upn;

    if (!IsAdminUser(res.locals.upn)) {
      const formationStage = await getLevelUpFormationStage(levelUpId);
      if (!formationStage || formationStage != VOTING_STAGE) {
        res
          .status(403)
          .json({
            message: 'Not allowed in current syndicate formation stage!',
          });
      }
    }

    await withTransaction(async (tx) => {
      for (const chagnedRank of ideaRankChanges) {
        const ideaId = chagnedRank.ideaId;
        let newRank = chagnedRank.newRank;
        if (newRank <= 0) {
          newRank = null;
        }
        await RankIdea(tx, ideaId, upn, newRank);
        res.status(200).end();
      }
    }).catch((err) => {
      res.status(500).json({error: err.message});
    });
  })
);

router.post(
  '/removeIdea',
  handle_errors(async (req, res) => {
    const { ideaId, formationId } = req.body;
    const upn = res.locals.upn;

    if (!IsAdminUser(res.locals.upn)) {
      const formationStage = await getFormationStage(formationId);
      if (!formationStage || formationStage != IDEATION_STAGE) {
        res
          .status(403)
          .json({
            message: 'Not allowed in current syndicate formation stage!',
          });
      }
    }

    await RemoveIdea(ideaId, upn);
    const ideas = await GetSubmittedIdeas(formationId, upn);
    res.json(ideas);
  })
);

router.get(
  '/syndicate/:levelUpId',
  handle_errors(async (req, res) => {
    const { levelUpId } = req.params;
    const formationDetails = await getSyndicateFormationDetails(
      levelUpId,
      res.locals.upn
    );
    if (formationDetails.currentStage != COMPLETED_STAGE) {
      res.json([]);
      return;
    }
    const teams = await getTeamMemberships(formationDetails.syndicateFormationId);
    const heroes = await level_up_users(levelUpId);
    const maxGroupSize = Math.ceil(
      heroes.length / formationDetails.numberOfGroups
    );
    let ideas = await IdeaVotes(formationDetails.syndicateFormationId);
    let userTeam;

    ideas = ideas.slice(0, formationDetails.numberOfGroups);
    let availableTeams = ideas.map((i) => {
      const teamMembers = teams
        .filter((t) => t.syndicateIdeaId === i.syndicateIdeaId)
        .map((h) => h.hero);
      i.syndicates = teamMembers.map((h) => {
        return { hero: h };
      });
      if (teamMembers.includes(res.locals.upn)) {
        userTeam = i;
      }
      return i;
    });

    if (userTeam) {
      res.json([userTeam]);
    } else {
      if (!formationDetails.allowConflictingGroups) {
        const pastTeamMembers = (
          await getUserPastTeamMembers(res.locals.upn)
        ).map((tm) => tm.userPrincipleName);
        availableTeams = availableTeams.filter(
          (t) =>
            !t.syndicates.filter((s) => pastTeamMembers.includes(s.hero)).length
        );
      }
      availableTeams = availableTeams.map((t) => {
        const team = {
          syndicateIdeaId: t.syndicateIdeaId,
          title: t.title,
          description: t.description,
          votes: t.votes,
          teamSize: t.syndicates.length,
        };
        return team;
      });
      availableTeams = availableTeams.filter((t) => t.teamSize <= maxGroupSize);

      res.json(availableTeams);
    }
  })
);

module.exports = router;
