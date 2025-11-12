import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { UserService } from '../../../src/services/user.service';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';

describe('Service - UserService', () => {
  let userService;

  before(() => {
    userService = new UserService();
  });

  it('should initialise correctly.', () => {
    expect(userService.config).to.be.ok;
  });

  describe('getActiveDirectoryProfile', () => {
    let profile = {
      displayName: 'Test User'
    };

    before(() => fetch_stub_returns_json(profile));

    after(() => fetch_stub.reset());

    it("should return the user's active directory profile from the graph api.", async () => {
      let expected = await userService.getActiveDirectoryProfile('test@bbd.co.za');

      expect(expected).to.deep.equal(profile);
    });
  });

  describe('getImage', () => {
    let picture = 'AWESOME_PROFILE_PICTURE_BYTE_STREAM';

    before(() => fetch_stub_returns_json(picture));

    after(() => fetch_stub.reset());

    let test_get_image = async (user, url) => {
      let expected_picture = await userService.getImage(user);

      expect(fetch_stub.calledWith(url, sinon.match.any)).to.be.ok;
      expect(expected_picture).to.deep.equal(picture);
    };

    // it("should return the user's profile picture from the graph api.", async () => {
    //   let user = 'wat@bbd.co.za';
    //   let url = `http:/localhost/users/${user}/photo/$value`;

    //   await test_get_image(user, url);
    // });

    // it('should return my profile picture from the graph api.', async () => {
    //   let url = 'http:/localhost/me/photo/$value';
    //   await test_get_image('me', url);
    // });

    it('should return the system icon.', async () => {
      let url = 'images/hive.svg';

      await test_get_image('System', url);
    });
  });
});
