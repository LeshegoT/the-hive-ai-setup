import { post, get } from './shared.js';
import { missionsReceived } from '../actions/missions-received.action.js';
import { heroMissionsReceived } from '../actions/hero-missions-received.action.js';
import auth_service from './auth.service.js';
import questService from './quest.service.js';
import { BaseService } from './base.service.js';

export class MissionsService extends BaseService {
  constructor() {
    super();
  }

  async completeMission(missionId, missionTypeId, upn) {
    let request = {
      upn,
      missionId,
      missionTypeId,
    };

    let response = await post(this.buildApiUrl('completeMission'), request);
    let missions = await response.json();
    this.store.dispatch(missionsReceived(missions));
  }

  async getHeroMissions(hero) {
    let upn = auth_service.getUserPrincipleName();

    //this check is here so that we don not get the data twice
    //if the user we are trying to get data for is the logged in user, then user-data would have already made this call
    //Gery, 2019-09-19
    if (hero === upn) return;

    let response = await get(this.buildApiUrl(`missions?hero=${hero}`));
    let missions = await response.json();
    this.store.dispatch(heroMissionsReceived(missions));
  }

  async updateGuideMissionDescription(mission, specialisations, specialisationId) {
    let specialisationGuides = await questService.getGuidesBySpecialisation(specialisationId);
    let specialisation = specialisations.find((spec) => spec.specialisationId == specialisationId);

    let specialisationName = specialisation.name;
    if (specialisationGuides.length > 0) {
      mission.description += `<br><br> Available guides for your chosen specialisation (<b>${specialisationName}</b>): <br>`;
      for (let guide of specialisationGuides) {
        mission.description += `<e-hero-title hero="${guide.userPrincipleName}"></e-hero-title>`;
      }
    } else {
      mission.description += `<br><br> There are no guides available yet for your chosen specialisation (<b>${specialisationName}</b>)`;
    }
  }

  async getMissionById(missionsId) {
    let response = await get(this.buildApiUrl(`mission?missionId=${missionsId}`));
    let mission = await response.json();
    this.store.dispatch(heroMissionsReceived(mission));
  }

  async createMissionInteraction(upn, messageTypeId) {
    let request = {
      upn,
      messageTypeId,
    };
    await post(this.buildApiUrl(`selfDirectedMissionInteraction`), request);
  }
}

export default new MissionsService();
