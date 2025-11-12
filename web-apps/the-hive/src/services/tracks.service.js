import { store } from '../store.js';
import { tracksReceived } from '../actions/tracks-received.action';
import { get } from './shared.js';
import authService from '../services/auth.service';
import { BaseService } from './base.service.js';


export class TracksService extends BaseService{
  constructor() {
    super();
  }

  async getTracks () {
    const upn = authService.getUserPrincipleName();
    let response = await get(this.buildApiUrl(`tracks?upn=${upn}`));
    let tracks = await response.json();
    this.store.dispatch(tracksReceived(tracks));
  };
}

export default new TracksService();
