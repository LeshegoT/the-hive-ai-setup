import { Injector } from '@angular/core';
import { map } from 'rxjs/operators';
import { Config } from '../shared/config';
import { EnvironmentService } from './environment.service';


export class BaseService {
  environmentService: EnvironmentService;
  environment: Config;
  constructor(private injector: Injector) {
    this.environmentService=injector.get(EnvironmentService);
    this.environmentService.getConfig().subscribe((env) => (this.environment = env));
  }

  get config(){
    return this.environment;
  }

  get apiUrl() {
    return this.environmentService.getConfig().pipe(map(env=>env.API_URL))
  }

  get eventsUrl() {
    return this.environmentService.getConfig().pipe(map(env=>env.EVENT_SERVER_URL))
  }  

  get msGraphApi(){
    return this.environmentService.getConfig().pipe(map(env=>env.MSGRAPHAPI));
  }
}