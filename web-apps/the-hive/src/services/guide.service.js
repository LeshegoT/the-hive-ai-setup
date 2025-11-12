import { BaseService } from './base.service';
import { post } from './shared';

export class GuideService extends BaseService {
  constructor() {
    super();
  }

  async cancelGuideRequest (requestId) {
    await post(this.buildApiUrl('cancelGuideRequest'), { requestId });
  }

  async createGuideRequest (heroUpn, guideUpn, justification) {
    await post(this.buildApiUrl('createGuideRequest'), { heroUpn, guideUpn, justification });
  }

  async acceptGuideRequest (request) {
    await post(this.buildApiUrl('acceptGuideRequest'), request);
  }

  async rejectGuideRequest (request) {
    await post(this.buildApiUrl('rejectGuideRequest'), request);
  }
}

export default new GuideService();