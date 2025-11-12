import { get, post } from './shared';
import { partsReceived } from '../actions/parts-received.action';
import { claimPartsReceived } from '../actions/claim-parts-received.action';
import { navigateComponent } from '../actions/app.action';
import { claimPartsChosen } from '../actions/claim-parts-chosen.action';
import { BaseService } from './base.service';

export class PartsService extends BaseService{
  constructor() {
    super();
  }

  async getParts () {
    let response = await get(this.buildApiUrl('parts'));
    let parts = await response.json();
    this.store.dispatch(partsReceived(parts));
  };

  async getClaimParts () {
    let response = await get(this.buildApiUrl('claimParts'));
    let parts = await response.json();
    this.store.dispatch(claimPartsReceived(parts));
  };

  async chooseParts (parts) {
    let request = {
      parts: parts.map((p) => {
        let { claimPartId, partId } = p;
        return { claimPartId, partId };
      })
    };

    let response = await post(this.buildApiUrl('chooseParts'), request);
    let data = await response.json();
    this.store.dispatch(claimPartsChosen(data.parts));

    this.store.dispatch(navigateComponent('/'));
  };
}

export default new PartsService();