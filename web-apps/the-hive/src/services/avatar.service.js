import { post } from './shared.js';
import { userAvatarReceived } from '../actions/user-avatar-received.action.js';
import authService from './auth.service.js';
import { BaseService } from './base.service.js';

export class AvatarService extends BaseService {
  constructor() {
    super();
  }

  async updateAvatar (body, newParts) {
    let request = {
      upn: authService.getUserPrincipleName(),
      red: body.red,
      green: body.green,
      blue: body.blue,
      parts: newParts
    };

    let response = await post(this.buildApiUrl('updateAvatar'), request);
    let updatedAvatar = await response.json();
    let { avatar, parts } = updatedAvatar;
    this.store.dispatch(userAvatarReceived(avatar, parts));
  };
}

export default new AvatarService();
