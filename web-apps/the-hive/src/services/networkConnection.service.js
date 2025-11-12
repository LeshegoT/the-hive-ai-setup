import { BaseService } from './base.service';

export class NetworkConnection extends BaseService {
  constructor() {
    super();
  }

  isConnectedToInternet() {
    if (navigator.onLine) {
      return true;
    } else {
      return false;
    }
  }
}

export default new NetworkConnection();
