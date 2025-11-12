import { store } from './store';
import { newVersionPrompt } from './actions/new-version-prompt.action';
import { Workbox } from 'workbox-window';
import configService from './services/config.service';

function shouldLoadServiceWorker(config){
  const browserSupport = 'serviceWorker' in navigator;
  const inProduction = config && config.PRODUCTION ;
  const loadServiceWorker = config && config.LOAD_SERVICEWORKER;
  return browserSupport && (inProduction || loadServiceWorker);
}

function load(config){
  if (shouldLoadServiceWorker(config)){
    if(config.DEBUG){
      console.debug("Attempting to load serviceworker with config", config)
    }

    const workBox = new Workbox('/sw.js');

    function promptUpdate(){
      // Prompt the user to 'install' a new version. (reload)
      store.dispatch(newVersionPrompt());

      // Listen to all store changes.
      store.subscribe(() => {
        if (store.getState().app.updateVersion) {
          setTimeout(()=>window.location.reload(), 1000);
        }
      });
    }

    function checkVersion(gitVersion){
      if (BUILD_TIME && gitVersion){
        let serverDate = new Date(Date.parse(gitVersion['build-date']));
        let appDate = new Date();
        appDate.setTime(BUILD_TIME);
        logToAppInsightsWhenAvailable(() => {
          let eventName = `BuildTime${BUILD_TIME}`
          window.appInsights.trackEvent({ name: eventName });
        });
        if(appDate<serverDate){
          logToAppInsightsWhenAvailable(() => {
            window.appInsights.trackEvent({ name: "PromptUserToUpdateVersionMismatch" });
          });
          promptUpdate();
        } else {
          logToAppInsightsWhenAvailable(() => {
            window.appInsights.trackEvent({ name: "DoNotPromptUserToUpdate" });
          });
         
        }
      } else {
        logToAppInsightsWhenAvailable(() => {
          window.appInsights.trackEvent({ name: "PromptUserToUpdateUnknownVersion" });
        });
        promptUpdate();
      }
    }

    workBox.addEventListener('activated', (event) => {
      // check the version based on gitversion.json
      fetch("/gitversion.json").then(resp => resp.json())
        .then(checkVersion);
    });
    workBox.register().then(registration => {
      if (registration){
        if (config.DEBUG) {
          console.log("Forcing update on new service worker registration", {registration});
        }
        logToAppInsightsWhenAvailable(() => {
          window.appInsights.trackEvent({ name: "ForceServiceWorkerUpdate" });
        });
        registration.update();
      } else {
        if (config.DEBUG) {
          console.error("Registration of service worker failed");
        }
        logToAppInsightsWhenAvailable(() => {
          window.appInsights.trackEvent({ name: "ServiceWorkerRegistraitionFail" });
        });
      }
    });
  }
}

function logToAppInsightsWhenAvailable( callback ){
  if(window.appInsights){
    callback();
  } else {
    setTimeout( ()=>logToAppInsightsWhenAvailable(callback), 1000);
  }
}

configService.registerCallback(load, 'Load service worker')
