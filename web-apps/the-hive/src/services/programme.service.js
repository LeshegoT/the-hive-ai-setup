import { BaseService } from './base.service';
import { get, patch } from './shared';

export class ProgrammeService extends BaseService {
  constructor() {
    super();
  }

  async getAllProgrammes() {
    const response = await get(this.buildApiUrl('programmes'));
    return response.json();
  }

  async addProgrammeUser(programme) {
    const request = { programme };
    await patch(this.buildApiUrl('programmes'), request);
  }
}

export default new ProgrammeService();
