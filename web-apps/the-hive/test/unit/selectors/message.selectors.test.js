import { expect } from '@open-wc/testing';
import {
  selectAllMessages,
  selectMyMessages,
  selectMessagesForMission,
  selectMessagesForCourse,
  selectMessagesForSideQuest,
  selectMapMessagesForLevelUp,
  selectMapMessagesForConversation,
  selectMapMessagesForSelfDirected,
  selectHeroMessages
} from '../../../src/selectors/messages.selectors';

describe('Selector - Message', () => {
  it('should return all messages from state ordered correctly', () => {
    let state = {
      messages: {
        all: [
          { messageId: 1, creationDate: '2019-01-01' },
          { messageId: 2, creationDate: '2019-01-02' },
          { messageId: 3, creationDate: '2019-01-03' }
        ]
      }
    };

    let expected_messages = [
      { messageId: 3, creationDate: new Date('2019-01-03') },
      { messageId: 2, creationDate: new Date('2019-01-02') },
      { messageId: 1, creationDate: new Date('2019-01-01') }
    ];

    let messages = selectAllMessages(state);

    expect(messages).to.deep.equal(expected_messages);
  });

  it('should select my messages correctly', () => {
    let messages = [
      { messageId: 1, missionId: 1, courseId: 1, messageTypeId: 1, sideQuestId: 1 },
      { messageId: 2, missionId: 2, courseId: 2, messageTypeId: 2, sideQuestId: 2 },
      { messageId: 3, missionId: 3, courseId: 3, messageTypeId: 3, sideQuestId: 3 }
    ];
    let missions = [{ missionId: 1 }, { missionId: 2 }, { missionId: 3 }];
    let courses = [{ courseId: 1 }, { courseId: 2 }, { courseId: 3 }];
    let messageTypes = [{ messageTypeId: 1 }, { messageTypeId: 2 }, { messageTypeId: 3 }];
    let learningTasks = [
      { learningTaskId: 1, messageId: 1 },
      { learningTaskId: 2, messageId: 2 },
      { learningTaskId: 3, messageId: 3 }
    ];
    let sideQuests = [{ sideQuestId: 1 }, { sideQuestId: 2 }, { sideQuestId: 3 }];

    let expected_messages = [
      {
        messageId: 1,
        missionId: 1,
        courseId: 1,
        messageTypeId: 1,
        sideQuestId: 1,
        mission: { missionId: 1 },
        course: { courseId: 1 },
        messageType: { messageTypeId: 1 },
        learningTask: { learningTaskId: 1, messageId: 1 },
        sideQuest: undefined
      },
      {
        messageId: 2,
        missionId: 2,
        courseId: 2,
        messageTypeId: 2,
        sideQuestId: 2,
        mission: { missionId: 2 },
        course: { courseId: 2 },
        messageType: { messageTypeId: 2 },
        learningTask: { learningTaskId: 2, messageId: 2 },
        sideQuest: undefined
      },
      {
        messageId: 3,
        missionId: 3,
        courseId: 3,
        messageTypeId: 3,
        sideQuestId: 3,
        mission: { missionId: 3 },
        course: { courseId: 3 },
        messageType: { messageTypeId: 3 },
        learningTask: { learningTaskId: 3, messageId: 3 },
        sideQuest: undefined
      }
    ];

    let actual_messages = selectMyMessages.resultFunc(
      messages,
      missions,
      courses,
      messageTypes,
      learningTasks,
      sideQuests
    );

    expect(actual_messages).to.deep.equal(expected_messages);
  });

  it('should return only mission messages if mission', () => {
    let messages = [
      { messageId: 1, missionId: 1 },
      { messageId: 2, missionId: 2 },
      { messageId: 3, missionId: 3 }
    ];
    let mission = { missionId: 1 };

    let expected_messages = [{ messageId: 1, missionId: 1 }];

    let actual_messages = selectMessagesForMission.resultFunc(mission, messages);

    expect(actual_messages).to.deep.equal(expected_messages);
  });

  it('should return only course messages if course', () => {
    let messages = [
      { messageId: 1, courseId: 1 },
      { messageId: 2, courseId: 2 },
      { messageId: 3, courseId: 3 }
    ];
    let course = { courseId: 1 };

    let expected_messages = [{ messageId: 1, courseId: 1 }];

    let actual_messages = selectMessagesForCourse.resultFunc(course, messages);

    expect(actual_messages).to.deep.equal(expected_messages);
  });

  it('should return only side quest messages if side quest', () => {
    let messages = [
      { messageId: 1, sideQuestId: 1 },
      { messageId: 2, sideQuestId: 2 },
      { messageId: 3, sideQuestId: 3 }
    ];
    let sideQuest = { id: 1 };

    let expected_messages = [{ messageId: 1, sideQuestId: 1 }];

    let actual_messages = selectMessagesForSideQuest.resultFunc(sideQuest, messages);

    expect(actual_messages).to.deep.equal(expected_messages);
  });

  it('should return only level up messages if level up', () => {
    let messages = [
      { messageId: 1, courseId: 1 },
      { messageId: 2, courseId: 2 },
      { messageId: 3, courseId: 3 },
    ];
    let course = { courseId: 1 };

    let expected_messages = [{ messageId: 1, courseId: 1 }];

    let actual_messages = selectMapMessagesForLevelUp.resultFunc([course], messages);

    expect(actual_messages).to.deep.equal(expected_messages);
  });
  
  it('should return map mission conversation messages correctly', () => {
    let types = [
      { code: 'conversation', messageTypeId: 1 },
      { code: 'random', messageTypeId: 1 },
    ];

    let messages = [
      { messageTypeId: 1, heroUserPrincipleName: 'Test' },
      { messageTypeId: 1, heroUserPrincipleName: 'Not Test' },
    ];

    let hero = 'Test';

    let expected_messages = [{ messageTypeId: 1, heroUserPrincipleName: 'Test' }];

    let actual_messages = selectMapMessagesForConversation.resultFunc(types,messages,hero);

    expect(expected_messages).to.deep.equal(actual_messages);
  });

  it('should return map mission self-directed messages correctly', () => {
    let messages = [{ selfDirected: true }, { selfDirected: true }, { selfDirected: false }, { selfDirected: false }];

    let expected_messages = [{ selfDirected: true }, { selfDirected: true }];

    let actual_messages = selectMapMessagesForSelfDirected.resultFunc(messages);

    expect(expected_messages).to.deep.equal(actual_messages);
  });

  it('should select hero messages correctly', () => {
    let hero = 'test@bbd.co.za';
    let messages = [
      {
        messageId: 1,
        missionId: 1,
        courseId: 1,
        messageTypeId: 1,
        sideQuestId: 1,
        heroUserPrincipleName: hero,
        questId: 1,
        name: 'message1',
        icon: 'icon1',
        code: null,
        link: null,
        creationDate: new Date('2019-01-01')
      },
      {
        messageId: 2,
        missionId: 2,
        courseId: 2,
        messageTypeId: 2,
        sideQuestId: 2,
        heroUserPrincipleName: hero,
        questId: null,
        name: 'message2',
        icon: 'icon1',
        code: 'article',
        link: null,
        creationDate: new Date('2019-01-02')
      },
      {
        messageId: 3,
        missionId: 3,
        courseId: 3,
        messageTypeId: 3,
        sideQuestId: 3,
        createdByUserPrincipleName: 'test-not@bbd.co.za',
        heroUserPrincipleName: 'test-not@bbd.co.za',
        questId: null,
        name: 'message3',
        icon: 'icon1',
        code: 'level-up',
        link: 'www.The-Hive.co.za',
        creationDate: new Date('2019-01-03')
      }
    ];

    let expected_messages = [
      {
        messageId: 1,
        missionId: 1,
        courseId: 1,
        messageTypeId: 1,
        sideQuestId: 1,
        heroUserPrincipleName: hero,
        questId: 1,
        name: 'message1',
        icon: 'icon1',
        code: null,
        link: null,
        creationDate: new Date('2019-01-01')
      },
      {
        messageId: 2,
        missionId: 2,
        courseId: 2,
        messageTypeId: 2,
        sideQuestId: 2,
        heroUserPrincipleName: hero,
        questId: null,
        name: 'message2',
        icon: 'icon1',
        code: 'article',
        link: null,
        creationDate: new Date('2019-01-02')
      }
    ];

    let actual_messages = selectHeroMessages.resultFunc(hero, messages);

    expect(actual_messages).to.deep.equal(expected_messages);
  });
});
