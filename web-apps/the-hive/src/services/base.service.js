import configService from './config.service';
import { store } from '../store';

export class BaseService {
  constructor(){
    this._configService=configService;
    this._store=store;
  }

  get config(){
    return this._configService;
  }

  get store(){
    return this._store;
  }

  buildApiUrl(route, apiName='hiveApiUrl'){
    if(this.config[apiName]) {
      return `${this.config[apiName]}${route}`
    } else {
      throw new Error(`Unknown API with the name ${apiName}`)
    }
  }
}