import { mapMissionReceived } from '../actions/map-mission-received.action';
import { BaseService } from './base.service';

export class MapService extends BaseService{
  constructor() {
    super();
  }

  setMapMission(mission) {
    this.store.dispatch(mapMissionReceived(mission));
  }
}

export default new MapService();