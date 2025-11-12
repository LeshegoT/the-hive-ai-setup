import { Injectable } from '@angular/core';
import { AsyncSubject, BehaviorSubject, config } from 'rxjs';
import { Config } from '../shared/config';

@Injectable({
  providedIn:'root'
})
export class EnvironmentService {
  private config: Config;

  config$: AsyncSubject<Config> = new AsyncSubject();

  constructor() {
    this.loadConfig()
      .then(conf => {
        this.config = this.setDefaultConfigValues(conf);
        this.config$.next(this.config);
        this.config$.complete();
      });
   }

  async loadConfig() {
    return fetch('/api/config/admin.json')
      .then(resp => resp.json())
      .then(json => {
        const conf = { ...json };
        conf.API_URL = conf.BASE_SERVER_URL + conf.API_URL;
        if (conf.DEBUG) {
          console.debug(conf);
        }
        return conf;
      });
  }

  setDefaultConfigValues(config: Config): Config {
    return {
      ...config,
      SNACKBAR_DURATION: config.SNACKBAR_DURATION ?? 3000
    }
  }

  getConfig(){
    return this.config$;
  }

  getConfiguratonValues(): Config {
    return this.config;
  }
}
