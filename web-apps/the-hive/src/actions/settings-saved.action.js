export const SETTINGS_SAVED = 'SETTINGS_SAVED';

export const settingsSaved = (settings) => {
  return {
    type: SETTINGS_SAVED,
    settings
  };
};
