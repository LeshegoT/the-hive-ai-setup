import {
  RESET_EDITING_QUEST,
  resetEditingQuest
} from '../../../src/actions/reset-editing-quest.action.js';

import { expect } from '@open-wc/testing';

describe('Action - RESET_EDITING_QUEST', () => {
  it('returns an new action', async () => {
    const action = resetEditingQuest();

    expect(action.type).to.equal(RESET_EDITING_QUEST);
    expect(action).to.deep.equal({
      type: RESET_EDITING_QUEST
    });
  });
});
