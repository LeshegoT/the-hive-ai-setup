import { get } from './shared';
import { BaseService } from './base.service';
import referenceDataService from './reference-data.service';

export class TokenService extends BaseService {
  constructor() {
    super();
  }

  async getUserToken() {
    if (this.config.config.EASTER_EGG_ENABLED){
      const result = await get(this.buildApiUrl('token'));
      const token = await result.json();
      referenceDataService.subscribeToEasterEggs(token.token);
    }
  }
}

export default new TokenService();