import {
    LEVEL_UP_USERS_RECEIVED,
    levelUpUsersReceived
  } from '../../../src/actions/level-up-users-received.action';
  
  import { expect } from '@open-wc/testing';
  
  describe('Action - LEVEL_UP_USERS_RECEIVED', () => {
    it('returns an new action', async () => {
      let levelUpUsers = ['person1@bbd.co.za', 'person2@bbd.co.za'];
  
      const action = levelUpUsersReceived(levelUpUsers);
  
      expect(action.type).to.equal(LEVEL_UP_USERS_RECEIVED);
      expect(action).to.deep.equal({
        type: LEVEL_UP_USERS_RECEIVED,
        levelUpUsers
      });
    });
  });
  