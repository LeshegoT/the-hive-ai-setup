import {
  UPDATE_PAGE,
  UPDATE_OFFLINE,
  OPEN_SNACKBAR,
  CLOSE_SNACKBAR,
  UPDATE_DRAWER_STATE
} from '../actions/app.action';
import { LOGGED_IN, NOT_LOGGED_IN} from '../actions/auth.action';
import { NEW_VERSION_PROMPT } from '../actions/new-version-prompt.action';
import { UPDATE_VERSION } from '../actions/update-version.action';

export const INITIAL_STATE = {
  page: '',
  offline: false,
  drawerOpened: false,
  newVersion: false,
  updateVersion: false,
  loggedIn:false
};

export const app = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case UPDATE_PAGE:
      return {
        ...state,
        page: action.page,
        routeData: action.routeData
      };
    case UPDATE_OFFLINE:
      return {
        ...state,
        offline: action.offline
      };
    case UPDATE_DRAWER_STATE:
      return {
        ...state,
        drawerOpened: action.opened
      };
    case OPEN_SNACKBAR:
      return {
        ...state,
        snackbarOpened: true
      };
    case CLOSE_SNACKBAR:
      return {
        ...state,
        snackbarOpened: false
      };
    case NEW_VERSION_PROMPT:
      return {
        ...state,
        newVersion: true
      };
    case UPDATE_VERSION:
      return {
        ...state,
        updateVersion: true
      };
    case NOT_LOGGED_IN:
        return {
          ...state,
          loggedIn: false,
        }
    case LOGGED_IN:
      return {
          ...state,
          loggedIn: true,
        };
    default:
      return state;
  }
};
