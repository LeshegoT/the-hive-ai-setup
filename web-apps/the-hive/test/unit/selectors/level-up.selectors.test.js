import { expect } from '@open-wc/testing';
import {
  selectAllLevelUps,
  selectLevelUps,
  selectLevelUp,
  selectUpcomingLevelUps,
  selectPastLevelUps,
  selectUserLevelUps
} from '../../../src/selectors/level-up.selectors';

describe('Selector - Level-Up', () => {
  let someFutureEndDate = new Date();
  someFutureEndDate.setFullYear(someFutureEndDate.getFullYear() + 1);

  it('should return all level ups', () => {
    let state = {
      levelUps: {
        all: [{ levelUpId: 1 }, { levelUpId: 2 }, { levelUpId: 3 }]
      }
    };

    let levelUps = selectAllLevelUps(state);

    expect(levelUps).to.deep.equal(state.levelUps.all);
  });

  it('should return user level ups', () => {
    let state = {
      levelUps: {
        user: [{ levelUpId: 1 }, { levelUpId: 2 }, { levelUpId: 3 }]
      }
    };

    let levelUps = selectUserLevelUps(state);

    expect(levelUps).to.deep.equal(state.levelUps.user);
  });

  it('should select level ups with activities and courses', () => {
    let levelUps = [
      { levelUpId: 1, courseIds: [1, 2], startDate: '2019-01-01', endDate: '2020-01-01' },
      { levelUpId: 2, courseIds: [3, 4], startDate: '2019-01-01', endDate: '2020-01-01' },
      { levelUpId: 3, courseIds: [5, 6], startDate: '2019-01-01', endDate: '2020-01-01' }
    ];
    let courses = [
      { courseId: 1 },
      { courseId: 2 },
      { courseId: 3 },
      { courseId: 4 },
      { courseId: 5 },
      { courseId: 6 }
    ];
    let levelUpActivities = [
      { levelUpActivityId: 1, levelUpId: 1 },
      { levelUpActivityId: 2, levelUpId: 1 },
      { levelUpActivityId: 3, levelUpId: 2 },
      { levelUpActivityId: 4, levelUpId: 2 },
      { levelUpActivityId: 5, levelUpId: 3 },
      { levelUpActivityId: 6, levelUpId: 3 }
    ];
    let userLevelUps = [{levelUpId: 1}];

    let expected = [
      {
        levelUpId: 1,
        courseIds: [1, 2],
        courses: [{ courseId: 1 }, { courseId: 2 }],
        levelUpActivities: [
          { levelUpActivityId: 1, levelUpId: 1 },
          { levelUpActivityId: 2, levelUpId: 1 }
        ],
        startDate: new Date('2019-01-01'),
        endDate: new Date('2020-01-01'),
        registered: true
      },
      {
        levelUpId: 2,
        courseIds: [3, 4],
        courses: [{ courseId: 3 }, { courseId: 4 }],
        levelUpActivities: [
          { levelUpActivityId: 3, levelUpId: 2 },
          { levelUpActivityId: 4, levelUpId: 2 }
        ],
        startDate: new Date('2019-01-01'),
        endDate: new Date('2020-01-01'),
        registered: false
      },
      {
        levelUpId: 3,
        courseIds: [5, 6],
        courses: [{ courseId: 5 }, { courseId: 6 }],
        levelUpActivities: [
          { levelUpActivityId: 5, levelUpId: 3 },
          { levelUpActivityId: 6, levelUpId: 3 }
        ],
        startDate: new Date('2019-01-01'),
        endDate: new Date('2020-01-01'),
        registered: false
      }
    ];

    let actual = selectLevelUps.resultFunc(levelUps, courses, levelUpActivities, userLevelUps);

    expect(expected).to.deep.equal(actual);
  });

  it('should select level ups with no activities and no courses', () => {
    let levelUps = [
      { levelUpId: 1, courseIds: [1, 2] },
      { levelUpId: 2, courseIds: [3, 4] },
      { levelUpId: 3, courseIds: [5, 6] }
    ];
    let userLevelUps = [{levelUpId: 1}];

    let expected = [
      {
        levelUpId: 1,
        courseIds: [1, 2],
        courses: [],
        levelUpActivities: [],
        startDate: new Date(undefined),
        endDate: new Date(undefined),
        registered: true
      },
      {
        levelUpId: 2,
        courseIds: [3, 4],
        courses: [],
        levelUpActivities: [],
        startDate: new Date(undefined),
        endDate: new Date(undefined),
        registered: false
      },
      {
        levelUpId: 3,
        courseIds: [5, 6],
        courses: [],
        levelUpActivities: [],
        startDate: new Date(undefined),
        endDate: new Date(undefined),
        registered: false
      }
    ];

    let actual = selectLevelUps.resultFunc(levelUps, undefined, undefined, userLevelUps);

    expect(expected).to.deep.equal(actual);
  });

  it('should select a single level up', () => {
    let levelUps = [
      { levelUpId: 1, courseIds: [1, 2] },
      { levelUpId: 2, courseIds: [3, 4] },
      { levelUpId: 3, courseIds: [5, 6] }
    ];
    let levelUpId = 1;

    let expected = { levelUpId: 1, courseIds: [1, 2] };

    let actual = selectLevelUp.resultFunc(levelUps, levelUpId);

    expect(expected).to.deep.equal(actual);
  });

  it('should select upcoming level ups', () => {
    let levelUps = [
      { levelUpId: 1, courseIds: [1, 2], startDate: new Date('2019-01-01'), endDate: new Date('2019-02-01') },
      { levelUpId: 2, courseIds: [3, 4], startDate: new Date('2019-02-01'), endDate: new Date('2019-03-01') },
      { levelUpId: 3, courseIds: [5, 6], startDate: new Date('2019-01-01'), endDate: someFutureEndDate }
    ];

    let expected = [
      { levelUpId: 3, courseIds: [5, 6], startDate: new Date('2019-01-01'), endDate: someFutureEndDate }
    ];

    let actual = selectUpcomingLevelUps.resultFunc(levelUps);

    expect(expected).to.deep.equal(actual);
  });

  it('should select past level ups', () => {
    let levelUps = [
      { levelUpId: 1, courseIds: [1, 2], startDate: new Date('2019-01-01'), endDate: new Date('2019-02-01') },
      { levelUpId: 2, courseIds: [3, 4], startDate: new Date('2019-02-01'), endDate: new Date('2019-03-01') },
      { levelUpId: 3, courseIds: [5, 6], startDate: new Date('2019-01-01'), endDate: someFutureEndDate }
    ];

    let expected = [
      { levelUpId: 2, courseIds: [3, 4], startDate: new Date('2019-02-01'), endDate: new Date('2019-03-01') },
      { levelUpId: 1, courseIds: [1, 2], startDate: new Date('2019-01-01'), endDate: new Date('2019-02-01') }
    ];

    let actual = selectPastLevelUps.resultFunc(levelUps);

    expect(expected).to.deep.equal(actual);
  });
});
