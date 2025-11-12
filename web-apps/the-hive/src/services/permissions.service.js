import { get } from './shared.js';
import { BaseService } from './base.service.js';

export class PermissionsService extends BaseService {
  constructor() {
    super();
  }

  async getPermissions() {
    let response = await get(this.buildApiUrl(`app/permissions`));
    return response.json();
  }
}

export default new PermissionsService();
