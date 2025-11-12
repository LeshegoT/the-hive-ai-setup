import { expect } from '@open-wc/testing';
import {
  selectCurrentQuest,
  selectQuest,
  selectQuestDaysRemaining,
  selectQuestMissions,
  selectQuestsWithMissions,
  selectAllMissions,
  selectHeroMissions,
  selectMissions,
  selectMissionsIncludeDeleted,
  selectMission,
  selectMissionProgress,
  selectHasOldQuests,
  selectPausedQuests,
  getQuestInformation,
  selectHeroAllQuests,
  getMissionInformation,
  selectCurrentMission,
} from '../../../src/selectors/quest.selectors';

describe('Selector - Quest', () => {
  it('should return current quest', () => {
    let state = {
      quests: {
        current: { questId: 1 },
      },
    };

    let quest = selectCurrentQuest(state);

    expect(quest).to.deep.equal(state.quests.current);
  });

  it('should return current quest with types and specialisations and more than a year', () => {
    let startDate = '2019-01-01';
    let endDate = '2020-02-01';
    let quest = { questId: 1, specialisationId: 1, questTypeId: 1, startDate, endDate };
    let specialisations = [{ specialisationId: 1 }, { specialisationId: 2 }];
    let questTypes = [{ questTypeId: 1 }, { questTypeId: 2 }];

    let expected_quest = {
      questId: 1,
      specialisationId: 1,
      questTypeId: 1,
      startDate,
      endDate,
      months: 13,
      questType: { questTypeId: 1 },
      specialisation: { specialisationId: 1 },
    };

    let actual_quest = selectQuest.resultFunc(quest, questTypes, specialisations);

    expect(actual_quest).to.deep.equal(expected_quest);
  });

  it('should return current quest with types and specialisations and less than a year', () => {
    let startDate = '2019-01-01';
    let endDate = '2019-06-01';
    let quest = { questId: 1, specialisationId: 1, questTypeId: 1, startDate, endDate };
    let specialisations = [{ specialisationId: 1 }, { specialisationId: 2 }];
    let questTypes = [{ questTypeId: 1 }, { questTypeId: 2 }];

    let expected_quest = {
      questId: 1,
      specialisationId: 1,
      questTypeId: 1,
      startDate,
      endDate,
      months: 5,
      questType: { questTypeId: 1 },
      specialisation: { specialisationId: 1 },
    };

    let actual_quest = selectQuest.resultFunc(quest, questTypes, specialisations);

    expect(actual_quest).to.deep.equal(expected_quest);
  });

  it('should return nothing if quest is undefined', () => {
    let specialisations = [{ specialisationId: 1 }, { specialisationId: 2 }];
    let questTypes = [{ questTypeId: 1 }, { questTypeId: 2 }];

    let actual_quest = selectQuest.resultFunc(undefined, questTypes, specialisations);

    expect(actual_quest).to.deep.equal({});
  });

  it('should return current quest with months if already defined', () => {
    let quest = { questId: 1, specialisationId: 1, questTypeId: 1, months: 2 };
    let specialisations = [{ specialisationId: 1 }, { specialisationId: 2 }];
    let questTypes = [{ questTypeId: 1 }, { questTypeId: 2 }];

    let expected_quest = {
      questId: 1,
      specialisationId: 1,
      questTypeId: 1,
      months: 2,
      questType: { questTypeId: 1 },
      specialisation: { specialisationId: 1 },
    };

    let actual_quest = selectQuest.resultFunc(quest, questTypes, specialisations);

    expect(actual_quest).to.deep.equal(expected_quest);
  });

  it('should return remaining days correctly', () => {
    let daysRemaining = '10';
    let today = new Date();
    let endDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + parseInt(daysRemaining),
      today.getHours(),
      today.getMinutes(),
      today.getSeconds(),
      today.getMilliseconds()
    );

    let quest = { endDate };

    let days = selectQuestDaysRemaining.resultFunc(quest);

    expect(days).to.equal(daysRemaining);

    endDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - parseInt(daysRemaining),
      today.getHours(),
      today.getMinutes(),
      today.getSeconds(),
      today.getMilliseconds()
    );

    quest = { endDate };

    days = selectQuestDaysRemaining.resultFunc(quest);

    expect(days).to.equal(0);
  });

  it('should return 0 if quest is undefined', () => {
    let days = selectQuestDaysRemaining.resultFunc(undefined);

    expect(days).to.equal(0);
  });

  it('should return 0 if quest end date is undefined', () => {
    let days = selectQuestDaysRemaining.resultFunc({ questId: 1 });

    expect(days).to.equal(0);
  });

  it('should return all missions', () => {
    let state = {
      quests: {
        missions: [{ missionId: 1 }, { missionId: 2 }],
      },
    };

    let missions = selectAllMissions(state);

    expect(missions).to.deep.equal(state.quests.missions);
  });

  it('should return hero missions', () => {
    let missions = [
      { missionId: 1, heroUserPrincipleName: 'test@bbd.co.za' },
      { missionId: 2, heroUserPrincipleName: 'no-test@bbd.co.za' },
    ];
    let hero = 'test@bbd.co.za';
    let expected_missions = [{ missionId: 1, heroUserPrincipleName: 'test@bbd.co.za' }];

    let actual_missions = selectHeroMissions.resultFunc(missions, hero);

    expect(actual_missions).to.deep.equal(expected_missions);
  });

  it('should select missions with course and mission type', () => {
    let missions = [
      { missionId: 1, courseId: 1, missionTypeId: 1 },
      { missionId: 2, missionTypeId: 2 },
      { missionId: 3, deleted: 1 },
    ];
    let courses = [{ courseId: 1 }];
    let missionTypes = [{ missionTypeId: 1 }, { missionTypeId: 2 }];

    let expected_missions = [
      {
        missionId: 1,
        courseId: 1,
        missionTypeId: 1,
        course: { courseId: 1 },
        type: { missionTypeId: 1 },
      },
      { missionId: 2, missionTypeId: 2, type: { missionTypeId: 2 }, course: undefined },
    ];

    let actual_missions = selectMissions.resultFunc(missions, courses, missionTypes);

    expect(actual_missions).to.deep.equal(expected_missions);
  });

  it('should select missions with course and mission type for a quest', () => {
    let quest = {
      questId: 1,
    };
    let missions = [
      { missionId: 1, courseId: 1, missionTypeId: 1 },
      { missionId: 2, questId: 1 },
      { missionId: 3, deleted: 1 },
    ];
    let courses = [{ courseId: 1 }];
    let missionTypes = [{ missionTypeId: 1 }, { missionTypeId: 2 }];

    let expected_missions = [{ missionId: 2, questId: 1, type: undefined, course: undefined }];

    let actual_missions = selectQuestMissions.resultFunc(missions, courses, missionTypes, quest);

    expect(actual_missions).to.deep.equal(expected_missions);
  });

  it('should select quests with missions', () => {
    let quests = [
      {
        questId: 1,
        status: 'in-progress',
        missions: [
          { missionId: 1, courseId: 1, missionTypeId: 1 },
          { missionId: 2, missionTypeId: 2 },
          { missionId: 3, deleted: 1 },
        ],
      },
      {
        questId: 2,
        status: 'paused',
        missions: [
          { missionId: 1, courseId: 1, missionTypeId: 1 },
          { missionId: 2, missionTypeId: 2 },
          { missionId: 3, deleted: 1 },
        ],
      },
    ];
    let courses = [{ courseId: 1 }];
    let missionTypes = [{ missionTypeId: 1 }, { missionTypeId: 2 }];

    let expected = [
      {
        questId: 1,
        status: 'in-progress',
        missions: [
          {
            missionId: 1,
            courseId: 1,
            missionTypeId: 1,
            course: { courseId: 1 },
            type: { missionTypeId: 1 },
          },
          {
            missionId: 2,
            missionTypeId: 2,
            type: { missionTypeId: 2 },
            course: undefined,
          },
        ],
      },
      {
        questId: 2,
        status: 'paused',
        missions: [
          {
            missionId: 1,
            courseId: 1,
            missionTypeId: 1,
            course: { courseId: 1 },
            type: { missionTypeId: 1 },
          },
          {
            missionId: 2,
            missionTypeId: 2,
            type: { missionTypeId: 2 },
            course: undefined,
          },
        ],
      },
    ];

    let actual = selectQuestsWithMissions.resultFunc(quests, courses, missionTypes);

    expect(actual).to.deep.equal(expected);
  });

  it('should select missions with course and mission type and include deleted', () => {
    let missions = [
      { missionId: 1, courseId: 1, missionTypeId: 1 },
      { missionId: 2, missionTypeId: 2 },
      { missionId: 3, missionTypeId: 2, deleted: 1 },
    ];
    let courses = [{ courseId: 1 }];
    let missionTypes = [{ missionTypeId: 1 }, { missionTypeId: 2 }];

    let expected_missions = [
      {
        missionId: 1,
        courseId: 1,
        missionTypeId: 1,
        course: { courseId: 1 },
        type: { missionTypeId: 1 },
      },
      { missionId: 2, missionTypeId: 2, type: { missionTypeId: 2 }, course: undefined },
      {
        missionId: 3,
        missionTypeId: 2,
        type: { missionTypeId: 2 },
        course: undefined,
        deleted: 1,
      },
    ];

    let actual_missions = selectMissionsIncludeDeleted.resultFunc(missions, courses, missionTypes);

    expect(actual_missions).to.deep.equal(expected_missions);
  });

  it('should select mission by id', () => {
    let mission = { missionId: 1 };
    let missionId = 1;

    let actual_mission = selectMission.resultFunc(missionId, [mission]);

    expect(actual_mission).to.deep.equal(mission);
  });

  it('should select mission progress', () => {
    let missions = [
      {
        missionId: 1,
        courseId: 1,
        course: { courseId: 1, totalSections: 10, completedSections: 5 },
      }, //50% completed course mission
      {
        missionId: 2,
        courseId: 2,
        course: { courseId: 2, totalSections: 0 },
      }, // 0% complete mission
      { missionId: 3, dateCompleted: '2019-01-01' }, //100% complete mission
    ];

    let missionProgress = selectMissionProgress.resultFunc(missions);

    expect(missionProgress).to.equal('50');
  });

  it('should select oldQuests', () => {
    let state = {
      quests: {
        oldQuests: true,
      },
    };

    let hasOldQuests = selectHasOldQuests(state);

    expect(hasOldQuests).to.equal(true);
  });

  it('should select pausedQuests', () => {
    let state = {
      quests: {
        pausedQuests: [{ status: 'paused' }],
      },
    };

    let pausedQuests = selectPausedQuests(state);

    expect(pausedQuests).to.deep.equal(state.quests.pausedQuests);
  });

  it('should return an empty object if there is no quest', () => {
    let state = {
      quest: undefined,
      questTypes: [{ questTypeId: 1 }],
      specialisations: [{ specialisationId: 1 }],
    };

    let expected_quest = {};

    let actual_quest = getQuestInformation(state.quest, state.questTypes, state.specialisations);

    expect(expected_quest).to.deep.equal(actual_quest);
  });

  it('should return quest information correctly', () => {
    let testDate = new Date();
    let y = testDate.getFullYear();
    let m = testDate.getMonth();
    let d = testDate.getDate();
    let testEndDate = new Date(y + 1, m, d);

    let state = {
      quest: {
        questTypeId: 1,
        specialisationId: 1,
        months: 12,
        startDate: testDate,
        endDate: testEndDate,
      },
      questTypes: [{ questType: 'test', questTypeId: 1 }],
      specialisations: [{ specialisation: 'test', specialisationId: 1 }],
    };

    let expected_quest = {
      ...state.quest,
      months: 12,
      questType: { questType: 'test', questTypeId: 1 },
      specialisation: { specialisation: 'test', specialisationId: 1 },
    };

    let actual_quest = getQuestInformation(state.quest, state.questTypes, state.specialisations);

    expect(expected_quest).to.deep.equal(actual_quest);
  });

  it('should return all quests correctly', () => {
    let state = {
      quests: {
        all: [
          {
            questType: 'test',
          },
        ],
      },
    };

    let expected_quests = [
      {
        questType: 'test',
      },
    ];

    let actual_quests = selectHeroAllQuests(state);

    expect(expected_quests).to.deep.equal(actual_quests);
  });

  it('should get mission information correctly', () => {
    let state = {
      missions: [
        { mission: 'test', courseId: 1, missionTypeId: 1 },
      ],
      courses: [{ courseId: 1, course: 'test' }],
      missionTypes: [{ missionTypeId: 1, missionType: 'test' }],
    };

    let expected_missions =[
      {
        course: {
          course: "test",
          courseId: 1
        },
        courseId: 1,
        mission: "test",
        missionTypeId: 1,
        type: {
          missionType: "test",
          missionTypeId: 1
        }
      }
    ]

    let actual_missions = getMissionInformation(state.missions,state.courses,state.missionTypes);

    expect(expected_missions).to.deep.equal(actual_missions);
  });
});
