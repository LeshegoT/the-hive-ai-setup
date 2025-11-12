import { expect } from '@open-wc/testing';
import {
  selectAllLevelUpActivities,
  selectLevelUpActivities,
  selectUpcomingLevelUpActivities,
  selectUserLevelUpActivities,
  selectLevelUpActivity
} from '../../../src/selectors/level-up-activity.selectors';

describe('Selector - Level-Up Activities', () => {
  it('should return all level up activities', () => {
    let state = {
      levelUpActivities: {
        all: [
          { levelUpActivityId: 1 },
          { levelUpActivityId: 2 },
          { levelUpActivityId: 3 }
        ]
      }
    };

    let levelUpActivities = selectAllLevelUpActivities(state);

    expect(levelUpActivities).to.deep.equal(state.levelUpActivities.all);
  });

  it('should return user level up activities', () => {
    let state = {
      levelUpActivities: {
        user: [
          { levelUpActivityId: 1 }
        ]
      }
    };

    let userLevelUpActivities = selectUserLevelUpActivities(state);

    expect(userLevelUpActivities).to.deep.equal(state.levelUpActivities.user);
  });

  it('should select level up activities with types', () => {
    let levelUpActivities = [
      { levelUpActivityId: 1, levelUpActivityTypeId: 1, activityDate: '2019-01-01' },
      { levelUpActivityId: 2, levelUpActivityTypeId: 1, activityDate: '2019-01-01' },
      { levelUpActivityId: 3, levelUpActivityTypeId: 2, activityDate: '2019-01-01' }
    ];
    let levelUpActivityTypes = [
      { levelUpActivityTypeId: 1 },
      { levelUpActivityTypeId: 2 }
    ];
    let userLevelUpActivities = [{ levelUpActivityId: 2 }];

    let expected = [
      {
        levelUpActivityId: 1,
        levelUpActivityTypeId: 1,
        activityDate: new Date('2019-01-01'),
        levelUpActivityType: { levelUpActivityTypeId: 1 },
        attended: false
      },
      {
        levelUpActivityId: 2,
        levelUpActivityTypeId: 1,
        activityDate: new Date('2019-01-01'),
        levelUpActivityType: { levelUpActivityTypeId: 1 },
        attended: true
      },
      {
        levelUpActivityId: 3,
        levelUpActivityTypeId: 2,
        activityDate: new Date('2019-01-01'),
        levelUpActivityType: { levelUpActivityTypeId: 2 },
        attended: false
      }
    ];

    let actual = selectLevelUpActivities.resultFunc(
      levelUpActivities,
      levelUpActivityTypes,
      userLevelUpActivities
    );

    expect(expected).to.deep.equal(actual);
  });

  it('should select level up activity based on ID', () => {
    let levelUpActivities = [
      {
        levelUpActivityId: 1,
        levelUpActivityTypeId: 1,
        activityDate: new Date('2019-01-01'),
        levelUpActivityType: { levelUpActivityTypeId: 1 },
        attended: false
      },
      {
        levelUpActivityId: 2,
        levelUpActivityTypeId: 1,
        activityDate: new Date('2019-01-01'),
        levelUpActivityType: { levelUpActivityTypeId: 1 },
        attended: true
      },
      {
        levelUpActivityId: 3,
        levelUpActivityTypeId: 2,
        activityDate: new Date('2019-01-01'),
        levelUpActivityType: { levelUpActivityTypeId: 2 },
        attended: false
      }
    ];
    let levelUpActivityId = 2;

    let expected = {
      levelUpActivityId: 2,
      levelUpActivityTypeId: 1,
      activityDate: new Date('2019-01-01'),
      levelUpActivityType: { levelUpActivityTypeId: 1 },
      attended: true
    };

    let actual = selectLevelUpActivity.resultFunc(
      levelUpActivities,
      levelUpActivityId
    );

    expect(expected).to.deep.equal(actual);
  });

  it('should select upcoming level up activities', () => {
    let levelUpActivities = [
      { levelUpActivityId: 1, activityDate: new Date('2019-01-01') },
      { levelUpActivityId: 2, activityDate: new Date('2019-01-01') },
      { levelUpActivityId: 3, activityDate: new Date('3000-01-01') }
    ];

    let expected = [
      {
        levelUpActivityId: 3,
        activityDate: new Date('3000-01-01')
      }
    ];

    let actual = selectUpcomingLevelUpActivities.resultFunc(levelUpActivities);

    expect(expected).to.deep.equal(actual);
  });
});
