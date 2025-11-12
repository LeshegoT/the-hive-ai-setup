import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { reviewShared } from '../styles';

const styles = html`
  <style>
  ${reviewShared()}
    .completedSection {
      line-height: 24px;
      color: var(--app-warning-font-color);
      margin-right: 0.3em;
    }

  </style>
`;
class ReviewProgress extends StatefulElement {
  constructor() {
    super();
  }

  render() {
    const complete = this.questionCompletionScore();
    const total = this.feedbackStored.questionTotal;

    return html`
      ${styles}
      <div>
        <label class="medium-heading completedSection">${complete}/${total}</label>
        <label class="small-subtext-label"> questions have been completed in this review.</label>
      </div>
    `;
  }

  questionCompletionScore() {
    let score = this.feedbackStored.answers?.filter(
      (answer) =>
        (answer.generalComment == undefined || answer.generalComment != '') &&
        (answer.positiveComment == undefined || answer.positiveComment != '') &&
        (answer.constructiveComment == undefined || answer.constructiveComment != '') &&
        (answer.rating == undefined || (answer.rating.rating != 0 && answer.rating.rating != undefined))
    ).length;
    return score;
  }

  static get properties() {
    return {
      feedbackStored: Object
    };
  }
}

window.customElements.define('e-review-progress', ReviewProgress);
