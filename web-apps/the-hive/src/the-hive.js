/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/


import * as webcomponents from '@webcomponents/webcomponentsjs/webcomponents-loader.js';
import * as prism from 'prismjs/prism.js';
import * as showdown from 'showdown/dist/showdown.js';

webcomponents.toString();
prism.toString();
showdown.getFlavor();


import {LitElement, html} from 'lit';
import { setPassiveTouchGestures } from '@polymer/polymer/lib/utils/settings.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { installMediaQueryWatcher } from 'pwa-helpers/media-query.js';
import { installOfflineWatcher } from 'pwa-helpers/network.js';
import { installRouter } from 'pwa-helpers/router.js';
import { updateMetadata } from 'pwa-helpers/metadata.js';

// This element is connected to the Redux store.
import { store } from './store.js';
import configService from './services/config.service';
import canaryReleaseService from './services/canary-release.service.js';

// These are the actions needed by this element.
import { navigate, updateOffline, updateDrawerState } from './actions/app.action';
import { loggedIn } from './selectors/auth.selectors';

// These are the elements needed by this element.
import '@polymer/app-layout/app-drawer/app-drawer.js';
import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-scroll-effects/effects/waterfall.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';

import { ApplicationInsights } from '@microsoft/applicationinsights-web';

import authService from './services/auth.service';
import { getUserData } from './services/user-data.service';
import { getData } from './services/data.service';

import { variables } from './styles';

import './components/profile.component';
import './services/wizzard.service';
import './components/update-prompt.component';
import './components/burger-menu.component';
import './components/quest-bar.component';
import './components/announcement.component';
import './components/easter-egg.component';

import './pages/dashboard.page';

import './register-sw';

const styles = html`
  <style>
    ${variables()}
      
    /* Workaround for IE11 displaying main as inline */
    main {
      margin-left: 0rem;
      display: block;
      background-color: var(--app-section-even-color);
    }
    .main-content {
      padding-top: 0.3rem;
      min-height: 92.5vh;
    }
    .loading{
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: default;
    }
    .loading > * {
      padding: 2em;
    }
    .force-login:hover{
      cursor: pointer;
    }
    footer {
      padding: 24px;
      background: var(--app-dashboard-color);
      color: var(--app-light-text-color);
      text-align: center;
      height: 20px;
      clear: both;
    }
    footer p {
      margin-top: 0;
    }
    a {
      outline: 0;
    }
    e-tracks,
    e-side-quests,
    e-level-ups,
    e-leaderboard,
    e-log,
    e-settings,
    e-course,
    e-section,
    e-feedbacks,
    e-peer-feedback,
    e-level-up-details,
    e-activity-type,
    e-view-peers-feedback {
      margin-left: 0rem;
    }

    @media (min-width: 50rem) and (min-height: 910px) {
      main {
        margin-left: 3.5rem;
        display: block;
      }
    }
  </style>
`;

class theHive extends connect(store)(LitElement) {
  static get properties() {
    return {
      userGroupChecked: {
        type: Boolean,
      },
    };
  }
  renderCurrentPage() {
    switch (this._page) {
      case 'home':
        return html`
          <e-dashboard></e-dashboard>
        `;
      case 'tracks':
        return html`
          <e-tracks></e-tracks>
        `;
      case 'map':
        return html`
          <e-map></e-map>
        `;
      case 'course':
        return html`
          <e-course .routeData="${this._routeData}"></e-course>
        `;
      case 'skills':
        if((configService.loaded && configService.config.SKILLS_ENABLED)){
          return html`
          <e-skills></e-skills>
        `;
        } else {
          return html``
        }
      
      case 'section':
        return html`
          <e-section .routeData="${this._routeData}"></e-section>
        `;
      case 'about':
        return html`
          <e-about .routeData="${this._routeData}"></e-about>
        `;
      case 'mission':
        return html`
          <e-mission .routeData="${this._routeData}"></e-mission>
        `;
      case 'log':
        return html`
          <e-log .routeData="${this._routeData}"></e-log>
        `;
      case 'quest':
        return html`
          <e-quest-editor .routeData="${this._routeData}"></e-quest-editor>
        `;
      case 'claim':
        return html`
          <e-claim-parts></e-claim-parts>
        `;
      case 'heroes':
        return html`
          <e-hero-quest-summary></e-hero-quest-summary>
        `;
      case 'heroMissions':
        return html`
          <e-hero-missions .routeData="${this._routeData}"></e-hero-missions>
        `;
      case 'guide-feedback':
        return html`
          <e-guide-feedback></e-guide-feedback>
        `;
      case 'complete-quest':
      case 'pause-quest':
      case 'abandon-quest':
        return html`
          <e-change-quest-status .routeData="${this._routeData}"></e-change-quest-status>
        `;
      case 'permission':
        return html`
          <e-no-permission></e-no-permission>
        `;
      case 'side-quests':
        return html`
          <e-side-quests></e-side-quests>
        `;
      case 'side-quest':
        return html`
          <e-side-quest .routeData="${this._routeData}"></e-side-quest>
        `;
      case 'leaderboard':
        return html`
          <e-leaderboard></e-leaderboard>
        `;
      case 'store':
        return html`
          <e-store .routeData="${this._routeData}"></e-store>
        `;
      case 'settings':
        return html`
          <e-settings></e-settings>
        `;
      case 'level-ups':
        return html`
          <e-level-ups .routeData="${this._routeData}"></e-level-ups>
        `;
      case 'level-up-details':
        return html`
          <e-level-up-details .routeData="${this._routeData}"></e-level-up-details>
        `;
      case 'activity-type':
        return html`
          <e-activity-type .routeData="${this._routeData}"></e-activity-type>
        `;
      case 'attend-activity':
        return html`
          <e-attend-activity .routeData="${this._routeData}"></e-attend-activity>
        `;
      case 'quest-history':
        return html`
          <e-quest-history></e-quest-history>
        `;
      case 'guide-request':
        return html`
          <e-guide-request></e-guide-request>
        `;
      case 'vote':
        return html`
          <e-vote></e-vote>
        `;
      case 'peer-feedbacks':
        return html`
          <e-feedbacks .routeData="${this._routeData}"></e-feedbacks>
        `;
      case 'peer-feedback':
        return this.redirectFeedback();
      case 'voting':
        return html`
          <e-voting></e-voting>
        `;
      case 'syndicate':
        return html`
          <e-level-up-syndicates .routeData="${this._routeData}"></e-level-up-syndicates>
        `;
      case 'become-guide':
        return html`
          <e-become-guide></e-become-guide>
        `;
      case 'surveys':
        return html`
          <e-surveys></e-surveys>
        `;
      case 'names-and-faces':
        return html`
          <e-names-and-faces .routeData="${this._routeData}"></e-names-and-faces>
        `;
      case 'events':
        return html`
          <e-events .routeData="${this._routeData}"></e-events>
        `;
      case 'events-details':
        return html`
          <e-event-detail .eventId="${this._routeData[0]}"></e-event-detail>
        `;
      case 'programmes':
        return html`
          <e-programmes></e-programmes>
        `;
        case 'components':
          return html`
            <e-app-components></e-app-components>
          `;
      default:
        return html`
          <e-not-found></e-not-found>
        `;
    }
  }


  checkNewFeedbackDesignCanaryReleaseEnabled(){
    return this._newReviewFeatureFlag !== undefined && this._newReviewFeatureFlag;
  }

  redirectFeedback(){
    let showNewFeedback = this.checkNewFeedbackDesignCanaryReleaseEnabled();

    if(this.forcedFeedbackView){
      if(this.forcedFeedbackView==='new'){
        showNewFeedback=true;
      } else if (this.forcedFeedbackView==='old'){
        showNewFeedback=false;
      } else {
        // the value stored in the database is not valid and will be ignored
      }
    }

    if (this._newReviewFeatureFlag !== undefined) {
      if (showNewFeedback) {
        return html`
          <e-review .routeData="${this._routeData}"></e-review>
        `;
      } else {
        return html`
          <e-peer-feedback .routeData="${this._routeData}"></e-peer-feedback>
        `;
      }
    }else{
      return html`
        <e-waiting .routeData="${this._routeData}"></e-waiting>
      `;
    }
  }

  enablePageAzureAnalyticsOnProd() {
    configService.registerCallback((config) => {
      if (config) {
        if(config.ENABLE_ANALYTICS){
          const appInsights = new ApplicationInsights({
            config: {
              instrumentationKey: config.INSTRUMENTATION_KEY,
              enableAutoRouteTracking: true,
              disableFetchTracking: false,
              enableUnhandledPromiseRejectionTracking: true
            },
          });
          appInsights.loadAppInsights();
          appInsights.trackPageView();
          console.info("Analytics enabled");
          window.appInsights=appInsights;
        } else {
          console.warn("AppInsights analytics not enabled");
        }
        if (config.LOGIN_RELOAD_COUNTDOWN_SECONDS) {
          this.countdown = config.LOGIN_RELOAD_COUNTDOWN_SECONDS;
          console.info("Countdown set");
        } else {
          console.warn("Countdown not set");
        }
      } else {
        console.error("Callback for config called without config parameter");
      }
    }, 'Analytics and countdown');
  }

  render() {
    if (!this.loggedIn) {
      return html`
        ${styles}
        <main role="main" class="main-content loading">
          <section>Please wait while we confirm your active directory login</section>
          <section>You may be redirected</section>
          <section class="force-login" @click="${(e) => this.forceNewLogin()}">Click here if you want to force a new login now</section>
          <section id="countdown">This page will automatically refresh within ${this.countdown} seconds</section>
        </main>
        <footer>
          <p>Made with &hearts; by all of BBD.</p>
        </footer>
        <e-update-prompt></e-update-prompt>
      `;
    }
    return html`
      ${styles}
      <e-burger-menu></e-burger-menu>
      <e-quest-bar></e-quest-bar>
      <e-announcement></e-announcement>
      <e-easter-egg></e-easter-egg>
      <!-- Main content -->
      <main role="main" class="main-content">${this.renderCurrentPage()}</main>

      <footer>
        <p>Made with &hearts; by all of BBD.</p>
      </footer>

      <e-update-prompt></e-update-prompt>
    `;
  }

  get loggedIn() {
    return this._loggedIn;
  }

  static get properties() {
    return {
      appTitle: {
        type: String,
      },
      _page: {
        type: String,
      },
      _selected: {
        type: String,
      },
      _routeData: {
        type: Array,
      },
      _drawerOpened: {
        type: Boolean,
      },
      _loggedIn: {
        type: Boolean,
      },
      countdown: { type: Number },
      countdownTimer: { type: Number },
      _newReviewFeatureFlag : Boolean,
      forcedFeedbackView: String
    };
  }

  constructor() {
    super();
    // To force all event listeners for gestures to be passive.
    // See https://www.polymer-project.org/3.0/docs/devguide/settings#setting-passive-touch-gestures
    setPassiveTouchGestures(true);
    this._loggedIn = false;
    this.countdown=10;
  }

  forceNewLogin(){
    authService.clearCachedLogin();
  }

  routingFunction(location) {
    if (location.pathname.includes('admin')) {
      // this forces the browser to reload the page from the server
      // and breaks us out of PWA dispatch routing
      location.reload(true);
    }
    if (location.hash !== '' && location.pathname === '/') {
      // This is the a MSAL redirect response! IGNORE IT, since we do not want to reload the app!!
      if (configService.debug) {
        console.debug('Routing', location.pathname, location.hash, location.search, { location });
      }
    } else {
      store.dispatch(navigate(decodeURIComponent(location.pathname)));
    }
  }

  countItDown(){
    this.countdown=this.countdown-1;
    if(this.countdown<0) {
      if(!this._loggedIn){
        if (window.appInsights) {
          window.appInsights.trackEvent({ name: "CountdownLoginForced" });
        }
        this.countdownTimer=undefined;
        this.forceNewLogin();
      }
    } else {
      this.countdownTimer = setTimeout(()=>this.countItDown(), 1000);
    }
  }


  async setCanaryReleaseFlag(){
    if (configService.config.PEER_FEEDBACK_NEW_DESIGN_ENABLED){
      this._newReviewFeatureFlag = true;
    }else{
      this._newReviewFeatureFlag = await canaryReleaseService.displayFeature();
    }
  }

  firstUpdated() {
    installRouter(this.routingFunction);
    installOfflineWatcher((offline) => store.dispatch(updateOffline(offline)));
    installMediaQueryWatcher(`(min-width: 460px)`, () => store.dispatch(updateDrawerState(false)));
    this.countItDown();

    // entry into config init (and fetch) is delayed.
    configService.initializeConfig();
    this.enablePageAzureAnalyticsOnProd();
    configService.registerCallback(authService.initialise.bind(authService), 'AuthService');
  }


  updated(changedProps) {
    if (changedProps.has('_page')) {
      const pageTitle = this.appTitle; // + ' - ' + this._page;
      updateMetadata({
        title: pageTitle,
        description: pageTitle,
        // This object also takes an image property, that points to an img src.
      });
    }
  }

  stateChanged(state) {
    this._page = state.app.page;
    this._routeData = state.app.routeData;
    this._drawerOpened = state.app.drawerOpened;
    let previousLoginState = this.loggedIn;
    this._loggedIn = loggedIn(state);
    if (this.loggedIn && !previousLoginState) {
      // only do this once!!!
      getUserData();
      getData();
      this.setCanaryReleaseFlag();
    }

    if (!this.forcedFeedbackView && state.settings && state.settings['feedback-view']){
      this.forcedFeedbackView = state.settings['feedback-view'];
    }

    switch (this._page) {
      case 'tracks':
      case 'course':
      case 'section':
        this._selected = 'tracks';
        break;
      default:
        this._selected = this._page;
    }
  }
}

window.customElements.define('the-hive', theHive);
