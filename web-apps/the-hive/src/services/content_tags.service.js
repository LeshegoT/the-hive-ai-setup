import { get, post } from './shared';
import { BaseService } from './base.service';
import { tagsReceived, tagsAdded } from '../actions/tags-received.action';

export class ContentTagsService extends BaseService{
  constructor() {
    super();
  }

  async getTags(searchText) {
    
    let url = 'tags-and-synonyms';
    if (searchText) {
      url += `?search=${searchText}`;
    }
    let result = await get(this.buildApiUrl(url));

    let response = await result.json();
    this.store.dispatch(tagsReceived(response));
  }

  async getTagById(id) {
    let result = await get(this.buildApiUrl(`tag/${id}`));
    let response = await result.json();
    return response;
  }

  addTags(tags) {
    this.store.dispatch(tagsAdded(tags));
  }
}

export default new ContentTagsService();
