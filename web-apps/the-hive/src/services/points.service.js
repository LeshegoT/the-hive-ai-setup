import { BaseService } from './base.service';
import { get } from './shared';
import { pointsReceived, pointTypesReceived } from '../actions/points.action';
import announcementService from './announcement.service';
import configService from './config.service';

export class PointsService extends BaseService{
    constructor(){
      super();
    }

    async todaysPointsInformation(){
      let response = await get(this.buildApiUrl(`points`));
      let pointsData = await response.json();
      
      this.store.dispatch(
        pointsReceived(pointsData)
      );
    }

    async getPointTypes(){
      let response = await get(this.buildApiUrl(`pointTypes`));
      let pointTypes = await response.json();
      this.store.dispatch(
        pointTypesReceived({
          pointTypes
        })
      );
    }

    pointsScored() {
      if (configService.config.POP_UPS_ENABLED) {
        announcementService.createAnnouncement('score',{});
      } else {
        // do nothing if pop ups are disabled
      }
    }
}

export default new PointsService();