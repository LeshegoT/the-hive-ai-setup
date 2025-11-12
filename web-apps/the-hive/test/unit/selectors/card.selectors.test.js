import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import {
  selectLevelUpCards,
  selectSideQuestCards,
  selectLastMonthPointsCard,
  selectPrescribedCoursesCards,
  selectCards
} from '../../../src/selectors/card.selectors';

describe('Selector - Card', () => {
  it('should return all level up cards', () => {
    let callback = sinon.fake()

    let upcoming_level_ups = [
      {
        levelUpId: 1,
        name: 'Test Level Up',
        icon: 'images/logos/my-awesome-icon.svg'
      }
    ];

    let upcoming_activities = [
      {
        levelUpActivityId: 1,
        levelUpId: 1,
        activityDate: new Date('2020-01-01'),
        levelUpActivityType: {
          name: 'Overview'
        }
      },
      {
        levelUpActivityId: 2,
        levelUpId: 1,
        activityDate: new Date('2020-01-03'),
        levelUpActivityType: {
          name: 'Review'
        }
      }
    ];

    let expected = [
      {
        date: new Date('2020-01-01'),
        icon: 'images/logos/my-awesome-icon.svg',
        link: '/level-up/1',
        priority: 1,
        subtitle: 'Overview',
        title: 'Test Level Up',
        type: {
          typeCode: 'levelUp',
          typeName: 'Level Up'
        },
        label: '',
        actionName: 'Register',
        actionCallback: callback,
        levelUp: upcoming_level_ups[0]
      },
      {
        date: new Date('2020-01-03'),
        icon: 'images/logos/my-awesome-icon.svg',
        link: '/level-up/1',
        priority: 1,
        subtitle: 'Review',
        title: 'Test Level Up',
        type: {
          typeCode: 'levelUp',
          typeName: 'Level Up'
        },
        label: '',
        actionName: 'Register',
        actionCallback: callback,
        levelUp: upcoming_level_ups[0]
      }
    ];

    let actual = selectLevelUpCards.resultFunc(upcoming_level_ups, upcoming_activities);
    actual.forEach(element => {
      element.actionCallback = callback;
    });

    expect(actual).to.deep.equal(expected);
  });

  it('should return all side quest cards', () => {
    let active_side_quests = [
      {
        id: 1 /* This should be sideQuestId */,
        name: 'Random side quest',
        type: {
          name: 'Thingy'
        },
        startDate: new Date('2020-01-02'),
        icon: 'images/logos/random-thingy.svg'
      }
    ];

    let expected = [
      {
        date: new Date('2020-01-02'),
        icon: 'images/logos/random-thingy.svg',
        link: '/side-quest/1',
        priority: 1,
        sideQuestId: 1,
        title: 'Random side quest',
        type: {
          typeCode: 'sideQuest',
          typeName: 'Side Quest'
        }
      }
    ];

    let actual = selectSideQuestCards.resultFunc(active_side_quests);

    expect(actual).to.deep.equal(expected);
  });

  it('should return a points card if points was scored this month', () => {
    let expected = {
      icon: 'images/logos/podium.svg',
      link: '/leaderboard',
      priority: Number.MAX_SAFE_INTEGER,
      subtitle: 'Scored during the last month.',
      title: '1000 Points',
      type: {
        typeCode: 'pointsSummary',
        typeName: 'Points Summary'
      }
    };

    let actual = selectLastMonthPointsCard.resultFunc(1000);

    expect(actual).to.deep.equal(expected);
  });

  it('should return prescribed course cards if there is any active', () => {
    let course = {
        courseId: 1,
        dateCompleted: null,
        progress: 0,
        icon: 'images/logos/random-thingy.svg',
        code: 'test',
        name: 'Test'
    }

    let expected = {
      date: 'Progress: 0%',
      icon: 'images/logos/random-thingy.svg',
      link: '/course/test',
      priority: 0,
      subtitle: '',
      title: 'Test',
      type: {
        typeCode: 'compulsoryTraining',
        typeName: 'Assigned Training'
      },
      course: course
    };

    let actual = selectPrescribedCoursesCards.resultFunc([
      course
    ]);

    expect(actual).to.deep.equal([expected]);
  });

  it('should not return level up cards', () => {
    let callback = sinon.fake()

    let upcoming_level_ups = [
      {
        levelUpId: 1,
        name: 'Test Level Up',
        icon: 'images/logos/my-awesome-icon.svg',
        registered: 'Registered'
      }
    ];
    let upcoming_activities = [
      {
        levelUpActivityId: 1,
        levelUpId: 1,
        activityDate: new Date('2020-01-01'),
        levelUpActivityType: {
          name: 'Overview'
        }
      },
      {
        levelUpActivityId: 2,
        levelUpId: 1,
        activityDate: new Date('2020-01-03'),
        levelUpActivityType: {
          name: ''
        }
      }
    ];

    let expected = [
      {
        date: new Date('2020-01-01'),
        icon: 'images/logos/my-awesome-icon.svg',
        link: '/level-up/1',
        priority: 1,
        subtitle: 'Overview',
        title: 'Test Level Up',
        type: {
          typeCode: 'levelUp',
          typeName: 'Level Up'
        },
        label: 'Registered',
        actionName: 'Register',
        actionCallback: callback,
        levelUp: upcoming_level_ups[0]
      },
      {
        date: new Date('2020-01-03'),
        icon: 'images/logos/my-awesome-icon.svg',
        link: '/level-up/1',
        priority: 1,
        subtitle: 'Review',
        title: 'Test Level Up',
        type: {
          typeCode: 'levelUp',
          typeName: 'Level Up'
        },
        label: '',
        actionName: 'Register',
        actionCallback: callback,
        levelUp: upcoming_level_ups[0]
      }
    ];

    let actual = selectLevelUpCards.resultFunc(upcoming_level_ups, upcoming_activities);

    expect(actual).to.deep.not.to.equal(expected);
  });


    it('should not return level up cards', () => {
    let callback = sinon.fake()

    let upcoming_level_ups = [
    ];

    let upcoming_activities = [
      {
        levelUpActivityId: 1,
        levelUpId: 1,
        activityDate: new Date('2020-01-01'),
        levelUpActivityType: {
          name: 'Overview'
        }
      },
      {
        levelUpActivityId: 2,
        levelUpId: 1,
        activityDate: new Date('2020-01-03'),
        levelUpActivityType: {
          name: ''
        }
      }
    ];

    let expected = [
      {
        date: new Date('2020-01-01'),
        icon: 'images/logos/my-awesome-icon.svg',
        link: '/level-up/1',
        priority: 1,
        subtitle: 'Overview',
        title: 'Test Level Up',
        type: {
          typeCode: 'levelUp',
          typeName: 'Level Up'
        },
        label: '',
        actionName: 'Register',
        actionCallback: callback,
        levelUp: upcoming_level_ups[0]
      },
      {
        date: new Date('2020-01-03'),
        icon: 'images/logos/my-awesome-icon.svg',
        link: '/level-up/1',
        priority: 1,
        subtitle: 'Review',
        title: 'Test Level Up',
        type: {
          typeCode: 'levelUp',
          typeName: 'Level Up'
        },
        label: 'Registered',
        actionName: 'Register',
        actionCallback: callback,
        levelUp: upcoming_level_ups[0]
      }
    ];

    let actual = selectLevelUpCards.resultFunc(upcoming_level_ups, upcoming_activities);

    expect(actual).to.deep.not.to.equal(expected);
  });

  
})