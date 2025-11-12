export const NEW_VERSION_PROMPT = 'NEW_VERSION_PROMPT';

export const newVersionPrompt = (callback) => {
  return {
    type: NEW_VERSION_PROMPT,
    callback
  };
};
