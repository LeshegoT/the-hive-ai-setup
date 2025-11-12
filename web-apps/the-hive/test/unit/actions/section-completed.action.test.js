import {
  SECTION_COMPLETED,
  sectionCompleted
} from '../../../src/actions/section-completed.action.js';

import { expect } from '@open-wc/testing';

describe('Action - SECTION_COMPLETED', () => {
  it('returns an new action', async () => {
    let sectionId = 1;

    const action = sectionCompleted(sectionId);

    expect(action.type).to.equal(SECTION_COMPLETED);
    expect(action).to.deep.equal({
      type: SECTION_COMPLETED,
      sectionId
    });
  });
});
