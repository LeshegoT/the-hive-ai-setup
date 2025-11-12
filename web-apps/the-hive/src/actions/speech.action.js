export const SPEECH_RECEIVED = 'SPEECH_RECEIVED';

export const speechReceived = (speech) => {
  return {
    type: SPEECH_RECEIVED,
    speech,
  };
};
