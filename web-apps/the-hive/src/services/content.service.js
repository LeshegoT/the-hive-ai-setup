import { get, post } from './shared';
import { BaseService } from './base.service';
import { contentReceived, contentAdded } from '../actions/content-received.action';
import contentTagsService from './content_tags.service'

export class ContentService extends BaseService{
  constructor() {
    super();
  }

  async getContent() {
    let result = await get(this.buildApiUrl('content'));
    let response = await result.json();
    this.store.dispatch(contentReceived(response));
  }

  async rateContent(contentId, upn, ratingId) {
    let request = {
      contentId: contentId,
      userPrincipalName: upn,
      ratingId: ratingId
    };
    let result = await post(this.buildApiUrl(`content/${contentId}/rate`), request);

    let response = await result.json();
    return response;
  }

  async addCuratedContent(url, mediaTypeId, ratingId, userPrincipalName, tags) {
    let request = {
      url,
      mediaTypeId,
      ratingId,
      userPrincipalName,
      tags
    };
    let result = await post(this.buildApiUrl('content'), request);

    let response = await result.json();

    if (response.tags) {
      contentTagsService.addTags(response.tags);
    }
    this.addContent(response);

    return response;
  }

  addContent(content) {
    this.store.dispatch(contentAdded(content));
  }
}

export default new ContentService();
