import { BaseService } from './base.service.js';
import announcementService from './announcement.service.js';
import { easterEggReceived } from '../actions/easter-egg.action';
import { post } from './shared.js';

export class RewardsService extends BaseService {
  constructor() {
    super();
  }

  async claimBucks(guid, isEasterEggClaim) {
    let request = { guid, isEasterEggClaim };
    setTimeout(() => this.removeEasterEgg(), 1000);
    let result = await post(this.buildApiUrl('claimCode'), request);
    let response = await result.json();

    if (result.status === 200) {
      if(response.awarded < 0) {
        announcementService.createAnnouncement('store', {
          title: 'OOPS!',
          body: `The code you found cost you ${response.awarded * -1} BBD Bucks, better luck next time!`,
        });
      } else {
        announcementService.createAnnouncement('store', {
          title: 'Congratulations!',
          body: `You earned ${response.awarded} BBD Bucks`,
        });
      }
    } else {
      announcementService.createAnnouncement('none', {
        title: 'Token cannot be claimed 😔 ',
        body: response.message,
      });
    }
  }

  giveEasterEgg(guid) {
    this.store.dispatch(easterEggReceived(guid, true));
    setTimeout(() => this.removeEasterEgg(), 7000);
  }

  removeEasterEgg() {
    this.store.dispatch(easterEggReceived(null, false));
  }
}

export default new RewardsService();