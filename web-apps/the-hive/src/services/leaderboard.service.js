import { get } from './shared';
import { leaderboardReceived } from '../actions/leaderboard-received.action';
import { lastMonthPointsReceived } from '../actions/last-month-points-received.action';
import authService from './auth.service.js';
import { BaseService } from './base.service';

export class LeaderboardService extends BaseService{
  constructor() {
    super();
  }

  async fetch_leaderboard(offset = 0) {
    let request = {
      upn: authService.getUserPrincipleName()
    };

    let query = `offset=${offset}`;

    let response = await get(this.buildApiUrl(`leaderboard?${query}`), request)
    let heroes = await response.json();
    this.store.dispatch(leaderboardReceived(heroes));
  }

  async fetch_public_leaderboard() {
    let response = await fetch(this.buildApiUrl('unsecure/leaderboard'));
    let heroes = await response.json();
    this.store.dispatch(leaderboardReceived(heroes));
  }

  async fetch_last_month_points () {
    let response = await get(this.buildApiUrl('lastMonthPoints'));
    let total = await response.json();
    this.store.dispatch(lastMonthPointsReceived(total[0]));
  }
}

export default new LeaderboardService();
