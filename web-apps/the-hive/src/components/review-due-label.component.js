import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { reviewShared } from '../styles';

const styles = html`
  <style>
  ${reviewShared()}
    .headerInfo {
      color: var(--app-review-sub-header-text-color);
    }

    #dueDateBold {
      color: var(--app-warning-font-color);
      font-weight: bold;
    }

    .icon {
      margin: -0.5em 0.5em -0.5em 0;
    }

  </style>
`;
class ReviewDueLabel extends StatefulElement {
  constructor() {
    super();
  }

  render() {
    return html`
      ${styles}
      <label class="xx-small-subtext-label headerInfo">
        <img src="images/icons/red-calendar.svg" class="icon" />
        You have until
        <label id="dueDateBold">${this.dueDate.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day:'numeric' })}</label>
        to complete this
      </label>
    `;
  }

  static get properties() {
    return {
      dueDate: Date,
    };
  }

}

window.customElements.define('e-review-due-label', ReviewDueLabel);
