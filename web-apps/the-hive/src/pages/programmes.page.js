import {LitElement, html} from 'lit';
import {repeat} from 'lit/directives/repeat.js';
import { shared, reviewShared } from '../styles';
import programmeService from '../services/programme.service';
import { formatFullLongDate } from '../services/format.service.js';
import authService from '../services/auth.service.js';

import '../components/title.component';

let styles = html`
  <style>
    ${shared()} ${reviewShared()} .programmes-list-wraper {
      background: var(--app-header-background-color);
      box-shadow: var(--app-form-box-shadow);
      border-radius: var(--app-small-border-radius);
    }

    .programmes-list-wraper {
      margin-top: 0;
      display: flex;
      flex-direction: column;
      gap: var(--large-gap);
    }

    .programme {
      display: flex;
      border: var(--light-grey-border);
      margin: 0;
      flex-wrap: wrap;
      padding: var(--large-padding);
    }

    .programme-item {
      margin: 0;
    }

    .redButton {
      width: fit-content;
      background-color: var(--app-tertiary-color);
      font-weight: normal;
      margin-right: 0
    }

   .programme section {
    padding: 0;
    margin: 0 auto 0 0;
    background-color: inherit;
    display: flex;
    flex-wrap: wrap;
   }

  .registered {
    margin: 0;
    padding: 0;
  }
  </style>
`;

class Programmes extends LitElement {
  static properties = {
    programmes: { type: Array },
  };

  constructor() {
    super();
    this.programmes = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadProgrammes();
  }

  async loadProgrammes() {
    this.programmes = await programmeService.getAllProgrammes();
  }

  async addProgrammeUser(programme) {
    const upn = authService.getUserPrincipleName();
    const user = { upn, dateAdded: new Date(), programmeID: programme.programmeID };
    programme.users.push(user);
    await programmeService.addProgrammeUser({programmeId: programme.programmeID, ...programme});
    this.loadProgrammes()
  }

  render() {
    return html`
      ${styles}
      <section>
        <e-title name="Programmes" icon="images/logos/content.svg"></e-title>
        <section class="programmes-list-wraper">
          <h2>Programme list</h2>
          ${this.renderProgrammes()}
        </section>
      </section>
    `;
  }

  renderProgrammes() {
    return html`
      ${repeat(
        this.programmes,
        (programme) => programme.programmeId,
        (programme) => {
          const upn = authService.getUserPrincipleName();
          const onProgramme = programme.users.some(user => user.upn === upn);
        return html`
          <section class="programme">
            <section>
              <p class="programme-item">Programme Name: ${programme.name}</p>
              <p class="programme-item">
                Period: ${programme.period > 1 ? programme.period + ' years' : programme.period + ' year'}
              </p>
              <p class="programme-item">Start Date: ${formatFullLongDate(new Date(programme.startDate))}</p>
            </section>
            ${onProgramme
              ? html`
                  <p class="registered">Registered</p>
                `
              : html`
                  <button class="redButton" @click="${() => this.addProgrammeUser(programme)}">Join programme</button>
                `}
          </section>
        `;
        }
      )}
    `;
  }
}
window.customElements.define('e-programmes', Programmes);
