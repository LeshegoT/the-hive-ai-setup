import { expect } from '@open-wc/testing';
import { app } from '../../../src/reducers/app.reducer';
import { initialise_reducer_test, test_reducer_action } from '../shared/reducer';
import {
  UPDATE_PAGE,
  UPDATE_OFFLINE,
  UPDATE_DRAWER_STATE,
  OPEN_SNACKBAR,
  CLOSE_SNACKBAR,
} from '../../../src/actions/app.action';
import { NEW_VERSION_PROMPT } from '../../../src/actions/new-version-prompt.action';
import { UPDATE_VERSION } from '../../../src/actions/update-version.action';

describe('Reducer - App', () => {
  let initial_state = {
    drawerOpened: false,
    offline: false,
    page: '',
    newVersion: false,
    updateVersion: false,
    loggedIn:false
  };

  let test_reducer_state = initialise_reducer_test(app, initial_state);

  it('should initialise correctly.', () => {
    let state = app(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it('should update the state on a UPDATE_DRAWER_STATE action.', () => {
    let action = {
      type: UPDATE_DRAWER_STATE,
      opened: true
    };

    let delta = {
      drawerOpened: true
    };

    test_reducer_state(action, delta);
  });

  test_reducer_action(app, initial_state, UPDATE_PAGE, { page: '/', routeData: [] });
  test_reducer_action(app, initial_state, UPDATE_OFFLINE, { offline: false });
  test_reducer_action(app, initial_state, OPEN_SNACKBAR, { snackbarOpened: true });
  test_reducer_action(app, initial_state, CLOSE_SNACKBAR, { snackbarOpened: false });
  test_reducer_action(app, initial_state, NEW_VERSION_PROMPT, { newVersion: true });
  test_reducer_action(app, initial_state, UPDATE_VERSION, { updateVersion: true });
});
