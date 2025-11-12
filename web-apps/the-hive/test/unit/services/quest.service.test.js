import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { QuestService } from '../../../src/services/quest.service';
import { RESET_EDITING_QUEST } from '../../../src/actions/reset-editing-quest.action';
import { QUEST_CREATED } from '../../../src/actions/quest-created.action';
import { QUEST_UPDATED } from '../../../src/actions/quest-updated.action';
import { HERO_MISSIONS_RECEIVED } from '../../../src/actions/hero-missions-received.action';
import { HERO_QUEST_RECEIVED } from '../../../src/actions/hero-quest-received.action';
import { HERO_QUESTS_RECEIVED } from '../../../src/actions/hero-quests-received.action';
import { QUEST_EXISTS_ERROR_RECEIVED } from '../../../src/actions/quest-exists-error-received.action';
import { USER_HAS_OLD_QUESTS } from '../../../src/actions/user-has-old-quests.action';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';
import { StoreStub } from '../shared/stubs/store.stub';
import { auth_service_stubs } from '../shared/stubs/auth.service.stub';

describe('Service - QuestService', () => {
  let questService;
  let dispatch_spy;

  before(() => {
    questService = new QuestService();
    questService._store=new StoreStub();
    dispatch_spy = sinon.spy(questService.store, 'dispatch');
  });

  afterEach(() => dispatch_spy.resetHistory());

  auth_service_stubs.uses_select_hero('test@bbd.co.za');

  it('should initialise correctly.', () => {
    expect(questService.config).to.be.ok;
    expect(questService.store).to.be.ok;
  });

  describe('do not getQuest', () => {
    it('should not dispatch any action if hero and logged in user are the same', async () => {
      let hero = 'test@bbd.co.za';

      await questService.getQuest(hero);

      expect(dispatch_spy.called).to.not.be.ok;
    });
  });

  describe('getQuest', () => {
    let data = {
      quest: {},
      missions: [],
    };

    before(() => fetch_stub_returns_json(data));

    after(() => fetch_stub.reset());

    it('should dispatch action if hero and logged in user are not the same', async () => {
      let hero = 'test-2@bbd.co.za';

      let expected_actions = [
        {
          type: HERO_QUEST_RECEIVED,
          quest: data.quest,
        },
        {
          type: HERO_MISSIONS_RECEIVED,
          missions: [],
        },
      ];

      await questService.getQuest(hero);

      expect(dispatch_spy.calledWith(expected_actions[0])).to.be.ok;
      expect(dispatch_spy.calledWith(expected_actions[1])).to.be.ok;
    });
  });

  describe('getQuest', () => {
    let data = {
      quest: { heroUserPrincipleName: 'test-2@bbd.co.za', startDate: new Date(), endDate: new Date() },
      missions: [{ dateCompleted: null }, { dateCompleted: '30 June 2022' }],
    };

    before(() => fetch_stub_returns_json(data));

    after(() => fetch_stub.reset());

    it('should dispatch action with correct completion dates for missions', async () => {
      let hero = 'test-2@bbd.co.za';

      let expected_actions = [
        {
          type: HERO_QUEST_RECEIVED,
          quest: data.quest,
        },
        {
          type: HERO_MISSIONS_RECEIVED,
          missions: [{ dateCompleted: null }, { dateCompleted: new Date('30 June 2022') }],
        },
      ];

      await questService.getQuest(hero);

      expect(dispatch_spy.calledWith(expected_actions[0])).to.be.ok;
      expect(dispatch_spy.calledWith(expected_actions[1])).to.be.ok;
    });
  });

  describe('getQuest - null', () => {
    let data = { quest: null, missions: null };

    before(() => fetch_stub_returns_json(data));

    after(() => fetch_stub.reset());

    it('should dispatch navigate action if quest is empty', async () => {
      let hero = 'test-2@bbd.co.za';

      let expected_action = {
        type: HERO_QUEST_RECEIVED,
        quest: data.quest
      };
      await questService.getQuest(hero);

      expect(dispatch_spy.calledWith(expected_action)).to.not.be.ok;
      expect(dispatch_spy.called).to.be.ok;
    });
  });

  describe('getHeroQuests', () => {
    let quests = [];

    before(() => fetch_stub_returns_json(quests));

    after(() => fetch_stub.reset());

    it('should dispatch action if quests received - without upn', async () => {
      let expected_action = {
        type: HERO_QUESTS_RECEIVED,
        quests
      };

      await questService.getHeroQuests();

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });

    it('should dispatch action if quests received - with upn', async () => {
      let hero = 'test@bbd.co.za';

      let expected_action = {
        type: HERO_QUESTS_RECEIVED,
        quests
      };

      await questService.getHeroQuests(hero);

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('updateQuest', () => {
    let data = { quest: { heroUserPrincipleName: 'test@bbd.co.za', startDate: new Date(), endDate: new Date() }, missions: [] };

    before(() => fetch_stub_returns_json(data));

    after(() => fetch_stub.reset());

    it('should dispatch action when quest updated', async () => {
      let expected_actions = [
        {
          type: RESET_EDITING_QUEST
        },
        {
          type: QUEST_UPDATED,
          ...data
        }
      ];

      await questService.updateQuest(data.quest, data.missions);

      expect(dispatch_spy.calledWith(expected_actions[0])).to.be.ok;
      expect(dispatch_spy.calledWith(expected_actions[1])).to.be.ok;
    });
  });

  describe('updateQuest - update guide activity', () => {
    let data = { quest: { heroUserPrincipleName: 'test-2@bbd.co.za', startDate: new Date(), endDate: new Date() }, missions: [] };

    before(() => fetch_stub_returns_json(data));

    after(() => fetch_stub.reset());

    it('should dispatch action when quest updated', async () => {
      let expected_actions = [
        {
          type: RESET_EDITING_QUEST
        },
        {
          type: QUEST_UPDATED,
          ...data
        }
      ];

      await questService.updateQuest(data.quest, data.missions);

      expect(dispatch_spy.calledWith(expected_actions[0])).to.be.ok;
      expect(dispatch_spy.calledWith(expected_actions[1])).to.not.be.ok;
    });
  });

  describe('createQuest', () => {
    let data = { quest: { heroUpn: 'test@bbd.co.za', startDate: new Date(), endDate: new Date() }, missions: [], avatar: [], numberOfPartsAvailable: [] };

    before(() => fetch_stub_returns_json(data));

    after(() => fetch_stub.reset());

    it('should dispatch action when quest created', async () => {
      let expected_actions = [
        {
          type: RESET_EDITING_QUEST
        },
        {
          type: QUEST_CREATED,
          ...data
        }
      ];

      await questService.createQuest(data.quest, data.missions);

      expect(dispatch_spy.calledWith(expected_actions[0])).to.be.ok;
      expect(dispatch_spy.calledWith(expected_actions[1])).to.be.ok;
    });
  });

  describe('createQuest - with error', () => {
    let data = { quest: {}, error: 'there is an error' };

    before(() => fetch_stub_returns_json(data));

    after(() => fetch_stub.reset());

    it('should dispatch action when quest not created due to error', async () => {
      let expected_action = {
        type: QUEST_EXISTS_ERROR_RECEIVED,
        quest: data.quest
      };

      await questService.createQuest(data.quest, data.missions);

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('createQuest - by guide', () => {
    let data = { quest: { heroUpn: 'test-2@bbd.co.za' }, missions: [] };

    before(() => fetch_stub_returns_json(data));

    after(() => fetch_stub.reset());

    it('should dispatch action when quest created by guide', async () => {
      let expected_actions = [
        {
          type: RESET_EDITING_QUEST
        },
        {
          type: HERO_QUEST_RECEIVED,
          quest: data.quest
        }
      ];

      await questService.createQuest(data.quest, data.missions);

      expect(dispatch_spy.calledWith(expected_actions[0])).to.be.ok;
      expect(dispatch_spy.calledWith(expected_actions[1])).to.be.ok;
    });
  });

  describe('resumeQuest ', () => {
    let data = {startDate: new Date(), endDate: new Date()};

    before(() => fetch_stub_returns_json(data));

    after(() => fetch_stub.reset());

    it('should dispatch action when quest is resumed', async () => {
      let action = {
        type: QUEST_UPDATED,
        ...data
      };

      await questService.resumeQuest(1);

      expect(dispatch_spy.calledWith(action)).to.be.ok;
    });
  });

  describe('getGuidesBySpecialisation', () => {
    let guides = [{ guideId: 1 }, { guideId: 2 }];

    before(() => fetch_stub_returns_json(guides));

    after(() => fetch_stub.reset());

    it('should fetch guides and return them', async () => {
      let specialisationId = 1;
      let actual = await questService.getGuidesBySpecialisation(specialisationId);

      expect(actual).to.deep.equal(guides);
    });
  });

  describe('getOldQuests', () => {
    let quests = [];

    before(() => fetch_stub_returns_json(quests));

    after(() => fetch_stub.reset());

    it('should dispatch action if old quests received', async () => {
      let expected_action = {
        type: USER_HAS_OLD_QUESTS,
        quests
      };

      await questService.getOldQuests();

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('questOptimisticUpdate', () => {
    it('should dispatch action to update quest', async () => {
      let data = { quest: {}, missions: [] };

      let expected_action = {
        type: QUEST_UPDATED,
        ...data
      };

      await questService.questOptimisticUpdate(data.quest, data.missions);

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('retractHeroQuestCompletion', () => {
    before(() => fetch_stub_returns_json({}));

    after(() => fetch_stub.reset());

    it('should dispatch nav action when successful', async () => {
      await questService.retractHeroQuestCompletion({
        questId: 1,
        heroUserPrincipleName: 'test@bbd.co.za'
      });

      expect(dispatch_spy.called).to.be.ok;
    });
  });

  describe('markQuestComplete', () => {
    before(() => fetch_stub_returns_json({}));

    after(() => fetch_stub.reset());

    it('should dispatch nav action when successful', async () => {
      await questService.markQuestComplete({
        questId: 1,
        heroUserPrincipleName: 'test@bbd.co.za'
      });

      expect(dispatch_spy.called).to.be.ok;
    });
  });

  describe('markQuestAbandoned ', () => {
    before(() => fetch_stub_returns_json({}));

    after(() => fetch_stub.reset());

    it('should dispatch nav action when successful', async () => {
      await questService.markQuestAbandoned({
        questId: 1,
        heroUserPrincipleName: 'test@bbd.co.za'
      });

      expect(dispatch_spy.called).to.be.ok;
    });
  });

  describe('markQuestPaused  ', () => {
    before(() => fetch_stub_returns_json({}));

    after(() => fetch_stub.reset());

    it('should dispatch nav action when successful', async () => {
      await questService.markQuestPaused({
        questId: 1,
        heroUserPrincipleName: 'test@bbd.co.za'
      });

      expect(dispatch_spy.called).to.be.ok;
    });
  });

  describe('createQuest - empty data', () => {
    let data = {};

    before(() => fetch_stub_returns_json(data));

    after(() => fetch_stub.reset());

    it('should not dispatch action when quest not created no data', async () => {
      let expected_action = {
        type: QUEST_EXISTS_ERROR_RECEIVED,
        quest: data
      };

      await questService.createQuest(data);

      expect(dispatch_spy.calledWith(expected_action)).to.not.be.ok;
    });
  });
});
