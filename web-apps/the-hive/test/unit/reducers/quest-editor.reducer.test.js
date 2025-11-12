import { expect } from '@open-wc/testing';
import { questEditor } from '../../../src/reducers/quest-editor.reducer';
import { initialise_reducer_test, test_reducer_action } from '../shared/reducer';
import { EDITING_MISSSIONS_UPDATED } from '../../../src/actions/editing-missions-updated.action';
import { EDITING_QUEST_UPDATED } from '../../../src/actions/editing-quest-updated.action';
import { RESET_EDITING_QUEST } from '../../../src/actions/reset-editing-quest.action';
import { QUEST_EDITOR_ERRORS_FOUND } from '../../../src/actions/quest-editor-errors-found.action';
import { QUEST_MISSION_TO_UPDATE_UPDATED } from '../../../src/actions/quest-mission-to-update-updated.action';

describe('Reducer - Quest Editor', () => {
  let initial_state = {
    quest: {},
    missions: [],
    errors: [],
    missionToUpdate: {}
  };

  let test_reducer_state = initialise_reducer_test(questEditor, initial_state);

  it('should initialise correctly.', () => {
    let state = questEditor(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  test_reducer_action(questEditor, initial_state, EDITING_MISSSIONS_UPDATED, { missions: [1] });
  test_reducer_action(questEditor, initial_state, EDITING_QUEST_UPDATED, { quest: { questId: 1 } });
  test_reducer_action(questEditor, initial_state, RESET_EDITING_QUEST, initial_state);
  test_reducer_action(questEditor, initial_state, QUEST_EDITOR_ERRORS_FOUND, { errors: ['wat?'] });

  it(`should update the state on a QUEST_MISSION_TO_UPDATE_UPDATED action.`, () => {
    let action = {
      type: QUEST_MISSION_TO_UPDATE_UPDATED,
      mission: { missionId: 1 }
    };

    let delta = {
      missionToUpdate: action.mission
    };

    test_reducer_state(action, delta);
  });
});
