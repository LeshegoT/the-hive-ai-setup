const {
  user_interactions,
  interaction_types,
} = require('../queries/user-interactions.queries');

const calculateMultiplier = async (upn) => {
  const interactions = await user_interactions(upn);
  const types = await interaction_types();

  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const filteredByDate = interactions.filter((i) => i.interactionDate >= date);

  const multiplierValue =
    calculateSectionMultiplier(filteredByDate, types) +
    calculateLoginMultiplier(interactions, types, date) +
    calculateCourseMultiplier(filteredByDate, types) +
    calculateSelfDirectedMultiplier(filteredByDate, types);

  const multiplier = { value: multiplierValue > 0 ? multiplierValue : 1 };

  return multiplier;
};

const calculateSectionMultiplier = (interactions, types) => {
  const typeCode = types.find(
    (type) => type.interactionCode === 'section'
  ).interactionTypeID;

  const sectionInteractions = interactions.filter(
    (i) => i.interactionTypeID === typeCode
  );

  const limit = types.find(
    (type) => type.interactionCode === 'section'
  ).multiplierLimit;

  if (sectionInteractions.length >= limit) {
    return limit;
  } else {
    return sectionInteractions.length;
  }
};

const calculateLoginMultiplier = (interactions, types, date) => {
  const typeCode = types.find(
    (type) => type.interactionCode === 'login'
  ).interactionTypeID;
  const loginInteractions = interactions.filter(
    (i) => i.interactionTypeID === typeCode
  );

  const yesterday = new Date();
  yesterday.setDate(date.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  if (
    loginInteractions.some(
      (i) => i.interactionDate >= yesterday && i.interactionDate <= date
    )
  ) {
    const previousDay = new Date();
    previousDay.setDate(yesterday.getDate() - 1);
    previousDay.setHours(0, 0, 0, 0);

    if (
      loginInteractions.some(
        (i) =>
          i.interactionDate >= previousDay && i.interactionDate <= yesterday
      )
    ) {
      return 3;
    }

    return 2;
  }

  return 1;
};

const calculateSelfDirectedMultiplier = (interactions, types) => {
  const typeCode = types.find(
    (type) => type.interactionCode === 'article'
  ).interactionTypeID;
  const selfDirected = interactions.filter(
    (i) => i.interactionTypeID >= typeCode
  );
  const unique = [...new Set(selfDirected.map((i) => i.interactionTypeID))];
  return unique.length;
};

const calculateCourseMultiplier = (interactions, types) => {
  const typeCode = types.find(
    (type) => type.interactionCode === 'course'
  ).interactionTypeID;
  const courseInteractions = interactions.filter(
    (i) => i.interactionTypeID === typeCode
  );
  const limit = types.find(
    (type) => type.interactionCode === 'course'
  ).multiplierLimit;

  if (courseInteractions.length >= limit) {
    return limit;
  } else {
    return courseInteractions.length;
  }
};

module.exports = {
  calculateMultiplier,
};
