import { BaseService } from './base.service';
import { get } from './shared';
import { post } from './shared';
import announcementService from '../services/announcement.service';
import { guideApplicationsReceived } from '../actions/guide-applications-received.action';
import authService from './auth.service';

export class NewGuideService extends BaseService {
  constructor() {
    super();
  }

  async acceptGuideRequest(request) {
    let data = {
      newStatus: "accepted",
    };
    await post(this.buildApiUrl(`newGuideRequest/${request}/status`), data);
  }

  async rejectGuideRequest(request) {
    let data = {
      newStatus: "rejected",
    };
    await post(this.buildApiUrl(`newGuideRequest/${request}/status`), data);
  }

  async guideRequest(UPN) {
    let response = await get(this.buildApiUrl(`newGuideRequests?upn=${UPN}`));
    let guideApplications = await response.json();
    this.store.dispatch(guideApplicationsReceived(guideApplications));
  }

  async addApplication(upn, bio, specialisation) {
    let newApplication = {
      upn: upn,
      bio: bio,
      specialisation: specialisation
    };
    let response = await post(this.buildApiUrl('newGuideRequest'), newApplication);
    if (response.status === 204){
      announcementService.createAnnouncement('none', {
        title: 'Application submitted',
        body: `Your application to be a guide has been submitted`,
      });

      this.guideRequest(upn);
    }
  }

  async cancelApplication(request) {
    let data = {
      newStatus: "cancelled",
    };
    let response = await post(this.buildApiUrl(`newGuideRequest/${request}/status`), data);
    if (response.status === 204){
      announcementService.createAnnouncement('none', {
        title: 'Application cancelled',
        body: `Your application to be a guide has been cancelled`,
      });
      this.guideRequest(authService.getUserPrincipleName());
    }
  }
}

export default new NewGuideService();
