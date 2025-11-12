export const RATINGS_RECEIVED = 'RATINGS_RECEIVED';

export const ratingsReceived = (ratings) => {
  return {
    type: RATINGS_RECEIVED,
    ratings,
  };
};
