export const MESSAGES_RECEIVED = 'MESSAGES_RECEIVED';
export const FEEDBACK_RECEIVED = 'FEEDBACK_RECEIVED';

export const messagesReceived = (messages) => {
  return {
    type: MESSAGES_RECEIVED,
    messages
  };
};

export const feedbackReceived = (messages) => {
  return {
    type: FEEDBACK_RECEIVED,
    messages
  };
};