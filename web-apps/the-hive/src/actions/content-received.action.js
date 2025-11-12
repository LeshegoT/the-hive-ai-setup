export const CONTENT_RECEIVED = 'CONTENT_RECEIVED';
export const CONTENT_ADDED = 'CONTENT_ADDED';

export const contentReceived = (content) => {
  return {
    type: CONTENT_RECEIVED,
    content,
  };
};

export const contentAdded = (content) => {
  return {
    type: CONTENT_ADDED,
    content,
  };
};
