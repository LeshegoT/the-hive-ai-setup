import { html } from 'lit';

import '../components/title.component';
import '../components/quest.component';
import '../components/loader.component';

import { shared, animations } from '../styles';
import { selectGuideRequests } from '../selectors/hero.selectors.js';
import { selectGuideDetails } from '../selectors/reference-data.selectors';
import { selectQuest } from '../selectors/quest.selectors';
import { getUserData } from '../services/user-data.service';
import { StatefulPage } from './stateful-page-view-element.js';
import guideService from '../services/guide.service';
import authService from '../services/auth.service';
import message_service from '../services/message.service';

let styles = html`
  <style>
    ${shared()}
    ${animations()}
    
    :host > div {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    h3 {
      padding-top: 1em;
    }

    .your-guide > * {
      align-self: center;
    }

    .cancel {
      margin-top: 1em;
      color: var(--app-primary-color);
    }

    table {
      border: 1px solid var(--app-tertiary-color);
      border-collapse: collapse;
      margin-bottom: 1.5em;
      width: 100%;
    }

    th, td {
      padding: 0.25em 0.75em;
      text-align: left;
    }

    tr:nth-child(even) {
      background-color: var(--app-section-even-color);
    }

    textarea {
      border: none;
      border-bottom: 1px solid var(--app-tertiary-color);
      font-size: 1em;
      color: var(--app-tertiary-color);
      width: 100%;
    }

    .error {
      color: var(--app-primary-color);
      font-size: 1em;
    }
  </style>
`;

class GuideRequest extends StatefulPage {
  getPendingRequests() {
    return this.guideRequests.filter(
      (request) =>
        request.heroUserPrincipleName.toLowerCase() == authService.getUserPrincipleName().toLowerCase() 
        && request.requestStatusType == 'PENDING'
    );
  }

  renderPendingRequest() {
    const pendingRequests = this.getPendingRequests();

    if (pendingRequests.length) {
      return html`
        <div class="your-guide">
          <h3>Pending Request</h3>
          <e-hero-title
            .hero="${pendingRequests[0].guideUserPrincipleName}"
            orientation="left"
            hideemail="true"
          ></e-hero-title>
          <button class="cancel" @click="${(e) => this.cancelRequest(pendingRequests[0].guideRequestId)}">Cancel</button>
        </div>
      `;
    }

    return html``;
  }

  cancelRequest(requestId) {
    guideService.cancelGuideRequest(requestId);
    getUserData();
  }

  renderRejectedRequests() {
    const rejectedRequests = this.guideRequests.filter(
      (request) =>
        request.heroUserPrincipleName.toLowerCase() == authService.getUserPrincipleName().toLowerCase() 
        && request.requestStatusType == 'REJECTED'
    );

    if (rejectedRequests.length) {
      return html`
        <div class="your-guide">
          <h3>Rejected Requests</h3>
          <table>
            <tr>
              <th>Guide</th>
              <th>Request Justification</th>
            </tr>
            ${rejectedRequests.map((request) => {
              return html`
              <tr>
                <td>
                  ${request.guideUserPrincipleName}
                </td>
                <td>
                  ${request.justification}</tr>
                </td>
              </tr>
            `;
            })}
          </table>
        </div>
      `;
    }

    return html``;
  }

  renderNewRequest() {
    return html`
      <h3>Request a Guide</h3>
      <form @submit="${(e) => this.createGuideRequest(e)}">
        <div>
          <table>
            <tr>
              <th>Guide</th>
              <th>Specialisations</th>
              <th>Request</th>
            </tr>
            ${this.guideDetails.map(
              (guide) => html`
                <tr>
                  <td>
                    <label>${guide.userPrincipleName}</label>
                  </td>
                  <td>
                    <label>${guide.specialisations}</label>
                  </td>
                  <td>
                    <input
                      type="radio"
                      name="guideRadio"
                      value="${guide.userPrincipleName}"
                    />
                  </td>
                </tr>
              `
            )}
          </table>
          
          <div>
            <label>Justification:</label>
          </div>
          <div>
            <textarea 
              id="justification"
              rows="4"
              cols="70"
              placeholder="No more than 1000 characters"
              maxlength="1000"
            ></textarea>
          </div>
          ${this.errors ? html`<p class="error">Please select a guide and enter a justification (1000 character limit)</p>` : html``}
          <button type="submit">Submit</button>
        </div>
      </form>
    `;
  }

  createGuideRequest(e) {
    e.preventDefault();
    const form = e.target;

    if (this.checkForErrors(form)) {
      this.errors = true;
      return;
    }

    this.errors = false;
    guideService.createGuideRequest(authService.getUserPrincipleName(), form.guideRadio.value, message_service.sanitizeInput(form.justification.value));
    form.reset();
    getUserData();
  }

  checkForErrors(form) {
    if (!form.guideRadio.value || !form.justification.value || form.justification.value.length > 1000)
      return true;

    return false;
  }

  renderCurrentGuide() {
    if (this.currentGuide) {
      return html`
        <div class="your-guide">
          <h3>Your Guide</h3>
          <e-hero-title
            .hero="${this.currentGuide}"
            orientation="left"
            hideemail="true"
          ></e-hero-title>
        </div>
      `;
    }
  }

  render() {
    return html`
      ${styles}

      <section class="fade-in">
        <e-title name="Guide Requests" icon="images/logos/wizard.svg"></e-title>
        ${
          this.guideDetails === undefined? html`<e-loader></e-loader>`: html`
            ${this.renderCurrentGuide()}
            ${!this.currentGuide ? this.renderPendingRequest() : html``}
            ${(!this.currentGuide && !this.getPendingRequests().length) ? this.renderNewRequest() : html``}
            ${!this.currentGuide ? this.renderRejectedRequests() : html``}
          `
        }
      </section>
    `;
  }

  static get properties() {
    return {
      guideRequests: { type: Array },
      guideDetails: { type: Array },
      currentGuide: { type: String },
      errors: { type: Boolean }
    };
  }

  firstUpdated() {
    this.errors = false;
  }

  stateChanged(state) {
    this.guideRequests = selectGuideRequests(state);
    this.guideDetails = selectGuideDetails(state);
    this.currentGuide = selectQuest(state).guideUserPrincipleName;
  }
}

window.customElements.define('e-guide-request', GuideRequest);
