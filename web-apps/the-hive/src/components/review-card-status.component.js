import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { reviewShared } from '../styles';
import {reviewExclamation} from './svg'

const styles = html`
  <style>
    ${reviewShared()} .assignmentStatus {
      width: 8.6em;
      height: 3em;
      padding: 0.625em 1em;
      display: flex;
      flex-direction: column;
      justify-content: center;
      border-radius: 0px 4px 0px 10px;
    }

    .overdueAssignmentStatus {
      background-color: var(--app-warning-background-color-secondary);
      color: var(--app-warning-font-color-secondary);
    }

    .assignmentStatus svg {
      margin: -0.5em 0.5em;
    }

    .upcomingAssignmentStatus svg path {
      fill: var(--app-success-font-color);
    }

    .overdueAssignmentStatus svg path {
      fill: var(--app-warning-font-color-secondary);
    }

    .upcomingAssignmentStatus {
      background-color: var(--app-success-background-color);
      color: var(--app-success-font-color);
    }

    @media only screen and (max-width: 700px) {
      .assignmentStatus {
        margin-left: auto;
      }
    }
  </style>
`;
class ReviewCardStatus extends StatefulElement {
  constructor() {
    super();
  }

  render() {
    if (this.overDue) {
      return html`
        ${styles}
        <div class="x-small-heading assignmentStatus overdueAssignmentStatus">
          <label>
            ${reviewExclamation}
            Overdue
          </label>
        </div>
      `;
    } else {
      return html`
        ${styles}
        <div class="x-small-heading assignmentStatus upcomingAssignmentStatus">
          <label>
            ${reviewExclamation}
            Due
          </label>
        </div>
      `;
    }
  }

  static get properties() {
    return {
      overDue : Boolean
    };
  }
}

window.customElements.define('e-review-card-status', ReviewCardStatus);
