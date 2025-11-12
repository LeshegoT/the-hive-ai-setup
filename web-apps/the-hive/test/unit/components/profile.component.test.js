import '../shared/stubs/globals';
import { html, fixture, expect } from '@open-wc/testing';
import { user_service_stubs } from '../shared/stubs/user.service.stub';
import '../../../src/components/profile.component';

describe('Component - Profile', () => {
  let userPrincipleName = 'test@bbd.co.za';
  let image = 'data:image/gif;base64,BLABLABLA';

  beforeEach(async () => user_service_stubs.getImage.returns(Promise.resolve(image)));
  afterEach(async () => user_service_stubs.getImage.reset());

  it('should initialise properly.', async () => {
    let el = await fixture(
      html`
        <e-profile .person=${userPrincipleName}></e-profile>
      `
    );

    expect(el).to.be.ok;
    expect(user_service_stubs.getImage.called).to.be.ok;
    expect(el.image).to.deep.equal(image);
  });
});
