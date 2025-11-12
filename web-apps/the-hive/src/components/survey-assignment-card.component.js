import { html } from 'lit';
import { store } from '../store.js';
import { StatefulElement } from './stateful-element';
import { surveyViewUpdated, activeSurveyReceived } from '../actions/survey.action';
import { reviewShared } from '../styles';
import announcementService from '../services/announcement.service.js';
import { SURVEY_STATE} from '../services/survey.service';


const styles = html`
  <style>
    ${reviewShared()} .card {
      font-family: 'Inter';
      display: flex;
      flex-direction: column;
      padding-bottom: 1em;
      padding-right: 1em;
      height: 16.75em;
      min-height: 16.75em;
      box-sizing: border-box;
      background: var(--app-dashboard-panel);
      box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.25);
      border-radius: 4px;
    }

    .profile {
      max-width: 3.5em;
      height: 3.5em;
      aspect-ratio: 1 / 1;
      border-radius: 100%;
      background-size: cover;
      margin-left: 1.5em;
      display: flex;
    }

    #title {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }

    #progress {
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin-left: 1.5em;
      margin-bottom: 1em;
      height: 100%;
    }

    #footer {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      margin: auto 1em 1em 1.5em;
      gap: 0.8em;
    }

    #profileContainer {
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin-right: 1em;
    }

    #assigneeDetails {
      display: flex;
      flex-direction: row;
      margin-top: 0.5em;
    }

    .redButton {
      height: 2.5em;
      min-height: fit-content;
      width: 13em;
      padding: 0.7em;
    }

    @media only screen and (max-width: 1100px) {
      .card {
        height: fit-content;
      }
    }

    @media only screen and (max-width: 700px) {
      #title {
        flex-direction: column-reverse;
      }

      #progress {
        margin: 2em 1.5em;
      }

      #footer {
        flex-direction: column;
        gap: 1em;
      }

      #surveyName {
        margin-left: 0;
      }

      .redButton {
        width: 100%;
      }
    }
  </style>
`;
class SurveyAssignmentCard extends StatefulElement {
  constructor() {
    super();
  }

  render() {
    return html`
      ${styles}
      <article class="card">
        <section id="title">${this.renderCardTitleInformation()}</section>
        <section id="footer">${this.renderCardFooter()}</section>
      </article>
    `;
  }

  renderCardTitleInformation() {
    return html`
      <div id="assigneeDetails">
        <div id="profileContainer">${this.renderImage()}</div>
        <p>
          <label id="surveyName" class="large-heading">${this.feedbackAssignment.surveyName}</label>
        </p>
      </div>
    `;
  }

  renderImage() {
    return html`
      <div class="profile">
        <img class="icon" src="../../images/icons/survey-question.svg" />
      </div>
    `;
  }

  renderCardFooter() {
    const dueDate = new Date(this.feedbackAssignment.deadline);

    return html`
      <e-review-due-label .dueDate=${dueDate}></e-review-due-label>
      ${this.renderCardActionButton()}
    `;
  }

  renderCardActionButton() {
    return html`
      <button class="redButton" @click=${() => this.redirectToSurveyView(SURVEY_STATE)}>Start Survey</button>
    `;
  }

  async redirectToSurveyView(view) {
    try {
      const status = this.feedbackAssignment.statusName;
      if (status != 'Completed') {
        store.dispatch(activeSurveyReceived(this.feedbackAssignment));
        store.dispatch(surveyViewUpdated(view));
      } else {
        announcementService.createAnnouncement('review', {
          warning: true,
          body: 'This survey has already been completed.',
        });
      }
    } catch {
      announcementService.createAnnouncement('review', {
        warning: true,
        body: 'An unexpected error occurred. Please check your internet connection.',
      });
    }
  }

  static get properties() {
    return {
      feedbackAssignment: Object,
    };
  }

}

window.customElements.define('e-survey-assignment-card', SurveyAssignmentCard);
