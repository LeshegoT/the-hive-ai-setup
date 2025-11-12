import authService from './auth.service';
import { BaseService } from './base.service';
import configService from './config.service';
import { get } from './shared';
export class CanaryReleaseService extends BaseService {
  constructor(authService) {
    super();
    this.authService = authService;
    this.userGroupsCache = undefined;
  }

  async displayFeature() {
    const allowedGroups = configService.config.REVIEW_CANARY_GROUPS; 

    const userPrincipleName = await this.authService.getUserPrincipleName(); 

    if(userPrincipleName){
      const userGroupResponse = await get(this.buildApiUrl(`ad-groups/${userPrincipleName}`));

      if(userGroupResponse){
        const userGroupResult = await userGroupResponse.json();
        return userGroupResult.some((group) => allowedGroups.includes(group.toLowerCase()));
      }else{
        return false;
      }

    }

  }
}

export default new CanaryReleaseService(authService);
