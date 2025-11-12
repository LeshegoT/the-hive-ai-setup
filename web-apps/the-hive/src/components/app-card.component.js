import {LitElement, html} from 'lit';
import { shared } from '../styles';

function camelToPascal(input) {
  return input.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) {
    return str.toUpperCase();
  });
}

const styles = html`
  <style>
    ${shared()} :host {
      --max-height: 12.5rem;
    }
    .card {
      display: flex;
      flex-direction: column;
      background: var(--app-light-text-color);
      box-shadow: var(--shadow);
      border-radius: var(--small-radius);
      padding: 0px var(--standard-padding);
      height: 100%;
      gap: var(--small-gap);
    }
    .contents {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .contents p {
      font-size: var(--font-size-small);
      font-weight: var(--regular-font-weight);
      margin: 0; 
    }

    .contents label {
      display: inline;
      font-size: var(--font-size-tiny);
      font-weight: var(--regular-font-weight);
      color: var(--neutral-grey-color);
      margin: 0; 
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-block-start: var(--medium-gap);
    }
    ::slotted(div) {
      display: inline-flex;
      gap: var(--medium-gap);
      align-items: center;
      justify-content: space-between;
    }
    h3 {
      font-weight: var(--semi-bold-font-weight);
      font-size: var(--font-size-medium-small);
      margin: 0;
      padding-block: var(--medium-gap);
      border-bottom: var(--small-border-size) solid var(--neutral-grey-medium-color);
      margin-block: var(--standard-padding);
    }
    .bold{
      font-size:var(--font-size-small);
      font-weight:var(--semi-bold-font-weight)
    }
    
  </style>
`;

class AppCard extends LitElement {
  static get properties() {
    return {
      cardTitle: { type: String },
      contents: { type: Array },
    };
  }

  render() {
    return html`
      ${styles}
      <div class="card">
        <h3>${this.cardTitle}</h3>
        <div class="contents">
          ${Array.isArray(this.contents)
            ? this.contents.map(
                (content) => html`
                  <p>${content}</p>
                `
              )
            : Object.entries(this.contents).filter(([key, _value]) => key !== 'proof') //TODO remove this, files need a way to be viewed by users
            .map(
                ([key, value]) => html`
                  <p><label>${camelToPascal(key)}:</label>
                  <span class="bold">${value}</span></p>
                `
              )}
        </div>
        <div class="card-footer">
          <slot name="footer-left"></slot>
          <slot name="footer-right"></slot>
        </div>
      </div>
    `;
  }
}

customElements.define('e-card-component', AppCard);
