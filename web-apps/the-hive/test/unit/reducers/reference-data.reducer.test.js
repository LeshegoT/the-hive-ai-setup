import { expect } from '@open-wc/testing';
import { initialise_reducer_test } from '../shared/reducer';
import { referenceData } from '../../../src/reducers/reference-data.reducer';
import { REFERENCE_DATA_RECEIVED } from '../../../src/actions/reference-data-received.action';

describe('Reducer - Reference data', () => {
  let initial_state = {
    missionTypes: [],
    questTypes: [],
    specialisations: [],
    levels: [],
    messageTypes: [],
    levelUpActivityTypes: [],
    sideQuestTypes: [],
    guideDetails: []
  };

  let test_reducer_state = initialise_reducer_test(referenceData, initial_state);

  it('should initialise correctly.', () => {
    let state = referenceData(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it(`should update the state on a REFERENCE_DATA_RECEIVED action.`, () => {
    let action = {
      type: REFERENCE_DATA_RECEIVED,
      referenceData: {
        missionTypes: [{ missionTypeId: 1 }],
        questTypes: [{ questTypeId: 1 }],
        specialisations: [{ specialisationId: 1 }],
        levels: [{ levelId: 1 }],
        messageTypes: [{ messageTypeId: 1 }]
      }
    };

    let delta = {
        missionTypes: [{ missionTypeId: 1 }],
        questTypes: [{ questTypeId: 1 }],
        specialisations: [{ specialisationId: 1 }],
        levels: [{ levelId: 1 }],
        messageTypes: [{ messageTypeId: 1 }]
    };

    test_reducer_state(action, delta);
  });
});
