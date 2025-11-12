import { html } from 'lit';
import { StatefulPage } from './stateful-page-view-element';
import '../components/survey.component';
import { shared, reviewShared } from '../styles';
import surveyService, { SURVEY_STATE} from '../services/survey.service';
import '../components/survey-dashboard.component'
import { selectSurveyView, selectActiveSurvey } from '../selectors/survey.selectors';

let styles = html`
  <style>
    ${shared()} ${reviewShared()} :host {
      font-family: 'Inter';
      box-sizing: border-box;
    }

    section {
      min-height: 95vh;
      background-image: url('../../images/hive-background.svg');
      background-repeat: no-repeat;
      background-size: cover;
      display: flex;
      flex-direction: column;
      background-attachment: fixed;
    }
  </style>
`;

class Surveys extends StatefulPage {
  render() {
    return html`
      ${styles}
      <section>
        ${this.renderContent()}
      </section>
    `;
  }

  renderContent() {
    if (this.surveyView == SURVEY_STATE){
       return html`
         <e-survey .surveyAssignment = ${this.selectedAssignment}></e-survey>
       `;
    }
    else{
       return html`
         <e-survey-dashboard></e-survey-dashboard>
       `;
    }
  }

  stateChanged(state) {
    this.surveyView = selectSurveyView(state);
    this.selectedAssignment = selectActiveSurvey(state);
  }

  async firstUpdated() {
    this.surveyAssignments = await surveyService.getSurveyAssignments();
  }

  static get properties() {
    return {
      surveyAssignments: Array,
      surveyView: String,
      selectedAssignment : Object,
    };
  }
}

window.customElements.define('e-surveys', Surveys);
