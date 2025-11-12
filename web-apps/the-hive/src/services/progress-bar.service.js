import { BaseService } from './base.service';
import { progressBarStateReceived } from '../actions/progress-bar.action'

export class ProgressBarService extends BaseService {
  constructor() {
    super();
  }

  updateProgressBar(barState) {
    this.store.dispatch(progressBarStateReceived(barState));
  }
}
export default new ProgressBarService();