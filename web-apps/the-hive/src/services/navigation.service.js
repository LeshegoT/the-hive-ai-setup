import { store } from '../store';
import { navigateComponent } from '../actions/app.action';
import { BaseService } from './base.service';

export class NavigationService extends BaseService {
  constructor() {
    super();
  }

  navigate(path) {
    this.store.dispatch(navigateComponent(path));
  }
}

export default new NavigationService();
