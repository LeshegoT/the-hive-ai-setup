import { post } from './shared';
import { get } from './shared.js';
import { votingOptionsReceived } from '../actions/voting-options-received.action';
import { userVotesReceived } from '../actions/user-votes-received.action';
import { votingEventReceived } from '../actions/voting-event-received.action';
import { votingActiveEventsReceived } from '../actions/voting-active-events-received.action';
import { BaseService } from './base.service';
import announcementService from './announcement.service';
import { votingActiveEvents } from '../reducers/voting.reducer';

export class VotingService extends BaseService{
  constructor() {
    super();
  }

  async getVotingEvent(eventId) {
    let response = await get(this.buildApiUrl(`votingEvent?eventId=${eventId}`));
    let data = await response.json();

    this.store.dispatch(votingEventReceived(data));
  }

  async getVotingOptions(eventId) {
    let response = await get(this.buildApiUrl(`votingOptions?eventId=${eventId}`));
    let data = await response.json();

    this.store.dispatch(votingOptionsReceived(data));
  }

  async getActiveVotingEvents(){
    let response = await get(this.buildApiUrl('activeVotingEvents'));
    let data = await response.json();
    
    this.store.dispatch(votingActiveEventsReceived(data));
  }

  async getUserVotes(eventId) {
    let response = await get(this.buildApiUrl(`userVotes?eventId=${eventId}`));
    let data = await response.json();

    this.store.dispatch(userVotesReceived(data));
  }

  async vote(votingOption, rating, eventId ) {
    let response = await post(this.buildApiUrl('vote'), { votingOption, rating, eventId });
    let result = await response.json();

    if(result.reward) {
      announcementService.createAnnouncement('store', {
        title: 'Thanks for your feedback!',
        body: `Your vote has been successfully submitted and you earned ${result.reward} BBD Bucks`,
      });
    } else {
      announcementService.createAnnouncement('none', {
        title: 'Thanks for your feedback!',
        body: `Your vote has been successfully submitted`,
      });
    }

    this.getUserVotes(eventId);
  }
}

export default new VotingService();
