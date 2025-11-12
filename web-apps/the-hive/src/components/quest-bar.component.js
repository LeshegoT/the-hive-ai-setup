import { html, LitElement } from 'lit';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { updateDrawerState } from '../actions/app.action';
import { selectIsGuide } from '../selectors/hero.selectors';
import { selectNotificationActiveCount } from '../selectors/notifications.selectors';
import { selectQuest } from '../selectors/quest.selectors';
import { selectActiveVotingEvents } from '../selectors/voting.selectors';
import { store } from '../store.js';

import '../components/breadcrumbs.component';
import { selectCourses } from '../selectors/course.selectors';
import authService from '../services/auth.service';
import ConfigService from '../services/config.service';
import navigationService from '../services/navigation.service';
import { default as PEER_FEEDBACK_HOME_STATE, default as peerFeedbackService } from '../services/peer-feedback.service';
import userService from '../services/user.service';
import votingService from '../services/voting.service';

let styles = html`
  <style>
    .nav-container {
      height: 4.5rem;
      border-bottom: 1px solid var(--app-border-grey);
      box-shadow: 2px 3px 4px var(--app-dashboard-shadow);
      position: fixed;
      width: 100vw;
      min-width:100vw;
      max-width:100vw;
      background-color: var(--app-dashboard-panel);
      z-index: 6;
    }

    .navbar {
      width: 100%;
      display: inline-block;
    }

    .navbar-nav {
      list-style: none;
      height: 4.5rem;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: row;
      align-items: center;
      width: 100%;
      justify-content: space-between;
    }

    .navbar-nav:first-child {
      align-self: flex-start;
    }

    img {
      height: 30px;
    }

    .link-text {
      display: none;
    }

    #courseSearch {
      border: 2px solid var(--app-dashboard-color);
      border-radius: 25px;
      background-color: var(--app-dashboard-panel);
      box-shadow: 3px 2px 5px var(--app-dashboard-shadow);
      height: 2rem;
      margin-left: auto;
      display: none;
    }

    input {
      outline: none;
      border: none;
      width: 90%;
      margin-left: 10px;
      margin-top: 8px;
    }

    .leftspace {
      margin-left: 0;
    }

    .quest-button {
      -moz-transition: all 0.1s ease-in-out;
      transition: all 0.4s ease-in-out;
      border: 2px solid var(--app-dashboard-color);
      padding: 5px 25px 5px 25px;
      border-radius: 25px;
      position: relative;
      text-decoration: none;
      font-weight: 600;
      margin: 0px 1rem 0px auto;
      color: var(--app-dark-text-color);
    }

    .quest-button:hover {
      background-color: var(--app-primary-color);
      color: white;
      box-shadow: 3px 2px 5px var(--app-dashboard-shadow);
    }

    e-profile {
      margin-inline: 1rem;
      cursor: pointer;
    }

    #logo {
      padding-left: 3.5rem;
    }

    #logo img {
      height: 60px;
      margin-top: 5px;
      margin-left: 5px;
    }

    app-drawer {
      margin: auto;
      display: flex;
      flex-direction: column;
      flex-basis: auto;
      padding-bottom: 0.5em;
      border-bottom: 1px solid var(--app-border-grey);
      box-shadow: 2px 3px 4px var(--app-dashboard-shadow);
      z-index: 8;
    }

    .drawer-list {
      background-color: var(--app-dashboard-color);
      height: 100%;
      overflow-y: scroll;
    }

    .drawer-list a {
      text-decoration: none;
    }

    .logo {
      padding-top: 1rem;
      padding-left: 3.8rem;
      height: 4rem;
      margin: auto;
    }

    .navbar-list {
      list-style: none;
      padding-left: 0;
      height: 100%;
      width: auto;
    }

    .list-container {
      position: relative;
      float: right;
      padding: 5px;
      width: 100%;
      height: 100%;
    }

    .list-title {
      color: white;
      font-size: 16px;
      font-weight: 400;
      text-align: right;
      vertical-align: middle;
      margin-left: 3.5rem;
      margin-top: 1rem;
      line-height: 40px;
    }

    .list-container:hover {
      background-color: var(--app-primary-color);
    }

    .list-icon {
      float: right;
      margin-top: 0rem;
    }

    .list-item img {
      margin-right: 1.2rem;
      margin-top: 5px;
    }

    .list-item {
      cursor: pointer;
    }

    hr {
      margin-bottom: 0;
    }

    @media (min-width: 30rem) {
      #courseSearch {
        display: initial;
      }

      .quest-button {
        margin: 0px 0.5rem 0px 1rem;
      }

      .logo {
        padding-top: 1rem;
        padding-left: 1.8rem;
        margin: auto;
      }

      .list-title {
        color: white;
        font-size: 20px;
        font-weight: 400;
        text-align: right;
        vertical-align: middle;
        margin-left: 3.5rem;
        margin-top: 1rem;
        line-height: 61px;
      }

      .list-icon {
        margin-top: 0.3rem;
      }

      .list-item img {
        margin-top: 15px;
      }
    }

    #logout {
      display: none;
      position: absolute;
      right: 0.5em;
      top: 4em;
      background-color: white;
      border: 1px solid black;
      flex-direction: column;
      gap: 0.5em;
      padding: var(--app-button-padding);
      padding-bottom: 0.5em;
      justify-content: center;
      align-items: center;
    }

    #logout > div {
      cursor: pointer;
      width: 100%;
      height: 2em;
      line-height: 2em;
      text-align: center;
    }

    #logout > div:hover {
      background-color: lightgrey;
    }

    #logout > section {
      text-align: center;
      border-bottom: 1px solid black;
    }

    #logout > section p {
      margin: 0;
    }

    @media (max-width: 480px) {
      .swagstore {
        display: none;
      }
    }

    @media (min-height: 910px) {
      .drawer-list {
        overflow-y: visible;
      }
    }
  </style>
`;

class QuestBar extends connect(store)(LitElement) {
  constructor() {
    super();
  }

  menuButtonClicked() {
    store.dispatch(updateDrawerState(true));
  }

  drawerOpenedChanged(e) {
    store.dispatch(updateDrawerState(e.target.opened));
  }

  renderNotificationBubble() {
    if (this.notificationCount == 0) return html``;
    return html`
      <span class="notify-bubble">${this.notificationCount}</span>
    `;
  }

  renderGuideButton() {
    if (this.isGuide) {
      return html`
        <li>
          <a href="/heroes" class="list-item">
            <div class="list-container">
              <span class="list-title">Heroes</span>
              <img src="images/icons/heroes.svg" class="list-icon" />
            </div>
          </a>
        </li>
      `;
    }
  }

  renderEditQuestButton() {
    if (this.quest && this.quest.questId) {
      return html`
        <li>
          <a href="/quest/${this.quest.questId}" class="list-item">
            <div class="list-container">
              <span class="list-title">Edit Quest</span>
              <img src="images/icons/edit.svg" class="list-icon" />
            </div>
          </a>
        </li>
      `;
    }
  }

  render() {
    return html`
      ${styles}
      <div class="nav-container">
        <nav class="navbar">
          <ul class="navbar-nav">
            <a href="/" id="logo"><img src="images/hive-svg.svg" /></a>
            ${ConfigService.config.COURSE_SEARCH_ENABLED ? html`
            <div id="courseSearch">
              <input
                list="courses"
                type="text"
                placeholder="Search courses"
                @change=${(e) => this.goToCourse(e)}
                aria-labelledby="my-label-id"
              />
              <datalist id="courses">
                ${this.courses.map(
                  (course) =>
                    html`
                      <option>${course.name}</option>
                    `
                )}
              </datalist>
            </div>
            ` : html``}
            ${this.voteEvents && this.voteEvents.length
              ? html`
                  <a href="/voting" class="quest-button">Voting</a>
                `
              : html``}
            ${ConfigService.loaded && ConfigService.config.STORE_ENABLED
              ? html`
                  <a href="/store" class="quest-button leftspace">Swag Store</a>
                `
              : html``}
            <e-profile person="me" @click="${(e) => this.showLogout()}" }></e-profile>
            <div id="logout">
              <section>
                <p>${this.displayName}</p>
                <p>${this.upn}</p>
              </section>
              <div @click="${(e) => this.forceHardRefresh()}">${new Date(BUILD_TIME).toLocaleDateString()}</div>
              <div @click="${(e) => this.clearCachedLogin()}">Clear Cached Login</div>
              <div @click="${(e) => this.logout()}">Logout</div>
            </div>
          </ul>
        </nav>
      </div>

      <app-drawer .opened="${this.drawerOpened}" @opened-changed="${this.drawerOpenedChanged}">
        <nav class="drawer-list">
          <a href="/"><img class="logo" src="images/icons/hive-light.svg" alt="The Hive" /></a>
          <ul class="navbar-list">
          ${ConfigService.loaded && ConfigService.config.APP_COMPONENTS_ENABLED
                ? html`
                    <li>
                      <a href="/components" class="list-item">
                        <div class="list-container">
                          <span class="list-title">Components</span>
                          <img src="images/icons/components.svg" class="list-icon" />
                        </div>
                      </a>
                    </li>
                  `
                : html``}
            <li>
              <a href="/tracks" class="list-item">
                <div class="list-container">
                  <span class="list-title">Courses</span>
                  <img src="images/icons/courses.svg" class="list-icon" />
                </div>
              </a>
            </li>
            <li>
              ${(ConfigService.loaded && ConfigService.config.SKILLS_ENABLED)
                ? html`
                    <li>
                      <a href="/skills" class="list-item">
                        <div class="list-container">
                          <span class="list-title">Portfolio</span>
                          <img src="images/icons/skills.svg" class="list-icon" />
                        </div>
                      </a>
                    </li>
                  `
                : html``}
              <a href="/side-quests" class="list-item">
                <div class="list-container">
                  <span class="list-title">Side Quests</span>
                  <img src="images/icons/side-quest-new.svg" class="list-icon" />
                </div>
              </a>
            </li>
            ${ConfigService.config.PEER_FEEDBACK_ENABLED
              ? html`
                  <li>
                    <a @click="${this.goToPeerFeedback}" class="list-item">
                      <div class="list-container">
                        <span class="list-title">Peer Feedback</span>
                        <img src="images/icons/peer-feedback.svg" class="list-icon" />
                      </div>
                    </a>
                  </li>
                `
              : html``}
            <li>
              <a href="/level-ups" class="list-item">
                <div class="list-container">
                  <span class="list-title">Level Ups</span>
                  <img src="images/icons/level-up-new.svg" class="list-icon" />
                </div>
              </a>
            </li>
            ${ConfigService.loaded && ConfigService.config.PROGRAMMES_ENABLED
              ? html`<li>
              <a href="/programmes" class="list-item">
                <div class="list-container">
                  <span class="list-title">Programmes</span>
                  <img src="images/icons/courses.svg" class="list-icon" />
                </div>
              </a>
            </li>`: html``}

            ${ConfigService.loaded && ConfigService.config.LEADERBOARD_ENABLED
              ? html`
                  <li>
                    <a href="/leaderboard" class="list-item">
                      <div class="list-container">
                        <span class="list-title">Leaderboard</span>
                        <img src="images/icons/level-up.svg" class="list-icon" />
                      </div>
                    </a>
                  </li>
                `
              : html``}
            ${ConfigService.loaded && ConfigService.config.SURVEYS_ENABLED
              ? html`
                  <li>
                    <a href="/surveys" class="list-item">
                      <div class="list-container">
                        <span class="list-title">Surveys</span>
                        <img src="images/icons/survey-question.svg" class="list-icon" />
                      </div>
                    </a>
                  </li>
                `
              : html``}
            ${ConfigService.loaded && ConfigService.config.STORE_ENABLED
              ? html`
                  <li>
                    <a href="/store" class="list-item">
                      <div class="list-container">
                        <span class="list-title">Swag Store</span>
                        <img src="images/icons/cart.svg" class="list-icon" />
                      </div>
                    </a>
                  </li>
                `
              : html``}
            ${this.renderGuideButton()}
            <hr />
            ${this.renderEditQuestButton()}
            <li>
              <a href="/log" class="list-item">
                <div class="list-container">
                  <span class="list-title">Quest Log</span>
                  <img src="images/icons/quest-log.svg" class="list-icon" />
                </div>
              </a>
            </li>
            <li>
              <a href="/quest-history" class="list-item">
                <div class="list-container">
                  <span class="list-title">Quest History</span>
                  <img src="images/icons/quest-history.svg" class="list-icon" />
                </div>
              </a>
            </li>
            <hr />
            <li>
              <a href="/become-guide" class="list-item">
                <div class="list-container">
                  <span class="list-title">Become a Guide</span>
                  <img src="images/icons/request.svg" class="list-icon" />
                </div>
              </a>
            </li>
            <li>
              <a href="/facewall" class="list-item">
                <div class="list-container">
                  <span class="list-title">FaceWall</span>
                  <img src="images/icons/names-and-faces.svg" class="list-icon" />
                </div>
              </a>
            </li>
            ${ConfigService.loaded && ConfigService.config.EVENTS_ENABLED
              ? html`
                <hr />
                <li>
                  <a href="/events" class="list-item">
                    <div class="list-container">
                      <span class="list-title">Events</span>
                      <img src="images/icons/white-calendar.svg" class="list-icon" />
                    </div>
                  </a>
                </li>
                `
              : html``}

            <hr />
            <li>
              <a href="https://bbdgitlab.bbd.co.za/the-hive/the-hive/-/issues" target="_blank" class="list-item">
                <div class="list-container">
                  <span class="list-title">Report A Bug</span>
                  <img src="images/icons/bug.svg" class="list-icon" />
                </div>
              </a>
            </li>
          </ul>
        </nav>
      </app-drawer>
    `;
  }

  goToCourse(changeEvent) {
    let courseName = changeEvent.target.value;
    changeEvent.target.value = '';
    if (!courseName) return;
    let selectedCourse = this.courses.find((c) => c.name === courseName);
    if (selectedCourse) {
      let path = `/course/${selectedCourse.code}`;
      navigationService.navigate(path);
    }

  }

  goToPeerFeedback() {
    peerFeedbackService.updateFeedbackState(PEER_FEEDBACK_HOME_STATE);
    let path = '/peer-feedback';
    navigationService.navigate(path);
  }

  checkGuide() {
    return this.isGuide ? '' : 'hide';
  }

  static get properties() {
    return {
      selected: {
        type: String,
      },
      drawerOpened: {
        type: Boolean,
      },
      isGuide: {
        type: Boolean,
      },
      quest: Object,
      notificationCount: Number,
      courses: Array,
      voteEvents: { type: Array },
      displayName: String,
      upn: String
    };
  }

  firstUpdated() {
    votingService.getActiveVotingEvents();
    this.upn = authService.getUserPrincipleName();
    userService
      .getActiveDirectoryProfile(this.upn)
      .then((profile) => (this.displayName = profile.displayName));
  }

  forceHardRefresh(){
    if(window.appInsights){
      window.appInsights.trackEvent({ name: "UserForceRefresh" });
    }
    localStorage.removeItem("last-reload");
    window.location.replace("/refresh.html");
  }

  clearCachedLogin() {
    authService.clearCachedLogin();
  }

  logout() {
    authService.logOut();
  }

  showLogout() {
    if (!this.showingLogout) {
      this.showingLogout = true;
      this.shadowRoot.getElementById('logout').style.display = 'flex';
    } else {
      this.showingLogout = false;
      this.shadowRoot.getElementById('logout').style.display = 'none';
    }
  }

   stateChanged(state) {
    this.drawerOpened = state.app.drawerOpened;
    this.isGuide = selectIsGuide(state);
    this.quest = selectQuest(state);
    this.notificationCount = selectNotificationActiveCount(state);
    this.courses = selectCourses(state);
    this.voteEvents = selectActiveVotingEvents(state);

    switch (state.app.page) {
      case 'tracks':
      case 'course':
      case 'section':
        this.selected = 'tracks';
        break;
      case 'mission':
        this.selected = 'tracks';
        break;
      case 'log':
        this.selected = 'log';
        break;
      default:
        this.selected = state.app.page;
    }
  }
}

window.customElements.define('e-quest-bar', QuestBar);
