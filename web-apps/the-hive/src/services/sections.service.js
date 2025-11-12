import { sectionCompleted } from '../actions/section-completed.action.js';
import { sectionMarkdownReceived } from '../actions/section-markdown-received.action.js';
import { sectionUnread } from '../actions/section-unread.action.js';
import { sectionsReceived } from '../actions/sections-received.action.js';
import authService from './auth.service.js';
import { BaseService } from './base.service.js';
import pointsService from './points.service.js';
import { del, get, post } from './shared.js';

export class SectionService extends BaseService {
  constructor() {
    super();
  }

  async getSections() {
    const response = await get(this.buildApiUrl('sections'));
    const sections = await response.json();
    this.store.dispatch(sectionsReceived(sections));
  };

  async getSectionMarkdown (fileLocation) {
    // This is intentionally NOT using the 'get' abstraction, because as soon as
    // we pass through the authorisation header stuff, Azure Blob storage tries to
    // validate the bearer token and it can't. - Mike Geyser 08/04/2019
    const response = await fetch(`/courses/${fileLocation}`);
    const blob = await response.blob();
    const reader = new FileReader();
    reader.readAsText(blob);
    reader.onload = (e) => this.store.dispatch(sectionMarkdownReceived(e.target.result));
  };

  async completeSection (sectionId) {
    const request = {
      sectionId,
      upn: authService.getUserPrincipleName(),
    };

    const response = await post(this.buildApiUrl('completeSection'), request);
    const data = response.json();
    this.store.dispatch(sectionCompleted(sectionId));

    pointsService.pointsScored();
  };

  async unreadSection (sectionId) {
    const request = {
      sectionId,
      upn: authService.getUserPrincipleName(),
    };

    await del(this.buildApiUrl('unreadSection'), request);
    this.store.dispatch(sectionUnread(sectionId));
  };

  async addTimeToSection (sectionId, startTime) {
    const timeToAdd = new Date() - startTime;
    const request = {
      sectionId,
      upn: authService.getUserPrincipleName(),
      time: timeToAdd
    };

    post(this.buildApiUrl('addTimeToSection'), request);
  }
}

export default new SectionService();