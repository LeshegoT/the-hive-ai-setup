export const QUEST_CREATED = 'QUEST_CREATED';

export const questCreated = (response) => {
  return {
    type: QUEST_CREATED,
    ...response
  };
};
