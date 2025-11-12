import {
    USER_LEVEL_UP_ACTIVITIES_RECEIVED,
    userLevelUpActivitiesReceived
  } from '../../../src/actions/user-level-up-activities-received.action';
  
  import { expect } from '@open-wc/testing';
  
  describe('Action - USER_LEVEL_UP_ACTIVITIES_RECEIVED', () => {
    it('returns an new action', async () => {
      let userLevelUpActivities = [{levelUpActivityId: 1}, {levelUpActivityId: 2}];
  
      const action = userLevelUpActivitiesReceived(userLevelUpActivities);
  
      expect(action.type).to.equal(USER_LEVEL_UP_ACTIVITIES_RECEIVED);
      expect(action).to.deep.equal({
        type: USER_LEVEL_UP_ACTIVITIES_RECEIVED,
        userLevelUpActivities
      });
    });
  });