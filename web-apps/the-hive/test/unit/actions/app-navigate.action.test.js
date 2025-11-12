import { navigate, navigateComponent, UPDATE_PAGE } from '../../../src/actions/app.action.js';

import { expect } from '@open-wc/testing';
import sinon from 'sinon';

describe('Action - App - navigate', () => {
  let dispatch_stub;
  let actions_dispatched = [];

  before(() => {
    // I'm so, so sorry. - Mike, 2019-09-19
    let fake = (a) => {
      if (typeof a === 'function') {
        a = a(fake);
      }
      actions_dispatched.push(a);
      return a;
    };

    dispatch_stub = sinon.fake(fake);
  });

  afterEach(() => dispatch_stub.resetHistory());

  /*
    We are explicitly ignoring a lot of the loadPage code for code coverage,
    because we can't *actually* stub out dynamic import - so the test
    would have a lot of side-effects. Be careful about which URls we test,
    and what we can actually stub. - Mike, 2019-09-30
  */
  let path_urls_to_test = ['/', '/home'];

  for (let url of path_urls_to_test) {
    it(`successfully navigates to ${url}`, async () => {
      navigate(url)(dispatch_stub);

      let update_page_action = actions_dispatched.find((action) => action.type === UPDATE_PAGE);

      expect(update_page_action).to.be.ok;
    });
  }

  let component_urls_to_test = ['/', '/heroes'];
  for (let url of component_urls_to_test) {
    it(`successfully navigates to component`, async () => {
      navigateComponent(url)(dispatch_stub);

      let update_page_action = actions_dispatched.find((action) => action.type === UPDATE_PAGE);

      expect(update_page_action).to.be.ok;
    });
  }
});
