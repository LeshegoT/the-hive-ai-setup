import { BaseService } from './base.service';
import { announcementReceived } from '../actions/announcement.action';

export class AnnouncementService extends BaseService {
  constructor() {
    super();
  }

  createAnnouncement(type, details) {
    let announcement = {
      display: true,
      type,
      details
    }

    this.store.dispatch(announcementReceived(announcement));

    setTimeout(() => this.removeAnnouncement(), 6000);
  }

  removeAnnouncement() {
    this.store.dispatch(announcementReceived({ display: false }));
  }
}

export default new AnnouncementService();