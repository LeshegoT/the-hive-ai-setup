import { expect } from '@open-wc/testing';
import { quests } from '../../../src/reducers/quests.reducer';
import { initialise_reducer_test } from '../shared/reducer';
import { USER_DATA_RECEIVED } from '../../../src/actions/user-data-received.action';
import { QUEST_CREATED } from '../../../src/actions/quest-created.action';
import { QUEST_UPDATED } from '../../../src/actions/quest-updated.action';
import { MISSIONS_RECEIVED } from '../../../src/actions/missions-received.action';
import { HERO_MISSIONS_RECEIVED } from '../../../src/actions/hero-missions-received.action';
import { USER_HAS_OLD_QUESTS } from '../../../src/actions/user-has-old-quests.action';
import { HERO_QUESTS_RECEIVED } from '../../../src/actions/hero-quests-received.action';

describe('Reducer - Quest', () => {
  let initial_state = {
    current: {},
    missions: [],
    all: [],
    oldQuests: false,
    pausedQuests: []
  };

  let test_reducer_state = initialise_reducer_test(quests, initial_state);

  it('should initialise correctly.', () => {
    let state = quests(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  let test_quest_reducer = (action_name) => {
    it(`should update the state on a ${action_name} action .`, () => {
      let action = {
        type: action_name,
        quest: {
          id: 1
        },
        missions: [1]
      };

      let delta = {
        current: {
          id: 1
        },
        missions: [1]
      };

      test_reducer_state(action, delta);
    });
  };

  test_quest_reducer(USER_DATA_RECEIVED);
  test_quest_reducer(QUEST_CREATED);
  test_quest_reducer(QUEST_UPDATED);

  it(`should update the state on a MISSIONS_RECEIVED action .`, () => {
    let action = {
      type: MISSIONS_RECEIVED,
      missions: [1]
    };

    let delta = {
      missions: [1]
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a HERO_MISSIONS_RECEIVED action .`, () => {
    let action = {
      type: HERO_MISSIONS_RECEIVED,
      missions: [1]
    };

    let delta = {
      missions: [1]
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a HERO_QUESTS_RECEIVED action .`, () => {
    let action = {
      type: HERO_QUESTS_RECEIVED,
      quests: [1]
    };

    let delta = {
      all: [1]
    };

    test_reducer_state(action, delta);
  });

  it('should update oldQuests and pausedQuests on USER_HAS_OLD_QUESTS action.', () => {
    let action = {
      type: USER_HAS_OLD_QUESTS,
      quests: [{status: 'paused'}]
    };

    let delta = {
      oldQuests: true,
      pausedQuests: [{status: 'paused'}]
    };

    test_reducer_state(action, delta);
  });
});
