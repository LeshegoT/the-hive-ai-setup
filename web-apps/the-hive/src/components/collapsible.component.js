import {LitElement, html} from 'lit';
import '../components/info-icon.component';
import { shared } from '../styles';
const styles = html`
  <style>
    ${shared()} 
    :host{
      --heading-gap:0.3em
    }
    .content-heading {
      display: flex;
      justify-content: space-between;
      cursor: pointer;
      border-bottom: var(--small-border-size) solid var(--neutral-grey-medium-color);
      margin-block: var(--standard-margin);
    }
    .content {
      display: none;
    }
    .active-content {
      display: block;
    }
    .rotate {
      transform: rotate(180deg);
    }
    h2 {
      margin: 0;
    }
    .heading-name {
      gap:var(--heading-gap);
    }
  </style>
`;
class Collapsible extends LitElement {
  static get properties() {
    return {
      collapsibleHeading: { type: String },
      collapsibleActive: { type: Boolean },
      collapsibleContentsInfo: { type: String },
    };
  }

  constructor() {
    super();
    this.collapsibleHeading = '';
    this.collapsibleActive = false;
    this.collapsibleContentsInfo = '';
  }

  toggleCollapse() {
    this.collapsibleActive = !this.collapsibleActive;
  }

  render() {
    return html`
      ${styles}
      <div class="content-heading" @click="${this.toggleCollapse}">
        <div class="inline-flex-items heading-name" >
          <h2 class="bold-h2">${this.collapsibleHeading}</h2>
          ${this.collapsibleContentsInfo
            ? html`
                <e-info infoTitle=${this.collapsibleHeading} infoMessage="${this.collapsibleContentsInfo}"></e-info>
              `
            : ''}
        </div>
        <img class="icon ${this.collapsibleActive ? 'rotate' : ''}" src="../../images/icons/arrow-dropdown.svg" />
      </div>

      <div class="content ${this.collapsibleActive ? 'active-content' : ''}">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('e-collapsible', Collapsible);
