import { BaseService } from "./base.service";
import { get } from "./shared";
import { multiplierReceived } from '../actions/multiplier.action';

export class MultiplierService extends BaseService{
    constructor(){
        super();
    }

    async getMultiplier(){
        let response = await get(this.buildApiUrl(`multiplier`));
        let multiplier = await response.json();
        this.store.dispatch(multiplierReceived(multiplier));
    }
}

export default new MultiplierService();