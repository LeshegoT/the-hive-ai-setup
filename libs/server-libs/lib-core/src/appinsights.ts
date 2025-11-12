import * as appInsights from 'applicationinsights';
import { parseIfSetElseDefault } from './environment-utils';
import { logger } from './logger';

let configuredAppInsights: typeof appInsights.defaultClient = undefined;

export function configureAppInsights(): typeof appInsights.defaultClient | undefined {
  if(configuredAppInsights){
    return configuredAppInsights;
  }
  if(parseIfSetElseDefault("ENABLE_ANALYTICS",false) && parseIfSetElseDefault("APPINSIGHTS_CONNECTION_STRING","")){
     appInsights
      .setup(parseIfSetElseDefault("APPINSIGHTS_CONNECTION_STRING", ""))
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true)
      .setUseDiskRetryCaching(true)
      .start();
      configuredAppInsights=appInsights.defaultClient
      return configuredAppInsights;
  } else {
    logger.info("Request for app insights ignored, app insights are not enabled or connection string not provided");
    return undefined;
  }
}
