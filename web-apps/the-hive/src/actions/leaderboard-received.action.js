export const LEADERBOARD_RECEIVED = 'LEADERBOARD_RECEIVED';

export const leaderboardReceived = (heroes) => {
  return {
    type: LEADERBOARD_RECEIVED,
    heroes
  };
};
