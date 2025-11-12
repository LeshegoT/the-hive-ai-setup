import { html } from 'lit';
import { shared, reviewShared } from '../styles';
import { StatefulPage } from './stateful-page-view-element';
import '../components/feedback-dashboard.component';
import '../components/review-survey.component';
import '../components/feedback-tutorial.component';
import { selectReviewView } from '../selectors/review.selectors';
import reviewService, { REVIEW_SURVEY_STATE, REVIEW_TUTORIAL_STATE } from '../services/review.service';

const styles = html`
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
class Review extends StatefulPage {
  render() {
    return html`
      ${styles}
      <section>
        ${this.renderContent()}
      </section>
    `;
  }

  renderContent() {
    switch (this.reviewView) {
      case REVIEW_SURVEY_STATE:
        return html`
            <e-review-survey></e-review-survey>
        `;
      case REVIEW_TUTORIAL_STATE:
        return html`
            <e-feedback-tutorial></e-feedback-tutorial>
        `;
      default:
        return html`
            <e-feedback-dashboard></e-feedback-dashboard>
        `;
    }
  }

  stateChanged(state) {
    this.reviewView = selectReviewView(state);
  }

  static get properties() {
    return {
      reviewView: String,
    };
  }

  firstUpdated() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('id')) {
      let assignmentId = urlParams.get('id');
      history.pushState({}, null, 'peer-feedback');
      reviewService.navigateToFeedbackSurvey(assignmentId);
    } 
  }
}

window.customElements.define('e-review', Review);
