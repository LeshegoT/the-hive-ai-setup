import { get } from './shared';
import { referenceDataReceived } from '../actions/reference-data-received.action';
import RewardsService from './rewards.service';
import { BaseService } from './base.service';

export class ReferenceDataService extends BaseService {
  constructor() {
    super();
  }

  async getReferenceData() {
    let response = await get(this.buildApiUrl('referenceData'));
    let referenceData = await response.json();
    this.store.dispatch(referenceDataReceived(referenceData));
  };

  async subscribeToEasterEggs(token) {
    const source = new EventSource(`${this.config.baseUrl}/public/easter-egg/${token}`);

    source.addEventListener('message', function (e) {
      const event = JSON.parse(e.data);
      if (event.type === 'easter-egg') {
        RewardsService.giveEasterEgg(event.code);
      }
    }, false)
  }
}

export default new ReferenceDataService();
