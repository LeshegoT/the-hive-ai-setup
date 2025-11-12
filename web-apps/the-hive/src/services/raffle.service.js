import { post, get ,patch} from './shared.js';
import { BaseService } from './base.service.js';
import announcementService from '../services/announcement.service';
import {
  raffleStateUpdated,
  rafflesParticipantReceived,
  raffleReceived,
  raffleParticipantsReceived,
  raffleWinnerReceived,
  raffleEntryPriceReceived
} from '../actions/raffle.action';
import storeService from './store.service.js';
import {STORE_RAFFLE_STATE} from '../services/store.service';
export class RaffleService extends BaseService {
  constructor() {
    super();
  }

  async getUserRaffles() {
    let response = await get(this.buildApiUrl(`raffles`));
    let data = await response.json();

    data.map((raffle) => raffle.spinDate = new Date(raffle.spinDate))

    this.store.dispatch(rafflesParticipantReceived(data));
    this.store.dispatch(raffleReceived({}));
  }

  async getRaffleWinner(id) {
    let response = await get(this.buildApiUrl(`raffle/${id}/winner/`));
    let data = await response.json();
    this.store.dispatch(raffleWinnerReceived(data));
  }

  async getRaffle(id){
    let response = await get(this.buildApiUrl(`raffle/${id}`));
    let data = await response.json();
    data.spinDate = new Date(data.spinDate);
    this.store.dispatch(raffleReceived(data));
    this.store.dispatch(raffleParticipantsReceived(data.participants));
  }

  async createRaffle(data) {
    post(this.buildApiUrl(`raffle`), data).then(() => {
      announcementService.createAnnouncement('none', {
        title: 'Raffle Creation',
        body: `Raffle successfully created`,
      });

      this.getUserRaffles();
      this.store.dispatch(raffleStateUpdated(RAFFLE_HOME_STATE));
    });
  }

  postponeRaffle(data){
    patch(this.buildApiUrl(`raffle/${data.raffleId}/postpone`), data).then(() =>{
      announcementService.createAnnouncement('none', {
        title: 'Raffle Updated',
        body: `Raffle spin date changed`,
      });

      this.getRaffle(data.raffleId)
    })


  }

  updateRaffleState(newState) {
    this.store.dispatch(raffleStateUpdated(newState));
  }

  async updateRaffleParticipants(participant, id) {
    let data = {
      raffleId: id,
      participant: participant,
    };

    let response = await post(this.buildApiUrl(`raffle/participant/`), data);
    let raffle = await response.json();

    announcementService.createAnnouncement('none', {
      title: 'Raffle Updated',
      body: `Raffle participant added`,
    });

    raffle.spinDate = new Date(raffle.spinDate);
    this.store.dispatch(raffleReceived(raffle));
    this.store.dispatch(raffleParticipantsReceived(raffle.participants));
    this.store.dispatch(raffleStateUpdated(RAFFLE_VIEW_STATE));
  
  }

  async buyEntry(entries, id) {
    let request = {
      entries,
    };
    let response = await post(this.buildApiUrl(`raffle/participant/${id}`), request);

    if (response.status === 201){
      announcementService.createAnnouncement('none', {
        title: 'Raffle Entries',
        body: `${entries} raffle entries were successfully purchased!`,
      });
      await storeService.GetBalance();
      storeService.UpdatePurchaseState(STORE_RAFFLE_STATE);
    } else {
      let entryError = await response.json();
      announcementService.createAnnouncement('store', { title: 'Raffle entries', body: entryError });
    }
  }

  async getRaffleEntryPrice() {
    let response = await get(this.buildApiUrl(`raffles/price`));
    let data = await response.json();
    this.store.dispatch(raffleEntryPriceReceived(data.price));
  }
}

export const RAFFLE_HOME_STATE = 'home';
export const RAFFLE_VIEW_STATE = 'view';
export const RAFFLE_CREATE_STATE = 'create';
export const RAFFLE_SPIN_STATE = 'spin';


export default new RaffleService();
