import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { globalLocation, doubleDownArrow, doubleUpArrow } from './svg';
import { reviewShared } from '../styles';
import './review-progress.component';
import './review-card-status.component';
import './profile-image.component';
import namesAndFacesService from '../services/names-and-faces.service';

const styles = html`
  <style>
    ${reviewShared()} .card {
      font-family: 'Inter';
      font-size: 0.8em;
      display: flex;
      flex-direction: column;
      padding-bottom: 1em;
      min-height: 22.5em;
      box-sizing: border-box;
      background: var(--app-dashboard-panel);
      box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.25);
      border-radius: 4px;
      transition: min-height 0.3s ease;
    }

    .userOffice {
      background-color: var(--app-warning-background-color-secondary);
      width: 8em;
      display: flex;
      align-items: center;
      justify-content: space-evenly;
      height: 4em;
      border-radius: 0px 4px 0px 10px;
    }

    #title {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }

    #userDetails {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      margin-left: 1.5em;
      margin-right: 1em;
      grid-row-gap: 0.3em;
    }

    #userDetails > * {
      padding: 0em;
    }

    .icon {
      width: 20px;
      hight: 20px;
    }

    #footer {
      display: flex;
      flex-direction: row;
      margin-left: 1em;
      gap: 0.8em;
    }

    #profileContainer {
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin-right: 1em;
    }

    #titleContainer {
      display: flex;
      flex-direction: row;
      margin-top: 0.5em;
    }

    #titleContainer > p {
      display: flex;
      flex-direction: column;
    }

    #userRoleContainer {
      color: var(--app-review-header-text-color);
      font-weight: 300;
      font-size: clamp(0.75rem, 0.550531914893617rem + 0.6382978723404256vw, 0.8rem);
    }

    #userNameContainer {
      font-weight: 600;
      font-size: clamp(1rem, 0.7340425531914894rem + 0.851063829787234vw, 0.5rem);
    }

    .textBold {
      font-weight: bold;
    }

    .textBold > p {
      margin: 0em;
    }

    #toggleCardButton,
    #userUnit,
    #office {
      font-weight: bold;
      display: none;
    }

    @media only screen and (max-width: 1300px) {
      #titleContainer {
        display: flex;
        flex-direction: column;
        margin-top: 0.5em;
      }

      #titleContainer > p {
        margin-left: 1.5em;
      }
    }

    @media only screen and (max-width: 1300px) {
      .card {
        min-height: 28.5em;
      }
    }

    @media only screen and (max-width: 1100px) {
      .card {
        overflow: hidden;
      }
    }

    @media only screen and (max-width: 1000px) {
      #titleContainer {
        flex-direction: column;
      }

      #titleContainer > p {
        margin-left: 1.5em;
      }
    }

    @media only screen and (max-width: 800px) {
      #title {
        display: flex;
        max-width: 100%;
        min-width: 50%;
      }

      #userDetails {
        margin: 0em 1em 0em 1em;
      }

      #titleContainer > p {
        margin-left: 0em;
      }

      #userRoleContainer {
        margin-left: 1.5em;
      }

      #userNameContainer {
        margin-left: 1em;
      }
    }

    @media only screen and (max-width: 650px) {
      #titleContainer {
        flex-direction: row;
        margin-top: 1em;
      }

      .card {
        min-height: 22em;
      }
    }

    @media only screen and (max-width: 490px) {
      #titleContainer {
        flex-direction: column;
      }

      #titleContainer.collapsed {
        flex-direction: row;
      }

      #titleContainer.collapsed > p {
        display: flex;
        justify-content: center;
      }

      #userUnit.collapsed {
        display: block;
        font-size: 1em;
        margin-left: 1.3em;
      }

      #office.collapsed {
        display: block;
        font-size: 1em;
        margin-left: 1.3em;
      }

      .card.collapsed {
        min-height: 10em;
      }

      #toggleCardButton {
        display: block;
        margin-bottom: -1em;
        font-size: 1em;
        background-color: #f7f7f7;
        border: none;
      }

      .userOffice.collapsed,
      #userDetails.collapsed,
      #footer.collapsed {
        display: none;
      }
    }
  </style>
`;
class NamesAndFacesCard extends StatefulElement {
  constructor() {
    super();
    this.isCardExpanded = false;
  }

  firstUpdated() {
    super.firstUpdated();
    this.toggleCardExpansion();
  }

  render() {
    return html`
      ${styles}
      <article id="card" class="card">
        <section id="title">${this.renderCardTitleInformation()}</section>
        <section id="userDetails">${this.renderUserDetail()}</section>
        <section id="footer">${this.renderCardFooter()}</section>
        <button id="toggleCardButton" @click=${(e) => this.toggleCardExpansion()}>
          ${this.isCardExpanded ? doubleDownArrow : doubleUpArrow}
        </button>
      </article>
    `;
  }

  renderCardTitleInformation() {
    return html`
      <div id="titleContainer">
        <div id="profileContainer"><e-profile-image upn=${this.userDetail.userPrincipleName} /></div>
        <p>
          <label id="userRoleContainer">${this.userDetail.jobTitle}</label>
          <label id="userNameContainer">${this.userDetail.displayName}</label>
          <label id="userUnit">${this.userDetail.unit}</label>
          <label id="office">${this.userDetail.office}</label>
        </p>
      </div>
      <div class="userOffice">${globalLocation} ${this.userDetail.office}</div>
    `;
  }

  toggleCardExpansion() {
    this.isCardExpanded = !this.isCardExpanded;

    let card = this.shadowRoot.querySelector('#card');
    let userOffice = this.shadowRoot.querySelector('.userOffice');
    let userDetails = this.shadowRoot.querySelector('#userDetails');
    let userUnit = this.shadowRoot.querySelector('#userUnit');
    let office = this.shadowRoot.querySelector('#office');
    let footer = this.shadowRoot.querySelector('#footer');
    let titleContainer = this.shadowRoot.querySelector('#titleContainer');

    titleContainer.classList.toggle('collapsed');
    card.classList.toggle('collapsed');
    userOffice.classList.toggle('collapsed');
    userDetails.classList.toggle('collapsed');
    footer.classList.toggle('collapsed');
    userUnit.classList.toggle('collapsed');
    office.classList.toggle('collapsed');
  }

  renderUserDetail() {
    this.loadMobilePhone();
    return html`
      <span>Unit:</span>
      <span class="textBold">
        <p>${this.userDetail.unit}</p>
        <p id="unitDescription">
          ${this.userDetail.unitDescription ? '(' + this.userDetail.unitDescription + ')' : ''}
        </p>
      </span>
      <span>Email:</span>
      <span class="textBold">${this.userDetail.userPrincipleName}</span>
      <span>Mobile:</span>
      <span class="textBold">${this.mobilePhone}</span>
    `;
  }

  renderCardFooter() {
    let hasEmploymentDate = this.userDetail.employmentDate;
    let employmentDateText = hasEmploymentDate
      ? `Joined ${this.formatEmploymentDate(this.userDetail.employmentDate)}`
      : '';

    return html`
      ${hasEmploymentDate
        ? html`
            <img src="images/icons/red-calendar.svg" class="icon" />
          `
        : ''}
      <p>${employmentDateText}</p>
    `;
  }

  formatEmploymentDate(isoDate) {
    let date = new Date(isoDate);
    let options = { day: 'numeric', month: 'long', year: 'numeric' };
    let userLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    return date.toLocaleDateString(userLocale, options);
  }

  loadMobilePhone() {
    namesAndFacesService
      .getUserMobilePhone(this.userDetail.userPrincipleName)
      .then((mobilePhone) => (this.mobilePhone = mobilePhone));
  }

  static get properties() {
    return {
      userDetail: Object,
      mobilePhone: Number,
      isCardExpanded: Boolean,
    };
  }
}

window.customElements.define('e-names-and-faces-card', NamesAndFacesCard);