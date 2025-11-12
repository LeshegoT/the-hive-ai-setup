import { get, post } from './shared';
import { BaseService } from './base.service';
import { ratingsReceived } from '../actions/ratings-received.action';

export class ContentRatingsService extends BaseService{
  constructor() {
    super();
  }

  async getRatingValues() {
    
    let url = 'ratingValues';
    let result = await get(this.buildApiUrl(url));

    let response = await result.json();
    this.store.dispatch(ratingsReceived(response))
  }
}

export default new ContentRatingsService();
