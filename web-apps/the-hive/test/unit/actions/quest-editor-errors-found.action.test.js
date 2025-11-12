import {
  QUEST_EDITOR_ERRORS_FOUND,
  questEditorErrorsFound
} from '../../../src/actions/quest-editor-errors-found.action.js';

import { expect } from '@open-wc/testing';

describe('Action - QUEST_EDITOR_ERRORS_FOUND', () => {
  it('returns an new action', async () => {
    // TODO: Make this more reflective of the actual part data
    // that we're expecting. - Mike Geyser, 2019-09-10
    let errors = [1, 2, 3];

    const action = questEditorErrorsFound(errors);

    expect(action.type).to.equal(QUEST_EDITOR_ERRORS_FOUND);
    expect(action).to.deep.equal({
      type: QUEST_EDITOR_ERRORS_FOUND,
      errors
    });
  });
});
