import { expect } from '@open-wc/testing';
import {
  selectAllSideQuests,
  selectUserSideQuests,
  selectActiveSideQuests,
  selectSideQuests,
  selectSideQuest,
  selectSideQuestMission,
  selectSideQuestById,
  selectPastSideQuests
} from '../../../src/selectors/side-quests.selectors';

describe('Selector - Side Quests', () => {
  it('should return all side quests from state', () => {
    let state = {
      sideQuests: {
        all: [{ sideQuestId: 1 }, { sideQuestId: 2 }, { sideQuestId: 3 }]
      }
    };

    let sideQuests = selectAllSideQuests(state);

    expect(sideQuests).to.equal(state.sideQuests.all);
  });

  it('should return user side quests from state', () => {
    let state = {
      sideQuests: {
        user: [{ sideQuestId: 1 }, { sideQuestId: 2 }, { sideQuestId: 3 }]
      }
    };

    let sideQuests = selectUserSideQuests(state);

    expect(sideQuests).to.equal(state.sideQuests.user);
  });

  it('should return only active side quests', () => {
    let sideQuests = [
      { sideQuestId: 1, sideQuestTypeId: 1, startDate: new Date('3000-01-01') },
      { sideQuestId: 2, sideQuestTypeId: 1, startDate: new Date('2000-01-02') },
      { sideQuestId: 3, sideQuestTypeId: 2, startDate: new Date('3000-01-03') },
      { sideQuestId: 4, sideQuestTypeId: 2, startDate: new Date('3000-01-04') }
    ];
    let sideQuestTypes = [{ sideQuestTypeId: 1 }, { sideQuestTypeId: 2 }];

    let expectedResults = [
      {
        sideQuestId: 1,
        sideQuestTypeId: 1,
        startDate: new Date('3000-01-01'),
        type: { sideQuestTypeId: 1 }
      },
      {
        sideQuestId: 3,
        sideQuestTypeId: 2,
        startDate: new Date('3000-01-03'),
        type: { sideQuestTypeId: 2 }
      },
      {
        sideQuestId: 4,
        sideQuestTypeId: 2,
        startDate: new Date('3000-01-04'),
        type: { sideQuestTypeId: 2 }
      }
    ];

    let activeSideQuests = selectActiveSideQuests.resultFunc(sideQuests, sideQuestTypes);

    expect(activeSideQuests).to.deep.equal(expectedResults);
  });

  it('should build correct objects when selecting side quests', () => {
    let sideQuests = [
      { id: 1, startDate: new Date('3000-01-01') },
      { id: 2, startDate: new Date('2000-01-02') },
      { id: 3 },
      { id: 4 }
    ];
    let userSideQuests = [
      { sideQuestId: 1, startDate: new Date('3000-01-01') },
      { sideQuestId: 2, startDate: new Date('2000-01-02'), dateCompleted: new Date('2019-01-01') },
      { sideQuestId: 4 }
    ];

    let expectedResults = [
      {
        id: 1,
        hasAttended: false,
        hasRSVPed: true,
        startDate: new Date('3000-01-01'),
        userSideQuest: { sideQuestId: 1, startDate: new Date('3000-01-01') }
      },
      {
        id: 2,
        hasAttended: true,
        hasRSVPed: true,
        startDate: new Date('2000-01-02'),
        userSideQuest: {
          sideQuestId: 2,
          startDate: new Date('2000-01-02'),
          dateCompleted: new Date('2019-01-01')
        }
      },
      {
        id: 3,
        hasAttended: false,
        hasRSVPed: false,
        userSideQuest: undefined
      },
      {
        id: 4,
        hasAttended: false,
        hasRSVPed: true,
        userSideQuest: { sideQuestId: 4 }
      }
    ];

    let actual = selectSideQuests.resultFunc(sideQuests, userSideQuests);

    expect(actual).to.deep.equal(expectedResults);
  });

  it('should select the current side quest', () => {
    let sideQuests = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    let sideQuestId = 1;

    let sideQuest = selectSideQuest.resultFunc(sideQuests, sideQuestId);

    expect(sideQuest).to.deep.equal({ id: 1 });
  });

  it('should select missions associated to side quests', () => {
    let missions = [
      {
        missionId: 1,
        type: { sideQuestMission: { sideQuestMissionId: 1 } },
        missionTypeId: 1,
        sideQuestId: 1,
        heroUserPrincipleName: 'test@bbd.co.za'
      }
    ];

    let sideQuestId = 1;

    let mission = selectSideQuestMission.resultFunc(missions, sideQuestId);

    let expectedMission = {
      ...missions[0],
      type: { ...missions[0].type }
    };

    expect(mission).to.deep.equal(expectedMission);
  });

  it('sidequests by id should be undefined', ()=>{
    expect(selectSideQuestById({},1)).to.not.be.ok;
    expect(selectSideQuestById({sideQuests:[]},undefined)).to.not.be.ok;
    expect(selectSideQuestById({sideQuests:{all:[]}},undefined)).to.not.be.ok;
    expect(selectSideQuestById({sideQuests:{user:[]}},undefined)).to.not.be.ok;
  });

  it('sidequests by id when state and id are correct', ()=>{
    let sideQuests = {
      all:[{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
      user:[{sideQuestId:2, dateCompleted: new Date()}]
    };
    expect(selectSideQuestById({sideQuests},2)).to.be.ok;
  });

  it('should return past side quests', ()=>{
    let sideQuests = [
      { id: 1, startDate: new Date('3000-01-01'), sideQuestTypeId: 1 },
      { id: 2, startDate: new Date('2000-01-02'), sideQuestTypeId: 1 },
      { id: 3, sideQuestTypeId: 1 },
      { id: 4 },
    ];
    let sideQuestTypes = [{ sideQuestTypeId: 1, sideQuestType: 'test' }];

    let expected = [{ id: 2, sideQuestTypeId: 1, startDate: new Date('2000-01-02'), type:{sideQuestType: 'test', sideQuestTypeId: 1 }}];

    let actual = selectPastSideQuests.resultFunc(sideQuests, sideQuestTypes);

    expect(expected).to.deep.equal(actual);
  });
});
