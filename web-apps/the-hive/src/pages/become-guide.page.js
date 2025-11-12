import { html } from 'lit';
import { shared, animations } from '../styles';
import authService from '../services/auth.service';
import newGuideService from '../services/new-guide.service';
import { StatefulPage } from './stateful-page-view-element';
import { selectSpecialisations } from '../selectors/reference-data.selectors';
import announcementService from '../services/announcement.service';
import { selectGuideApplications } from '../selectors/new-guide.selector';

let styles = html`
  <style>
    ${shared()} ${animations()} h1,
    h3 {
      font-weight: lighter;
    }

    h4 {
      text-align: center;
    }

    em {
      color: var(--app-primary-color);
      font-style: normal;
    }

    p {
      margin-bottom: 3em;
    }

    form {
      width: 80%;
      max-width: 800px;
      margin: auto;
      padding: 0 20px 0 20px;
      border: solid 5px #fefefe;
      border-radius: 20px;
      box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    .current-application {
      width: 80%;
      max-width: 800px;
      margin: auto;
      padding: 0 20px 20px 20px;
      border: solid 5px #fefefe;
      border-radius: 20px;
      margin-bottom: 30px;
      box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    form input,
    form select,
    form button,
    form textarea {
      display: block;
      margin-bottom: 1em;
      padding: 6px;
      width: 100%;
      border-radius: 10px;
    }

    form select {
      margin-bottom: 0px;
    }

    form button {
      width: 40%;
      max-width: 10em;
      display: inline;
    }

    #app-error {
      font-size: 14px;
      color: orange;
      margin: 5px 10px;
      display: inline;
    }

    form input,
    form textarea {
      width: 100%;
      box-sizing: border-box;
    }

    .row {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      flex-direction: row;
      margin-top: 1em;
    }

    .row .item {
      flex: 25%;
    }

    .row.header {
      font-weight: bold;
    }

    button.danger {
      background: white;
      color: red;
      border: 1px solid red;
      box-shadow: none;
      transition: 0.3s;
    }

    button.danger:hover {
      background: red;
      color: white;
      box-shadow: none;
      text-shadow: none;
    }

    .current-application {
      overflow-x: auto;
    }

    .cancelled {
      color: gray;
    }

    .cancelled .item:nth-child(-n+3) {
      text-decoration: line-through;
    }

    .cancelled .item:nth-child(3):before {
      content: url('../../images/icons/cancelled.svg');
      position: absolute;
    }

    .cancelled .item:nth-child(3) span:before {
      content: url(' ');
      padding: 1em;
    }

    .accepted .item:nth-child(3) {
      color: green;
    }

    .accepted .item:nth-child(3):before {
      content: url('../../images/icons/accepted.svg');
      position: absolute;
    }

    .accepted .item:nth-child(3) span:before {
      content: url(' ');
      padding: 1em;
    }

    .rejected .item:nth-child(3) {
      color: red;
    }

    .rejected .item:nth-child(3):before {
      content: url('../../images/icons/rejected.svg');
      position: absolute;
    }

    .rejected .item:nth-child(3) span:before {
      content: url(' ');
      padding: 1em;
    }

    .pending .item:nth-child(3) {
      color: orange;
    }

    .pending .item:nth-child(3):before {
      content: url('../../images/icons/pending.svg');
      position: absolute;
    }

    .pending .item:nth-child(3) span:before {
      content: url(' ');
      padding: 1em;
    }

    a {
      display: block;
      color: var(--app-tertiary-color);
      font-style: italic;
      font-size: 14px;
      margin-top: 0px;
      margin-bottom: 1em;
    }

    .strike {
      text-decoration: line-through;
    }

    @media (max-width: 680px) {
      form button {
        max-width: none;
        width: 100%;
        display: block;
      }

      #app-error {
        display: block;
      }

      .row .item:nth-child(1) {
        font-weight: bold;
      }

      .row .item {
        flex: 50%;
      }

      .row {
        border-bottom: 0.5px solid rgba(200, 200, 200, 0.5);
        padding-bottom: 1em;
      }

      .row.header {
        display: none;
      }

      .row .item span {
        display: none;
      }
    }
  </style>
`;

class BecomeGuide extends StatefulPage {
  constructor() {
    super();
    newGuideService.guideRequest(authService.getUserPrincipleName());
  }

  cancel(id) {
    newGuideService.cancelApplication(id);
  }

  submitApplication(e) {
    e.preventDefault();
    const form = e.target;
    let upn = authService.getUserPrincipleName();
    let bio = form.Bio.value;
    let specialisation = form.specialisation.value;
    if (this.hasPending) {
      announcementService.createAnnouncement('none', {
        title: '  ',
        body: `You already have a pending application. Please wait for it to be approved or rejected, or cancel your existing application.`,
      });
    } else if (specialisation == 'default') {
      announcementService.createAnnouncement('none', {
        title: 'Application incomplete',
        body: `Please select a specialisation from the drop-down.`,
      });
    } else {
      this.errorMessage = '';
      form.reset();
      newGuideService.addApplication(upn, bio, specialisation);
    }
  }

  checkForApplication(specialisation) {
    if (specialisation == 'Other') {
      return true;
    }
    let check = this.applications.filter(
      (app) =>
        (app.requestStatusType == 'ACCEPTED' || app.requestStatusType == 'PENDING') &&
        app.specialisation == specialisation
    );
    return check.length == 0;
  }

  getCurrentApplications(){
    if(this.applications.length > 0){
      return html`
        <div class="row header">
          <div class="item">Specialisation</div>
          <div class="item">Date Submitted</div>
          <div class="item">Status</div>
          <div class="item">&nbsp;</div>
        </div>
        ${this.applications.map((app, i) => {
          return html`
            <div class="row ${app.requestStatusType.toLowerCase()}">
              <div class="item">${app.specialisation}</div>
              <div class="item">${this.toStringDate(app.dateRequested)}</div>
              <div class="item">
                <span class="${app.requestStatusType.toLowerCase()}">${app.requestStatusType}</span>
              </div>
              ${app.requestStatusType == 'PENDING' || app.requestStatusType == 'ACCEPTED'
                ? html`
                    <div class="item">
                      <button class="danger" @click=${() => this.cancel(app.newGuideRequestsId)}>Cancel</button>
                    </div>
                  `
                : html`
                    <div class="item">&nbsp;</div>
                  `}
            </div>
          `;
        })}
      `;
    } else {
      return html`
        <div class="row header">
          <div class="item">You have no applications</div>
        </div>
      `;
    }
  }

  populateSpecialisations() {
    let { specialisations } = this;
    return specialisations.map((specialisation) =>
      this.checkForApplication(specialisation.name)
        ? html`
            <option value="${specialisation.specialisationId}">${specialisation.name}</option>
          `
        : html`
            <option value="${specialisation.specialisationId}" disabled>
              - ${specialisation.name} (already applied)
            </option>
          `
    );
  }

  render() {
    let { errorMessage, hasPending } = this;
    return html`
      ${styles}

      <section class="fade-in">
        <div>
          <h1>Become a Guide</h1>
          <p>
            If you think you have what it takes to help others in a specialisation, fill in the form below to request to
            become a guide.
          </p>
          <div class="current-application">
            <h3>Current Applications</h3>
            <hr />
            <div class="applications">
              ${this.getCurrentApplications()}
            </div>
          </div>
          <form @submit="${(e) => this.submitApplication(e)}">
            <h3>New Application</h3>
            <select name="specialisation">
              <option disabled selected value="default">Select Specialisation</option>
              <option disabled>----------------------------</option>
              ${this.populateSpecialisations()}
            </select>
            <textarea
              name="Bio"
              placeholder="Short Bio (max 200 characters)"
              rows="4"
              maxlength="200"
              required
            ></textarea>
            ${hasPending
              ? html`
                  <button type="submit" class="big" disabled>Submit Request</button>
                `
              : html`
                  <button type="submit" class="big">Submit Request</button>
                `}
            <span id="app-error">${errorMessage}</span>
          </form>
        </div>
      </section>
    `;
  }

  static get properties() {
    return {
      applications: Array,
      specialisations: Object,
      errorMessage: String,
      hasPending: Boolean,
    };
  }

  stateChanged(state) {
    this.applications = selectGuideApplications(state);
    this.specialisations = selectSpecialisations(state);
    this.hasPending = !this.applications.every((app) => app.requestStatusType != 'PENDING');
    if (this.hasPending) {
      this.errorMessage = 'You already have a pending application';
    } else {
      this.errorMessage = '';
    }
  }

  toStringDate(date) {
    let d = new Date(date);
    const options = { year: 'numeric', month: 'numeric', day: 'numeric' };

    return d.toLocaleDateString(undefined, options);
  }
}

window.customElements.define('e-become-guide', BecomeGuide);
