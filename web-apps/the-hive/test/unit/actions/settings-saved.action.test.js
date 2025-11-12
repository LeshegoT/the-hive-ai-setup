import {
  SETTINGS_SAVED,
  settingsSaved
} from '../../../src/actions/settings-saved.action';

import { expect } from '@open-wc/testing';

describe('Action - SETTINGS_SAVED', () => {
  it('returns an new action', async () => {
    let settings = [{code: 'email-notification', value: true}, {code: 'appear-anonymously', value: true}];

    const action = settingsSaved(settings);

    expect(action.type).to.equal(SETTINGS_SAVED);
    expect(action).to.deep.equal({
      type: SETTINGS_SAVED,
      settings
    });
  });
});