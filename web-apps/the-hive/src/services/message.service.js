import { get, post } from './shared';
import { messagesReceived, feedbackReceived } from '../actions/messages-received.action';
import { learningTasksReceived } from '../actions/learning-tasks-received.action';
import { BaseService } from './base.service';
import contentTagsService from './content_tags.service'
import contentService from './content.service'
import configService from './config.service';

export class MessageService extends BaseService {
  constructor() {
    super();
  }

  async getMessages(heroUserPrincipleName, offset, questId, missionId, courseId, sideQuestId) {
    let params = [`hero=${heroUserPrincipleName}`, `offset=${offset || 0}`];

    if (questId) {
      params.push(`questId=${questId}`);
    }

    if (missionId) {
      params.push(`missionId=${missionId}`);
    }

    if (courseId) {
      params.push(`courseId=${courseId}`);
    }

    if (sideQuestId) {
      params.push(`sideQuestId=${sideQuestId}`);
    }

    let query = params.join('&');

    let response = await get(this.buildApiUrl(`messages?${query}`));
    let messages = await response.json();
    this.store.dispatch(messagesReceived(messages));
  }

  async getAllMessagesDuringQuest(heroUserPrincipleName, questId) {
    let params = [`hero=${heroUserPrincipleName}`, `questId=${questId}`];
    let query = params.join('&');

    let response = await get(this.buildApiUrl(`allMessagesDuringQuest?${query}`));
    let messages = await response.json();

    this.store.dispatch(messagesReceived(messages));
  }

  async createMessage(
    heroUpn,
    text,
    completed,
    questId,
    missionId,
    sideQuestId,
    courseId,
    messageTypeId,
    learningTask,
    multiplier,
    isSelfDirected,
    content
  ) {
    let request = {
      questId,
      missionId,
      sideQuestId,
      courseId,
      messageTypeId,
      text,
      completed,
      heroUpn,
      dateCompleted: learningTask ? learningTask.dateCompleted : null,
      title: learningTask ? learningTask.title : null,
      link: learningTask ? learningTask.link : null,
      timeSpent: learningTask ? learningTask.timeSpent : null,
      multiplier,
      isSelfDirected,
      content
    };
    let response = await post(this.buildApiUrl('createMessage'), request);
    let message = await response.json();
    this.store.dispatch(messagesReceived([message]));
    if (message.content) {
      if(configService.config.TAG_CONTENT_ENABLED){
      contentTagsService.addTags(message.content.tags);
      }else{
        // If tagging is disabled, we simply skip tagging. No further action is required here.
      }
      contentService.addContent(message.content);
    }
    return message;
  }

  async getLearningTasks(userPrincipleName) {
    let response = await get(this.buildApiUrl(`learningTasks/${userPrincipleName}`));
    let learningTasks = await response.json();
    this.store.dispatch(learningTasksReceived(learningTasks));
  }

  sanitizeInput(input) {
    let illegalChars = /[&<>/]/gi;
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '/': '&#x2F;',
    };
    return input.replace(illegalChars, (match) => map[match]);
  }

}

export default new MessageService();
