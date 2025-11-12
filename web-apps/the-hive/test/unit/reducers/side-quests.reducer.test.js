import { expect } from '@open-wc/testing';
import { sideQuests } from '../../../src/reducers/side-quests.reducer';
import { SIDE_QUESTS_RECEIVED } from '../../../src/actions/side-quests-received.action';
import { initialise_reducer_test } from '../shared/reducer';
import { USER_DATA_RECEIVED } from '../../../src/actions/user-data-received.action';
import { SIDE_QUEST_REGISTERED } from '../../../src/actions/side-quest-registered.action';


describe('Reducer - Side Quests', () => {
  let initial_state = {
    all: undefined,
    user: []
  };

  let test_reducer_state = initialise_reducer_test(sideQuests, initial_state);

  it('should initialise correctly.', () => {
    let state = sideQuests(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it(`should update the state on a SIDE_QUESTS_RECEIVED action.`, () => {
    let action = {
      type: SIDE_QUESTS_RECEIVED,
      sideQuests: [{ sideQuestId: 1 }]
    };

    let delta = {
        all: action.sideQuests
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a USER_DATA_RECEIVED action.`, () => {
    let action = {
      type: USER_DATA_RECEIVED,
      sideQuests: [{ sideQuestId: 1 }]
    };

    let delta = {
        user: action.sideQuests
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a SIDE_QUEST_REGISTERED action.`, () => {
    let action = {
      type: SIDE_QUEST_REGISTERED,
      sideQuest: { sideQuestId: 1 }
    };

    let delta = {
        user: [action.sideQuest]
    };

    test_reducer_state(action, delta);
  });
});
