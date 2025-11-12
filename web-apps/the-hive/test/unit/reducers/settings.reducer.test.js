import { expect } from '@open-wc/testing';
import { settings } from '../../../src/reducers/settings.reducer';
import { initialise_reducer_test } from '../shared/reducer';
import { USER_DATA_RECEIVED } from '../../../src/actions/user-data-received.action';
import { SETTINGS_SAVED } from '../../../src/actions/settings-saved.action';

describe('Reducer - Settings', () => {
  let initial_state = {
    'email-notification': true,
    'appear-anonymously': false
  };

  let test_reducer_state = initialise_reducer_test(settings, initial_state);

  it('should initialise correctly.', () => {
    let state = settings(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it(`should update the state on a USER_DATA_RECEIVED action .`, () => {
    let action = {
      type: USER_DATA_RECEIVED,
      settings: [{code: 'email-notification', value: true}, {code: 'appear-anonymously', value: true}]
    };

    let delta = {
      'email-notification': true,
      'appear-anonymously': true
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a SETTINGS_SAVED action .`, () => {
    let action = {
      type: SETTINGS_SAVED,
      settings: [{code: 'email-notification', value: true}, {code: 'appear-anonymously', value: true}]
    };

    let delta = {
      'email-notification': true,
      'appear-anonymously': true
    };

    test_reducer_state(action, delta);
  });
});