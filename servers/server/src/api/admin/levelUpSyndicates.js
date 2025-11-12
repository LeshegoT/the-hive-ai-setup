const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const {
  getTeamMembers,
  getIdeaIds,
  getAllUserPastSyndicateIdeas,
} = require('../../queries/syndicates.queries');

router.get(
  '/syndicates/:levelUpId/members',
  handle_errors(async (req, res) => {
    const lvlUpId = req.params.levelUpId;

    let userPastIdeas = [];
    let syndicateIdeasArray = [];
    let repeatedIdeasInSyndicate = [];
    const membersInRepeatedFormation = [];
    const syndicateIdeaDetails = await getIdeaIds(lvlUpId);

    for (const ideaDetail of syndicateIdeaDetails) {
      const group = await getTeamMembers(ideaDetail.syndicateIdeaId);
      syndicateIdeasArray = [];
      repeatedIdeasInSyndicate = [];
      userPastIdeas = [];

      if (group.length > 0) {
        for (const member of group) {
          const userPastSyndicates = await getAllUserPastSyndicateIdeas(
            lvlUpId,
            member.userPrincipleName
          );

          userPastSyndicates.forEach((pastSyndicate) => {
            syndicateIdeasArray.push(pastSyndicate.syndicateIdeaId);
          });

          userPastIdeas.push(userPastSyndicates);
        }
        syndicateIdeasArray.sort();

        for (let i = 0; i < syndicateIdeasArray.length; i++) {
          if (
            syndicateIdeasArray[i] !== ideaDetail.syndicateIdeaId &&
            syndicateIdeasArray[i] === syndicateIdeasArray[i + 1] &&
            !repeatedIdeasInSyndicate.includes(syndicateIdeasArray[i])
          ) {
            repeatedIdeasInSyndicate.push(syndicateIdeasArray[i]);
          }
        }
        for (const ideas of userPastIdeas) {
          ideas.forEach((userIdea) => {
            if (repeatedIdeasInSyndicate.includes(userIdea.syndicateIdeaId)) {
              if (
                !membersInRepeatedFormation.includes(userIdea.userPrincipleName)
              ) {
                membersInRepeatedFormation.push(userIdea.userPrincipleName);
              }
            }
          });
        }
      }
    }
    res.json(membersInRepeatedFormation);
  })
);

router.get(
  '/repeatedSyndicateMembers/:Id/:member',
  handle_errors(async (req, res) => {
    const user = req.params.member;
    const levelUpId = req.params.Id;

    const previousTeams = [];
    const recurringMembers = [];

    const userPastSyndicates = await getAllUserPastSyndicateIdeas(
      levelUpId,
      user
    );
    if (!userPastSyndicates.length) {
      res.json([]);
    } else {
      const currentIdea =
        userPastSyndicates[userPastSyndicates.length - 1].syndicateIdeaId;
      const currentTeam = await getTeamMembers(currentIdea);

      for (const pastSyndicate of userPastSyndicates) {
        if (pastSyndicate.syndicateIdeaId !== currentIdea) {
          const pastTeamMembers = await getTeamMembers(
            pastSyndicate.syndicateIdeaId
          );
          previousTeams.push(pastTeamMembers);
        }
      }

      for (const team of previousTeams) {
        team.forEach((member) => {
          const teamMember = currentTeam.find(
            (teamMember) =>
              teamMember.userPrincipleName === member.userPrincipleName
          );
          if (teamMember) {
            if (teamMember.userPrincipleName !== user) {
              if (!recurringMembers.includes(teamMember.userPrincipleName)) {
                recurringMembers.push(teamMember.userPrincipleName);
              }
            }
          }
        });
      }
      res.json(recurringMembers);
    }
  })
);

module.exports = router;
