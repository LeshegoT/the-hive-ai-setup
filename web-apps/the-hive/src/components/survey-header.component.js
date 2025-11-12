import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { reviewShared } from '../styles';
import './review-due-label.component';


const styles = html`
  <style>
    ${reviewShared()} #surveyHeading {
      display: flex;
      flex-direction: row;
      width: 100%;
      flex-wrap: wrap;
      justify-content: space-between;
    }

    #surveyTitle {
      text-align: left;
      color: var(--app-review-primary-text-color);
      line-height: 1em;
      font-weight: bold;
      font-size: xx-large;
    }

    #details {
      margin-bottom: 1em;
    }

    #leftPanel {
      display: flex;
      flex-direction: row;
      align-items: center;
    }

    #rightPanel {
      display: flex;
      flex-direction: row;
      justify-content: end;
      align-self: center;
    }

    .profile {
      width: 3em;
      border-radius: 100%;
      max-width: 3em;
      background-size: cover;
      margin-bottom: 1em;
      aspect-ratio: 1/1;
      display: flex;
      margin-right: 2em;
    }

    @media only screen and (max-width: 500px) {
      #surveyHeading {
        align-items: center;
        flex-direction: column;
      }

      #surveyTitle {
        text-align: center;
      }

      .profile {
        margin-bottom: 1em;
      }
    }
  </style>
`;

export class SurveyHeader extends StatefulElement {
  constructor() {
    super();
  }

  render() {
    return html`
      ${styles}
      <section id="surveyHeading">
        <div id="leftPanel">
          ${this.renderSurveyIcon()}
          ${this.renderSurveyHeading()}
        </div>
        
        <div id="rightPanel">
          ${this.renderSurveyDueDate()}
        </div>
      </section>
    `;
  }

  renderSurveyHeading() {{
      return html`
        <h1 id="surveyTitle" class="large-label">Survey</h1>
      `;
    }
  }

  renderSurveyDueDate() {
    const dueDate = new Date(this.deadline);

    return html`
      <div class="dueLabel"><e-review-due-label .dueDate=${dueDate}></e-review-due-label></div>
    `;
  }

  renderSurveyIcon() {
        return html`
          <div class="profile"><img class="icon" src="../../images/icons/survey-question.svg" /></div>
        `;
  }

  static get properties() {
    return {
      deadline: Date,
    };
  }
}

window.customElements.define('e-survey-header', SurveyHeader);
