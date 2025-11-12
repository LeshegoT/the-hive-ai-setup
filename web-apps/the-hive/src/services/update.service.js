import { updateVersion } from '../actions/update-version.action';
import { BaseService } from './base.service';

class UpdateService extends BaseService {
  constructor() {
    super();
  }

  update() {
    this.store.dispatch(updateVersion());
  }
}

export default new UpdateService();
