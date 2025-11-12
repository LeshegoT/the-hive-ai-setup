import { expect } from '@open-wc/testing';
import { selectSettings } from '../../../src/selectors/settings.selectors';

describe('Selector - Settings', () => {
  it('should return all settings', () => {
    let state = {
      settings: {
      }
    };

    let actual = selectSettings(state);

    expect(actual).to.deep.equal(state.settings);
  });
});