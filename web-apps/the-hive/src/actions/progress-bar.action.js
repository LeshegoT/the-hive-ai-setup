export const PROGRESS_BAR_STATE_RECEIVED = 'PROGRESS_BAR_STATE_RECEIVED';

export const progressBarStateReceived = (progressStatePos) => {
  return {
    type: PROGRESS_BAR_STATE_RECEIVED,
    progressStatePos
  }
};