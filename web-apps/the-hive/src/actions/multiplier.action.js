export const MULTIPLIER_RECEIVED = 'MULTIPLIER_RECEIVED';

export const multiplierReceived = (multiplier) => {
  return {
    type: MULTIPLIER_RECEIVED,
    multiplier,
  };
};
