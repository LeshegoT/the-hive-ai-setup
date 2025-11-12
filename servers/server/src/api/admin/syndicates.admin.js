const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  GetSubmittedIdeas,
  SyndicateFormationStages,
  ManageSyndicateFormation,
  IdeaVotes,
  getTeamMemberships,
  getSynicateReportTeams,
  updateSyndicateMembership,
  getUserPastTeamMembers,
  updateIdea,
} = require('../../queries/syndicates.queries');
const { level_up_users } = require('../../queries/level-up.queries');
const { getSyndicateFormationDetails } = require('../../shared/syndicates');
const { generateCsv } = require('../../shared/generate-csv');
const { withTransaction } = require('../../shared/db');

router.get(
  '/formationStages',
  handle_errors(async (req, res) => {
    const formationStages = await SyndicateFormationStages();
    res.json(formationStages);
  })
);

router.post(
  '/updateSyndicateFormation',
  handle_errors(async (req, res) => {
    try {
      await ManageSyndicateFormation(req.body);
      const updatedFormation = await getSyndicateFormationDetails(
        req.body.levelUpId,
        res.locals.upn
      );
      res.json(updatedFormation);
    } catch (error) {
      res
        .status(500)
        .json({
          error: 'Failed to update syndicate formation. Error:' + error.message,
        });
    }
  })
);

const saveSyndicates = async (teams, formationId) => {
  let updates = 0;
  await withTransaction(async (tx) => {
    const filteredTeams = teams.filter((ideas) => !!ideas.syndicateIdeaId);
    for (t of filteredTeams) {
      for (s of t.syndicates) {
        if (
          await updateSyndicateMembership(
            tx,
            s.hero,
            t.syndicateIdeaId,
            formationId
          )
        ) {
          updates++;
        }
      }
    }
  });

  return updates;
};

router.put(
  '/syndicates',
  handle_errors(async (req, res) => {
    const { formationId, teams } = req.body;
    const updates = await saveSyndicates(teams, formationId);
    res.json({ updates });
  })
);

router.patch(
  '/syndicate/idea/:ideaId',
  handle_errors(async (req, res) => {
    const { title, description, gitLink } = req.body;

    const updates = await updateIdea(
      req.params.ideaId,
      title,
      description,
      gitLink
    );
    res.json({ updates });
  })
);

router.post(
  '/newSyndicates',
  handle_errors(async (req, res) => {
    const { levelUpId } = req.body;

    const formationDetails = await getSyndicateFormationDetails(
      levelUpId,
      res.locals.upn
    );
    let heroes = await level_up_users(levelUpId);
    const maxGroupSize = Math.ceil(
      heroes.length / formationDetails.numberOfGroups
    );

    let ideas = await IdeaVotes(formationDetails.syndicateFormationId);
    ideas = ideas.slice(0, formationDetails.numberOfGroups);
    const unassignedTitle = 'Unassigned Heroes';
    ideas.push({
      syndicateIdeaId: 0,
      title: unassignedTitle,
    });
    ideas = ideas.map((idea) => {
      return { ...idea, syndicates: [] };
    });

    heroes = await Promise.all(
      heroes.map(async (hero) => {
        const pastTeamMembers = (await getUserPastTeamMembers(hero.upn)).map(
          (tm) => tm.userPrincipleName
        );
        const choices = ideas
          .filter((idea) => idea.voters && idea.voters.includes(hero.upn))
          .map((idea) => idea.syndicateIdeaId);
        ideas[ideas.length - 1].syndicates.push(hero.upn);
        return {
          ...hero,
          choices,
          pastTeamMembers,
        };
      })
    );

    const MAX_ITERATIONS = 100;
    const MEMBER_CONFLICT_COST = 5;
    const OVERFULL_SYNDICATE_COST = 3;
    const SYNDICATE_NOT_VOTED_FOR_COST = 1;
    const UNASSIGNED_COST = 3;

    const getIdeaCost = (hero, idea) => {
      const memberConflictCost =
        MEMBER_CONFLICT_COST *
        idea.syndicates.filter((s) => hero.pastTeamMembers.includes(s)).length;
      const overfullSyndicateCost =
        Math.max(idea.syndicates.length - maxGroupSize, 0) *
        OVERFULL_SYNDICATE_COST;
      const syndicateNotVotedForCost = hero.choices.includes(idea.syndicateIdeaId)
        ? 0
        : SYNDICATE_NOT_VOTED_FOR_COST;
      const unassignedCost = idea.title == unassignedTitle ? UNASSIGNED_COST : 0;
      return {
        idea,
        cost:
          memberConflictCost +
          overfullSyndicateCost +
          syndicateNotVotedForCost +
          unassignedCost,
      };
    };

    let changedAssignment = true;
    let iteration;
    for (
      iteration = 0;
      iteration < MAX_ITERATIONS && changedAssignment;
      iteration++
    ) {
      changedAssignment = false;
      for (hero of heroes) {
        const currentIdea = ideas.filter((idea) =>
          idea.syndicates.includes(hero.upn)
        )[0];
        const ideaCosts = ideas.map((idea) => getIdeaCost(hero, idea));
        const newIdea = ideaCosts.reduce((lowest, next) =>
          next.cost < lowest.cost ? next : lowest
        ).idea;

        if (currentIdea !== newIdea) {
          changedAssignment = true;
          currentIdea.syndicates = currentIdea.syndicates.filter(
            (h) => h != hero.upn
          );
          newIdea.syndicates.push(hero.upn);
        }
      }
    }

    ideas = ideas.map((idea) => {
      return {
        ...idea,
        syndicates: idea.syndicates.map((hero) => {
          return { hero };
        }),
      };
    });

    const updates = saveSyndicates(ideas, formationDetails.syndicateFormationId);

    res.json({ ideas, updates });
  })
);

router.get(
  '/syndicateFormationIdeas/:formationId',
  handle_errors(async (req, res) => {
    const { formationId } = req.params;
    const upn = res.locals.upn;
    const ideas = await GetSubmittedIdeas(formationId, upn);
    res.json(ideas);
  })
);

router.get(
  '/syndicates/:levelUpId',
  handle_errors(async (req, res) => {
    const { levelUpId } = req.params;
    const formationDetails = await getSyndicateFormationDetails(
      levelUpId,
      res.locals.upn
    );
    const teams = await getTeamMemberships(formationDetails.syndicateFormationId);
    let ideas = await IdeaVotes(formationDetails.syndicateFormationId);
    const heroes = await level_up_users(levelUpId);

    ideas = ideas.slice(0, formationDetails.numberOfGroups);
    const ideaSyndicates = ideas.map((i) => {
      const syndicates = teams
        .filter((t) => t.syndicateIdeaId === i.syndicateIdeaId)
        .map((h) => {
          return { hero: h.hero };
        });

      return {
        ...i,
        syndicates,
      };
    });

    const unassignedHeroes = heroes
      .filter(
        (hero) =>
          !ideaSyndicates.some((idea) =>
            idea.syndicates.some((h) => h.hero == hero.upn)
          )
      )
      .map((h) => {
        return { hero: h.upn };
      });

    res.json({
      ideaSyndicates,
      unassignedHeroes,
    });
  })
);

router.get(
  '/syndicates/report/:levelUpId',
  handle_errors(async (req, res) => {
    const { levelUpId } = req.params;
    const teams = await getSynicateReportTeams(levelUpId);

    const title = teams[0].levelUpName.split(' ').join('-');
    const headers = ['Group Name', 'Name', 'Number of Members'];

    const data = [];
    for (const member of teams) {
      const newRow = [member.groupName, member.name, member.numberOfMembers];
      data.push(newRow);
    }

    const info = ['LevelUp: ' + title];
    const fileName = `${title}.csv`;
    const csv = generateCsv(headers, data, info);

    const response = { csv: csv, fileName: fileName };

    res.json(response);
  })
);

module.exports = router;
