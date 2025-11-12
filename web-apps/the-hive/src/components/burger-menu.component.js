import {LitElement, html} from 'lit';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { updateDrawerState } from '../actions/app.action';
import { selectIsGuide } from '../selectors/hero.selectors';
import { selectQuest } from '../selectors/quest.selectors';
import ConfigService from '../services/config.service';
import navigationService from '../services/navigation.service';
import { default as PEER_FEEDBACK_HOME_STATE, default as peerFeedbackService } from '../services/peer-feedback.service';
import { store } from '../store.js';


let styles = html`
  <style>
    .navbar {
      width: 3.5rem;
      height: 3.6rem;
      position: fixed;
      background-color: var(--app-dashboard-color);
      padding-top: 1rem;
      z-index: 7;
    }

    .navbar-nav {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
    }

    .navbar-nav > li:not(:first-child) {
      display: none;
    }

    .navbar-item {
      width: 100%;
      height: 80px;
      -moz-transition: all 0.05s ease-in-out;
      transition: all 0.05s ease-in-out;
    }

    .navbar-item:first-child {
      height: 50px;
    }

    .navbar-item a:hover {
      width: 120%;
      background-color: var(--app-primary-color);
    }

    .navbar-item:last-child {
      margin-top: auto;
    }

    .navbar-link {
      display: flex;
      align-items: center;
      height: 5rem;
      color: white;
      text-decoration: none;
      border: none;
      background: none;
      cursor: pointer;
    }

    .link-text {
      display: none;
    }

    img {
      width: 60%;
      height: 60%;
      margin: auto;
    }

    hr {
      background-color: white;
      width: 75%;
      height: 2%;
      margin: auto;
      border: 1px solid white;
      border-radius: 5px;
      display: none;
    }

    #burger {
      height: 2.5rem;
      padding-bottom: 1rem;
      outline: none;
    }

    #burger img {
      height: 1.2rem;
      margin-right: 10px;
      margin-top: 10px;
      margin-left: 10px;
    }

    @media (min-height: 910px) and (min-width: 50rem) {
      .navbar {
        height: 100vh;
      }

      .navbar-nav > li:not(:first-child) {
        display: initial;
      }

      hr {
        display: initial;
      }
    }
  </style>
`;

class BurgerMenu extends connect(store)(LitElement) {
  constructor() {
    super();
  }

  menuButtonClicked() {
    store.dispatch(updateDrawerState(true));
  }

  drawerOpenedChanged(e) {
    store.dispatch(updateDrawerState(e.target.opened));
  }

  renderGuideButton() {
    if (this.isGuide) {
      return html`
        <li class="navbar-item">
          <a href="/heroes" title="Heroes" class="navbar-link">
            <img src="images/icons/heroes.svg" />
          </a>
          <span class="link-text">Heroes</span>
        </li>
      `;
    }
  }

  renderEditQuestButton() {
    if (this.quest && this.quest.questId) {
      return html`
        <li class="navbar-item">
          <a href="/quest/${this.quest.questId}" title="Edit Quest" class="navbar-link">
            <img src="images/icons/edit.svg" />
          </a>
          <span class="link-text">Edit Quest</span>
        </li>
      `;
    }
  }

  render() {
    return html`
      ${styles}
      <nav class="navbar">
        <ul class="navbar-nav">
          <!-- Burger Menu -->
          <li class="navbar-item">
            <button class="navbar-link" id="burger" @click="${this.menuButtonClicked}">
              <img src="images/icons/burger.svg" />
            </button>
            <!-- <a href="#" class="navbar-link"  id="burger"><img src="images/icons/burger.svg"></a> -->
            <span class="link-text">Expand Menu</span>
          </li>
          <!-- Components -->
          ${ConfigService.loaded && ConfigService.config.APP_COMPONENTS_ENABLED
            ? html`
                <li class="navbar-item">
                  <a href="/components" title="Components" class="navbar-link">
                    <img src="images/icons/components.svg" />
                  </a>
                  <span class="link-text">Components</span>
                </li>
              `
            : html``}
          <!-- Courses -->
          <li class="navbar-item">
            <a href="/tracks" title="Courses" class="navbar-link"><img src="images/icons/courses.svg" /></a>
            <span class="link-text">Courses</span>
          </li>
          <!-- Skills -->
          ${(ConfigService.loaded && ConfigService.config.SKILLS_ENABLED)
            ? html`
                <li class="navbar-item">
                  <a href="/skills" title="Portfolio" class="navbar-link">
                    <img src="images/icons/skills.svg" />
                  </a>
                  <span class="link-text">Portfolio</span>
                </li>
              `
            : html``}
          <!-- Side Quests -->
          <li class="navbar-item">
            <a href="/side-quests" title="Side Quests" class="navbar-link">
              <img src="images/icons/side-quest-new.svg" />
            </a>
            <span class="link-text">Side Quests</span>
          </li>
          <!-- Peer Feedback -->
          ${ConfigService.config.PEER_FEEDBACK_ENABLED
            ? html`
                <li class="navbar-item">
                  <a @click="${this.goToPeerFeedback}" title="Peer Feedback" class="navbar-link">
                    <img src="images/icons/peer-feedback.svg" />
                  </a>
                  <span class="link-text">Peer Feedback</span>
                </li>
              `
            : html``}
          <!-- Level Ups -->
          <li class="navbar-item">
            <a href="/level-ups" title="Level Ups" class="navbar-link">
              <img src="images/icons/level-up-new.svg" />
            </a>
            <span class="link-text">Level Ups</span>
          </li>
          ${ConfigService.loaded && ConfigService.config.PROGRAMMES_ENABLED
            ? html`
                <!-- Programmes -->
                <li class="navbar-item">
                  <a href="/programmes" title="Programmes" class="navbar-link">
                    <img src="images/icons/courses.svg" />
                  </a>
                  <span class="link-text">Programmes</span>
                </li>
              `
            : html``}
          <!-- Surveys -->
          ${ConfigService.loaded && ConfigService.config.SURVEYS_ENABLED
            ? html`
                <li class="navbar-item">
                  <a href="/surveys" title="Surveys" class="navbar-link">
                    <img src="images/icons/survey-question.svg" />
                  </a>
                  <span class="link-text">Level Ups</span>
                </li>
              `
            : html``}
          <!-- Swag Store -->
          ${ConfigService.loaded && ConfigService.config.STORE_ENABLED
            ? html`
                <li class="navbar-item">
                  <a href="/store" title="Swag Store" class="navbar-link">
                    <img src="images/icons/cart.svg" />
                  </a>
                  <span class="link-text">Level Ups</span>
                </li>
              `
            : html``}
          <!-- Leaderboard -->
          ${ConfigService.loaded && ConfigService.config.LEADERBOARD_ENABLED
            ? html`
                <li class="navbar-item">
                  <a href="/leaderboard" title="Leaderboard" class="navbar-link">
                    <img src="images/icons/level-up.svg" />
                  </a>
                  <span class="link-text">Leaderboard</span>
                </li>
              `
            : html``}
          <!-- Heroes -->
          ${this.renderGuideButton()}
          <hr />
          <!-- Edit Quest -->
          ${this.renderEditQuestButton()}
          <!-- Quest Log -->
          <li class="navbar-item">
            <a href="/log" title="Quest Log" class="navbar-link"><img src="images/icons/quest-log.svg" /></a>
            <span class="link-text">Quest Log</span>
          </li>
          <!-- Quest History -->
          <li class="navbar-item">
            <a href="/quest-history" title="Quest History" class="navbar-link">
              <img src="images/icons/quest-history.svg" />
            </a>
            <span class="link-text">Quest History</span>
          </li>
          <hr />
          <!-- Become Guide -->
          <li class="navbar-item">
            <a href="/become-guide" title="Become a Guide" class="navbar-link">
              <img src="images/icons/request.svg" />
            </a>
            <span class="link-text">Become a Guide</span>
          </li>
          <li class="navbar-item">
            <a href="/facewall" title="FaceWall" class="navbar-link">
              <img src="images/icons/names-and-faces.svg" />
            </a>
            <span class="link-text">Names And Faces</span>
          </li>
          ${ConfigService.loaded && ConfigService.config.EVENTS_ENABLED
            ? html`
                <hr />
                <li class="navbar-item">
                  <a href="/events" title="Events" class="navbar-link">
                    <img src="images/icons/white-calendar.svg" />
                  </a>
                  <span class="link-text">Events</span>
                </li>
              `
            : ''}
          <hr />
          <!-- Report A Bug -->
          <li class="navbar-item">
            <a
              title="Report a Bug"
              href="https://bbdgitlab.bbd.co.za/the-hive/the-hive/-/issues"
              class="navbar-link"
              target="_blank"
            >
              <img src="images/icons/bug.svg" />
            </a>
            <span class="link-text">Report A Bug</span>
          </li>
        </ul>
      </nav>
    `;
  }

  goToCourse(courseName) {
    if (!courseName) return;
    let selectedCourse = this.courses.find((c) => c.name === courseName);
    let path = `/course/${selectedCourse.code}`;
    navigationService.navigate(path);
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
    };
  }


   stateChanged(state) {
    this.drawerOpened = state.app.drawerOpened;
    this.quest = selectQuest(state);
    this.isGuide = selectIsGuide(state);
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

window.customElements.define('e-burger-menu', BurgerMenu);
