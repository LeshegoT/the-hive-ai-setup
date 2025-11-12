export const TAGS_RECEIVED = 'TAGS_RECEIVED';
export const TAGS_ADDED = 'TAGS_ADDED';

export const tagsReceived = (tags) => {
  return {
    type: TAGS_RECEIVED,
    tags,
  };
};

export const tagsAdded = (tags) => {
  return {
    type: TAGS_ADDED,
    tags,
  };
};
