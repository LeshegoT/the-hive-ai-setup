import { get } from './shared';
import { heroesReceived } from '../actions/heroes-received.action';
import authService from './auth.service';
import { BaseService } from './base.service';

export class HeroService extends BaseService {
  constructor() {
    super();
  }

  async getHeroes () {
    const upn = authService.getUserPrincipleName();

    let response = await get(this.buildApiUrl(`heroes?upn=${upn}`));
    let heroes = await response.json();
    this.store.dispatch(heroesReceived(heroes));
  };
}

export default new HeroService();