import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { MessageService } from '../../../src/services/message.service';
import { MESSAGES_RECEIVED } from '../../../src/actions/messages-received.action';
import { LEARNING_TASKS_RECEIVED } from '../../../src/actions/learning-tasks-received.action';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';
import { StoreStub } from '../shared/stubs/store.stub';

describe('Service - MessageService', () => {
  let messageService;
  let dispatch_spy;

  before(() => {
    messageService = new MessageService();
    messageService._store=new StoreStub();
    dispatch_spy = sinon.spy(messageService.store, 'dispatch');
  });

  afterEach(() => dispatch_spy.resetHistory());

  it('should initialise correctly.', () => {
    expect(messageService.config).to.be.ok;
    expect(messageService.store).to.be.ok;
  });

  describe('get and create messages', () => {
    let messages = [];

    before(() => fetch_stub_returns_json(messages));

    after(() => fetch_stub.reset());

    it('should return messages for hero', async () => {
      let hero = 'test-2@bbd.co.za';
      let expected_action = {
        type: MESSAGES_RECEIVED,
        messages
      };

      await messageService.getMessages(hero);

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
      expect(fetch_stub.calledWith('http:/localhost/hero=test-2@bbd.co.za&offset=0'));
    });

    it('should return messages for hero and add params correctly', async () => {
      let hero = 'test-2@bbd.co.za';
      let offset = 1;
      let questId = 1;
      let missionId = 1;
      let courseId = 1;
      let sideQuestId = 1;

      let expected_action = {
        type: MESSAGES_RECEIVED,
        messages
      };

      await messageService.getMessages(
        hero,
        offset,
        questId,
        missionId,
        courseId,
        sideQuestId
      );

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
      expect(
        fetch_stub.calledWith(
          'http:/localhost/hero=test-2@bbd.co.za&offset=1&questId=1&missionId=1&courseId=1&sideQuestId=1'
        )
      );
    });
  });

  describe('get and create messages', () => {
    let message = {};

    before(() => fetch_stub_returns_json(message));

    after(() => fetch_stub.reset());

    it('should return newly created message in an array', async () => {
      let hero = 'test-2@bbd.co.za';
      let text = 'Hi!';
      let completed = false;
      let missionId = 1;
      let sideQuestId = 1;
      let courseId = 1;
      let messageTypeId = 1;
      let learningTask = {
        dateCompleted: new Date(),
        link: 'http://bbd.co.za',
        timeSpent: 1
      };

      let expected_action = {
        type: MESSAGES_RECEIVED,
        messages: [message]
      };

      await messageService.createMessage(
        hero,
        text,
        completed,
        missionId,
        sideQuestId,
        courseId,
        messageTypeId,
        learningTask
      );

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('learning tasks', () => {
    let learningTasks = [];

    before(() => fetch_stub_returns_json(learningTasks));

    after(() => fetch_stub.reset());

    it('should return learning tasks', async () => {
      let hero = 'test-2@bbd.co.za';

      let expected_action = {
        type: LEARNING_TASKS_RECEIVED,
        learningTasks
      };

      await messageService.getLearningTasks(hero);

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });
});
