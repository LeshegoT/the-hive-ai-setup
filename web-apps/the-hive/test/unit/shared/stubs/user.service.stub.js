import sinon from 'sinon';
import user_service from '../../../../src/services/user.service';

let getActiveDirectoryProfile = sinon
  .stub(user_service, 'getActiveDirectoryProfile')
  .returns(
    Promise.resolve({
      displayName: 'Test User'
    })
  );

let getImage = sinon
  .stub(user_service, 'getImage')
  .returns(Promise.resolve('fake access token!'));

export let user_service_stubs = {
  getActiveDirectoryProfile,
  getImage
};
