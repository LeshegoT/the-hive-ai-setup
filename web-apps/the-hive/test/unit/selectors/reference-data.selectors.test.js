import {
  selectMissionTypes,
  selectQuestTypes,
  selectSpecialisations,
  selectLevels,
  selectMessageTypes,
  selectLevelUpActivityTypes,
  selectLevelUpActivityType,
  selectSideQuestTypes,
  selectGuideDetails
} from '../../../src/selectors/reference-data.selectors';

import { expect } from '@open-wc/testing';

let create_state = (reference_data) => ({
  referenceData: {
    ...reference_data
  }
});

describe('Selector - Reference Data', () => {
  it('should return mission types', () => {
    let state = create_state({
      missionTypes: [{ missionTypeId: 1 }, { missionTypeId: 2 }, { missionTypeId: 3 }]
    });

    let missionTypes = selectMissionTypes(state);

    expect(missionTypes).to.be.ok;
    expect(missionTypes).to.deep.equal([...state.referenceData.missionTypes]);
  });

  it('should return quest types', () => {
    let state = create_state({
      questTypes: [{ questTypeId: 1 }, { questTypeId: 2 }, { questTypeId: 3 }]
    });

    let questTypes = selectQuestTypes(state);

    expect(questTypes).to.be.ok;
    expect(questTypes).to.deep.equal([...state.referenceData.questTypes]);
  });

  it('should return specialisations', () => {
    let state = create_state({
      specialisations: [
        { specialisationId: 1 },
        { specialisationId: 2 },
        { specialisationId: 3 }
      ]
    });
    let specialisations = selectSpecialisations(state);

    expect(specialisations).to.be.ok;
    expect(specialisations).to.deep.equal([...state.referenceData.specialisations]);
  });

  it('should return levels', () => {
    let state = create_state({
      levels: [{ levelId: 1 }, { levelId: 2 }, { levelId: 3 }]
    });

    let levels = selectLevels(state);

    expect(levels).to.be.ok;
    expect(levels).to.deep.equal([...state.referenceData.levels]);
  });

  it('should return message types', () => {
    let state = create_state({
      messageTypes: [{ messageTypeId: 1 }, { messageTypeId: 2 }, { messageTypeId: 3 }]
    });

    let messageTypes = selectMessageTypes(state);

    expect(messageTypes).to.be.ok;
    expect(messageTypes).to.deep.equal([...state.referenceData.messageTypes]);
  });

  it('should return level up activity types', () => {
    let state = create_state({
      levelUpActivityTypes: [{ levelUpActivityTypeId: 1 }, { levelUpActivityTypeId: 2 }, { levelUpActivityTypeId: 3 }]
    });

    let levelUpActivityTypes = selectLevelUpActivityTypes(state);

    expect(levelUpActivityTypes).to.be.ok;
    expect(levelUpActivityTypes).to.deep.equal([...state.referenceData.levelUpActivityTypes]);
  });

  it('should return level up activity type', () => {
    let levelUpActivityTypes = [{ levelUpActivityTypeId: 1, code: '1' }, { levelUpActivityTypeId: 2, code: '2' }, { levelUpActivityTypeId: 3, code: '3' }];
    let levelUpActivityTypeCode = '1';

    let actual = selectLevelUpActivityType.resultFunc(levelUpActivityTypes, levelUpActivityTypeCode);

    expect(actual).to.be.ok;
    expect(actual).to.deep.equal(levelUpActivityTypes[0]);
  });

  it('should return side quest types', () => {
    let state = create_state({
      sideQuestTypes: [{ sideQuestTypeId: 1 }, { sideQuestTypeId: 2 }, { sideQuestTypeId: 3 }],
    });

    let expected = [{ sideQuestTypeId: 1 }, { sideQuestTypeId: 2 }, { sideQuestTypeId: 3 }];

    let actual = selectSideQuestTypes(state);

    expect(actual.length).to.equal(3);
    expect(expected).to.deep.equal(actual);
  });

  it('should return guide details', () => {
    let state = create_state({
      guideDetails: { guideId: 1 }
    });

    let expected = { guideId: 1 }

    let actual = selectGuideDetails(state);

    expect(expected).to.deep.equal(actual);
  });
});
