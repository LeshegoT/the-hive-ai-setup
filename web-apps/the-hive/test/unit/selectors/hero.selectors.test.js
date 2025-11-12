import {
  selectIsGuide,
  selectExistingQuest,
  selectHeroQuest,
  selectAllHeroQuests,
  selectHeroQuests,
  selectHeroQuestForFeedback,
  selectGuideRequests
} from '../../../src/selectors/hero.selectors';

import { expect } from '@open-wc/testing';

describe('Selector - Hero', () => {
  it('should return true if hero is a guide', () => {
    let state = {
      heroes: {
        isGuide: true
      }
    };

    let isGuide = selectIsGuide(state);

    expect(isGuide).to.equal(true);
  });

  it('should list all heroes', () => {
    let state = {
      heroes: {
        all: [
          {
            heroId: 1
          },
          {
            heroId: 2
          },
          {
            heroId: 3
          }
        ]
      }
    };

    let heroes = selectAllHeroQuests(state);

    expect(heroes).to.deep.equal(state.heroes.all);
  });

  it('should return hero quests with specialisations and quest types', () => {
    let startDate = new Date('2019-01-01 02:00');
    let endDate = new Date('2020-01-01 02:00');
    let lastActive = new Date('2020-01-01 02:00');

    let heroes = [
      {
        questId: 1,
        specialisationId: 1,
        questTypeId: 1,
        startDate,
        endDate,
        lastActive,
        status: 'in-progress'
      },
      {
        questId: 2,
        specialisationId: 2,
        questTypeId: 2,
        startDate,
        endDate,
        lastActive,
        status: 'paused'
      },
      {
        questId: 3,
        specialisationId: 3,
        questTypeId: 3,
        startDate,
        endDate,
        lastActive,
        status: 'in-progress'
      }
    ];

    let specialisations = [
      { specialisationId: 1 },
      { specialisationId: 2 },
      { specialisationId: 3 }
    ];

    let questTypes = [{ questTypeId: 1 }, { questTypeId: 2 }, { questTypeId: 3 }];
    let notifications = [{questId: 2, resolved: false}];

    let expected_heroes = [
      {
        questId: 1,
        specialisationId: 1,
        specialisation: { specialisationId: 1 },
        questTypeId: 1,
        questType: { questTypeId: 1 },
        startDate: startDate,
        endDate: endDate,
        lastActive: lastActive,
        status: 'in-progress'
      },
      {
        questId: 2,
        specialisationId: 2,
        specialisation: { specialisationId: 2 },
        questTypeId: 2,
        questType: { questTypeId: 2 },
        startDate: startDate,
        endDate: endDate,
        lastActive: lastActive,
        status: 'paused'
      },
      {
        questId: 3,
        specialisationId: 3,
        specialisation: { specialisationId: 3 },
        questTypeId: 3,
        questType: { questTypeId: 3 },
        startDate: startDate,
        endDate: endDate,
        lastActive: lastActive,
        status: 'in-progress'
      }
    ];

    let actual_heroes = selectHeroQuests.resultFunc(
      heroes,
      specialisations,
      questTypes,
      notifications
    );

    expect(actual_heroes).to.be.ok;
    expect(actual_heroes).to.deep.equal(expected_heroes);
  });

  it('should return the correct hero quest', () => {
    let hero = 'test@bbd.co.za';
    let quest = {
      heroId: 1,
      questTypeId: 1,
      specialisationId: 1,
      heroUserPrincipleName: hero,
      startDate: new Date('2019-01-01'),
      endDate: new Date('2020-01-01')
    };

    let heroQuest = selectHeroQuest.resultFunc([quest], hero);

    expect(heroQuest).to.be.ok;
    expect(heroQuest).to.deep.equal(quest);
  });

  it('should return existing quest', () => {
    let state = {
      heroes: {
        existingQuest: {
          questId: 1
        }
      }
    };

    let existingQuest = selectExistingQuest(state);

    expect(existingQuest).to.be.ok;
    expect(existingQuest).to.deep.equal(state.heroes.existingQuest);
  });

  it('should return hero quest for feedback', () => {
    let heroes = [
      {
        questId: 1
      },
      {
        questId: 2
      },
      {
        questId: 3
      }
    ];

    let quest_for_feedback = selectHeroQuestForFeedback.resultFunc(heroes, 1);

    expect(quest_for_feedback).to.deep.equal(heroes[0]);
  });

  it('should return a list of guide requests', () => {
    let state = {
      heroes: {
        guideRequests: [
          {
            guideRequestId: 1,
            heroUserPrincipleName: 'test1@bbd.co.za',
            guideUserPrincipleName: 'test2@bbd.co.za',
            justification: 'To test the feature',
            requestStatusTypeId: 1
          },
          {
            guideRequestId: 4,
            heroUserPrincipleName: 'test7@bbd.co.za',
            guideUserPrincipleName: 'test9@bbd.co.za',
            justification: 'Testing again',
            requestStatusTypeId: 3
          }
        ]
      }
    };

    let guideRequests = selectGuideRequests(state);

    expect(guideRequests).to.be.ok;
    expect(guideRequests).to.deep.equal(state.heroes.guideRequests);
  });
});
