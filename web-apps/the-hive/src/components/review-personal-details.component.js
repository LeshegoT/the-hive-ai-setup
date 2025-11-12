import { html } from 'lit';
import reviewService from "../services/review.service";
import userService from "../services/user.service";
import { reviewShared } from "../styles";
import { StatefulElement } from "./stateful-element";
import { profile_placeholder } from "./svg";

const cardBackground = `#f4f4f4`;
const borderColor = `#bbbbbb`;

const styles = html`
  <style>
    ${reviewShared()}:host {
      width: 100%;
      font-family: "Inter";
    }

    #failedToLoadCard {
      text-align: center;
      gap: 2em;
      padding: 3em;
    }

    .card {
      background: ${cardBackground};
      height: fit-content;
      display: flex;
      flex-direction: column;
      box-shadow: 1px 3px 6px rgba(0, 0, 0, 0.2);
      border-radius: 15px;
      padding: 1.5em;
    }

    #upnTitleInforation {
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
    }

    #upnPersonalInformation {
      display: flex;
      flex-direction: row;
      justify-content: space-evenly;
      word-break: break-word;
    }

    #profileContainer {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .column {
      padding: 1em 1em 0 1em;
      margin-top: 2em;
      width: 100%;
    }

    #column1 {
      border-right: 0.1em solid ${borderColor};
      text-align: center;
    }

    #column2 {
      border-right: 0.1em solid ${borderColor};
      padding-left: 2em;
    }

    #column3 {
      padding-left: 2em;
    }

    .qualification {
      font-size: small;
    }

    .personalDetail {
      margin-bottom: 2em;
    }

    p {
      margin: 0.1em;
    }

    .personName {
      display: block;
    }

    .personRole {
      display: block;
    }

    .profile {
      height: 3.5em;
      border-radius: 100%;
      max-width: 3.5em;
      background-size: cover;
      aspect-ratio: 1/1;
      margin-right: 1em;
    }

    .errorMessage {
      color: var(--app-warning-font-color);
      display: block;
    }

    .errorMessage a {
      color: var(--app-warning-font-color);
      font-weight: 500;
      font-size: small;
    }

    #issueHeading {
      color: var(--app-warning-font-color);
    }

    @media only screen and (max-width: 800px) {
      .card {
        flex-direction: column;
        height: fit-content;
      }

      .column {
        height: fit-content;
        margin-top: 0;
        width: 80%;
        margin: auto;
      }

      #column1 {
        border-top: 0.1em solid #bbbbbb;
        border-right: none;
        padding-top: 3em;
      }

      #column2 {
        border-top: 0.1em solid #bbbbbb;
        border-right: none;
      }

      #column3 {
        border-top: 0.1em solid #bbbbbb;
      }

      #upnPersonalInformation {
        flex-direction: column;
        margin-top: 1em;
      }
    }

    @media only screen and (max-width: 900px) {
      .personName,
      .personRole {
        text-align: center;
      }
    }

    @media only screen and (max-width: 400px) {
      .card {
        padding: 0.8em;
      }

      #upnTitleInforation {
        flex-direction: column;
      }

      .profile {
        margin: auto;
      }

      #column1,
      #column2,
      #column3 {
        padding-left: 0;
        margin: 0;
      }

      #failedToLoadCard {
        text-align: center;
        gap: 0.5em;
        padding: 1em;
      }
    }
  </style>
`;

class ReviewPersonalDetails extends StatefulElement {
  constructor() {
    super();
  }

  render() {
    if (this.userDetails) {
      return html`
        ${styles}
        <article class="card">
          <section id="upnTitleInforation">${this.renderProfileRow()}</section>
          <section id="upnPersonalInformation">
            ${this.renderFirstColumn()} ${this.renderSecondColumn()}${this.renderThirdColumn()}
          </section>
        </article>
      `;
    } else if (this.loading) {
      return html`<e-loader></e-loader>`;
    } else {
      return html`
        ${styles}
        <article
          class="card"
          id="failedToLoadCard"
        >
          <label
            id="issueHeading"
            class="xlarge-heading"
            >We have encountered an issue!</label
          >
          <label
            id="issueInformationSubTitle"
            class="large-heading"
            >Unfortunately your Personal Details could not be loaded.</label
          >
          <label
            id="issueInformationSubSubTitle"
            class="small-subtext-label"
            >You can try refreshing the page or come back later.</label
          >
        </article>
      `;
    }
  }

  renderProfileRow() {
    return html`
      <div id="profileContainer">${this.renderImage()}</div>
      <div>
        <label class="personName large-heading">${this.checkDetail(this.userDetails?.displayName)}</label>
        <label class="personRole small-subtext-label">${this.checkDetail(this.userDetails?.jobTitle)}</label>
      </div>
    `;
  }

  renderFirstColumn() {
    return html`
      <section
        class="column"
        id="column2"
      >
        <section class="personalDetail medium-heading">
          <label class="small-subtext-label">Email</label>
          <p>${this.checkDetail(this.userDetails?.upn)}</p>
        </section>
        <section class="personalDetail medium-heading">
          <label class="small-subtext-label">BBD Staff Number</label>
          <p>${this.checkDetail(this.userDetails?.userName.replace("bbdnet", ""))}</p>
        </section>
        <section class="personalDetail medium-heading">
          <label class="small-subtext-label">BBD Start Date</label>
          ${this.renderDate()}
        </section>
      </section>
    `;
  }

  renderImage() {
    if (this.image) {
      let background_image = `background-image: url(${this.image})`;
      return html`
        <div
          class="profile"
          .style="${background_image}"
        ></div>
      `;
    } else {
      return html` <div class="profile">${profile_placeholder}</div> `;
    }
  }

  renderSecondColumn() {
    return html`
      <section
        class="column"
        id="column2"
      >
        <section class="personalDetail medium-heading">
          <label class="small-subtext-label">Current Home Unit</label>
          <p>${this.checkDetail(this.userDetails?.department)}</p>
        </section>
        <section class="personalDetail medium-heading">
          <label class="small-subtext-label">Team Lead</label>
          <p>${this.checkDetail(this.userDetails?.managerName)}</p>
        </section>
        <section class="personalDetail medium-heading">
          <label class="small-subtext-label">Company entity</label>
          <p>${this.checkDetail(this.userDetails.entity)}</p>
        </section>
      </section>
    `;
  }

  renderThirdColumn() {
    return html`
      <section
        class="column"
        id="column3"
      >
        <section class="personalDetail medium-heading">
          <label class="small-subtext-label">Latest Qualifications</label>
          ${this.renderQualification()}
        </section>
      </section>
    `;
  }

  renderQualification() {
    const errorMessage = html`
      <label class="errorMessage xx-small-subtext-label">
        <a href="skills"
          >Please update your portfolio (qualifications, certifications, skills, industry knowledge and qualities).</a
        >
        If you are unable to do so, email your HR representative for assistance.
      </label>
    `;
    if (this.userQualifications?.length > 0) {
      return html`
        <ul>
          ${this.userQualifications?.map((qualification) => {
            return html`<li class="qualification">${qualification.name} (${qualification.year})</li>`;
          })}
        </ul>
        ${errorMessage}
      `;
    } else {
      return errorMessage;
    }
  }

  renderDate() {
    if (this.userDetails?.startDate) {
      let employmentDate = new Date(this.userDetails.startDate);
      return html`
        <p>${employmentDate.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}</p>
      `;
    } else {
      return this.checkDetail(this.userDetails?.startDate);
    }
  }

  loadImage() {
    if (this.userDetails?.upn) {
      userService.getImage(this.userDetails.upn).then((image) => (this.image = image));
    } else {
      this.image = undefined;
    }
  }

  checkDetail(detail) {
    if (detail) return detail;
    else {
      return html`
        <label class="errorMessage xx-small-subtext-label">
          This field is empty, please contact your HR representative to fill in this field.
        </label>
      `;
    }
  }

  static get properties() {
    return {
      userDetails: Object,
      image: Object,
      userQualifications: Array,
      amountOfQualifications: Number,
    };
  }

  async firstUpdated() {
    try {
      this.amountOfQualifications = 3;
      this.userDetails = await reviewService.getUserDetails();
      this.userQualifications = await reviewService.getUserQualifications(this.amountOfQualifications);
      this.loadImage();
    } catch (error) {
      this.error = error;
    }
  }

  get loading() {
    return !(this.userDetails || this.error);
  }
}
window.customElements.define('e-review-personal-details', ReviewPersonalDetails);
