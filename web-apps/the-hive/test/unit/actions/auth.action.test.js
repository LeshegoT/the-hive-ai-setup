import { LOGGED_IN, NOT_LOGGED_IN, loggedIn, loggedOut} from '../../../src/actions/auth.action';
import { expect } from '@open-wc/testing';

describe('Action - Auth', () => {
    it('Login fires LOGGED_IN action', ()=>{
      expect(loggedIn({})).to.eql({type:LOGGED_IN})
    });
    it('Lougout fires NOT_LOGGED_IN action', ()=>{
      expect(loggedOut({})).to.eql({type:NOT_LOGGED_IN})
    });
});