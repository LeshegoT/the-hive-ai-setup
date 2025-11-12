import { expect } from '@open-wc/testing';
import { heroes } from '../../../src/reducers/heroes.reducer';
import { initialise_reducer_test, test_reducer_action } from '../shared/reducer';
import { USER_DATA_RECEIVED } from '../../../src/actions/user-data-received.action';
import { HEROES_RECEIVED } from '../../../src/actions/heroes-received.action';
import { HERO_QUEST_RECEIVED } from '../../../src/actions/hero-quest-received.action';
import { QUEST_EXISTS_ERROR_RECEIVED } from '../../../src/actions/quest-exists-error-received.action';


describe('Reducer - Heroes', () => {
  let initial_state = {
    all: [],
    isGuide: false,
    existingQuest: {},
    guideRequests: []
  };

  let test_reducer_state = initialise_reducer_test(heroes, initial_state);

  it('should initialise correctly.', () => {
    let state = heroes(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it(`should update the state on a HEROES_RECEIVED action.`, () => {
    let action = {
      type: HEROES_RECEIVED,
      heroes: [{ questId: 1 }]
    };

    let delta = {
        all: action.heroes
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a HERO_QUEST_RECEIVED action.`, () => {
    let action = {
      type: HERO_QUEST_RECEIVED,
      quest: { questId: 1 }
    };

    let delta = {
        all: [action.quest]
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a QUEST_EXISTS_ERROR_RECEIVED action.`, () => {
    let action = {
      type: QUEST_EXISTS_ERROR_RECEIVED,
      quest: { questId: 1 }
    };

    let delta = {
        existingQuest: action.quest
    };

    test_reducer_state(action, delta);
  });

  test_reducer_action(heroes, initial_state, USER_DATA_RECEIVED, { isGuide: true, guideRequests: [] });
});
