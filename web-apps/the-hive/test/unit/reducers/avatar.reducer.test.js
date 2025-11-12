import { expect } from '@open-wc/testing';

import { avatar } from '../../../src/reducers/avatar.reducer';
import { USER_DATA_RECEIVED } from '../../../src/actions/user-data-received.action';
import { PARTS_RECEIVED } from '../../../src/actions/parts-received.action';
import { AVATAR_COLOUR_CHANGED } from '../../../src/actions/avatar-colour-changed.action';
import { AVATAR_PARTS_CHANGED } from '../../../src/actions/avatar-parts-changed.action';
import { CLAIM_PARTS_RECEIVED } from '../../../src/actions/claim-parts-received.action';
import { CLAIM_PARTS_CHOSEN } from '../../../src/actions/claim-parts-chosen.action';
import { QUEST_CREATED } from '../../../src/actions/quest-created.action';
import { initialise_reducer_test, test_reducer_action } from '../shared/reducer';

describe('Reducer - Avatar', () => {
  let initial_state = {
    body: {},
    parts: [],
    all: [],
    claimParts: [],
    numberOfPartsAvailable: 0
  };

  let test_reducer_state = initialise_reducer_test(avatar, initial_state);

  it('should initialise correctly.', () => {
    let state = avatar(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it('should update the state on a USER_DATA_RECEIVED action.', () => {
    let action = {
      type: USER_DATA_RECEIVED,
      avatar: {},
      parts: {},
      numberOfPartsAvailable: 1
    };

    let delta = {
      body: action.avatar,
      parts: action.parts,
      numberOfPartsAvailable: action.numberOfPartsAvailable
    };

    test_reducer_state(action, delta);
  });

  it('should update the state on a PARTS_RECEIVED action.', () => {
    let action = {
      type: PARTS_RECEIVED,
      parts: [1]
    };

    let delta = {
      all: action.parts
    };

    test_reducer_state(action, delta);
  });

  it('should update the state on a AVATAR_COLOUR_CHANGED action.', () => {
    let delta = { body: { red: 255, green: 255, blue: 255 } };
    let action = {
      type: AVATAR_COLOUR_CHANGED,
      ...delta.body
    };

    test_reducer_state(action, delta);
  });

  it('should update the state on a AVATAR_PARTS_CHANGED action.', () => {
    let delta = { parts: [1] };
    let action = {
      type: AVATAR_PARTS_CHANGED,
      ...delta
    };

    test_reducer_state(action, delta);
  });

  it('should update the state on a CLAIM_PARTS_RECEIVED action.', () => {
    let delta = { claimParts: [1] };
    let action = {
      type: CLAIM_PARTS_RECEIVED,
      ...delta
    };

    test_reducer_state(action, delta);
  });

  it('should update the state on a CLAIM_PARTS_CHOSEN action.', () => {
    let delta = { parts: [1], claimParts: [], numberOfPartsAvailable: 0 };
    let action = {
      type: CLAIM_PARTS_CHOSEN,
      ...delta
    };

    test_reducer_state(action, delta);
  });

  it('should update the state on a QUEST_CREATED action.', () => {
    let action = {
      type: QUEST_CREATED,
      numberOfPartsAvailable: 2,
      avatar: {}
    };

    let delta = {
      numberOfPartsAvailable: 2,
      body: {}
    };

    test_reducer_state(action, delta);
  });
});
