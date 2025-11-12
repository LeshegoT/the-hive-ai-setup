const {
  SyndicateFormationDetails,
  GetSubmittedIdeas,
} = require('../queries/syndicates.queries');

const getSyndicateFormationDetails = async (levelUpId, upn) => {
  const details = await SyndicateFormationDetails(levelUpId);

  if (!details) {
    return {
      levelUpId: levelUpId,
      currentStage: 1,
      userSubmissionsRemaining: 0,
      ideas: [],
    };
  }

  const ideas = await GetSubmittedIdeas(details.syndicateFormationId, upn);
  const userSubmissions = ideas.filter((i) => i.userSubmitted).length;

  const userSubmissionsRemaining = details.ideasLimit - userSubmissions;
  return {
    ...details,
    userSubmissionsRemaining,
    ideas,
  };
};

module.exports = {
  getSyndicateFormationDetails,
};
