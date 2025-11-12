import { USER_DATA_RECEIVED } from '../actions/user-data-received.action';
import { SETTINGS_SAVED } from '../actions/settings-saved.action';

const INITIAL_STATE = {
  'email-notification': true,
  'appear-anonymously': false
};

export const settings = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case SETTINGS_SAVED:
    case USER_DATA_RECEIVED:
      let user_settings = action.settings.reduce((aggregate, setting) => {
        return { ...aggregate, [setting.code]: setting.value };
      }, {});

      return {
        ...state,
        ...user_settings
      };
    default:
      return state;
  }
};
