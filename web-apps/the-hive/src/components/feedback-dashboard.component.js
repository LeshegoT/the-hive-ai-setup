import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import './feedback-messages.component';
import reviewService from '../services/review.service';
import './loader.component';
import './feedback-assignment-card.component';
import { reviewShared } from '../styles';

const styles = html`
  <style>
  ${reviewShared()} 
    :host {
      display: flex;
      flex-direction: row;
      justify-content: center;
      font-family: 'Inter';
    }

    #homeContainer {
      display: grid;
      grid-column-start: 1;
      grid-column-end: 2;
      gap: 2em;
      background: #ffffff;
      box-shadow: 0px 4px 20px rgb(0 0 0 / 25%);
      padding: 2em;
      min-width: 70vw;
    }

    #announcementContainer {
      border-bottom: 1.0105px solid #bbbbbb;
    }

    #welcomeBanner {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding-bottom: 2em;
      gap: 1em;
      width: 100%;
      height: fit-content;
      top: 7em;
    }

    .header {
      color: var(--app-review-header-text-color);
    }

    .subtitle {
      color: #979797;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2em;
      width: 70vw;
      margin-bottom: 3em;
      margin-top: 1em;
    }

    #noRequests {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 20em;
      text-align: center;
    }

    #noRequestHeading {
      margin: auto;
    }

    #noRequestInfo {
      margin: auto;
      color: var(--app-review-header-text-color);
    }

    .reviewTypeSectionHeading {
      margin-top: 1.5em;
    }

    @media only screen and (max-width: 1300px) {
      .cards {
        width: 100%;
      }
    }

    @media only screen and (max-width: 1000px) {
      .cards {
        grid-template-columns: repeat(1, 1fr);
      }
    }

    @media only screen and (max-width: 500px) {
      #welcomeBanner {
        padding: 0.5em;
        gap: 0;
      }

      #homeContainer {
        padding: 0.5em;
      }
    }
  </style>
`;

class FeedbackDashboard extends StatefulElement {
  constructor() {
    super();
    this.outstandingUserReviews = undefined;
  }

  render() {
    return html`
      ${styles}
      <section id="homeContainer">
        <section id="announcementContainer">${this.renderAnnouncement()}</section>
        ${ this.outstandingUserReviews ? html`<section id="assignmentContainer">${this.renderFeedbackAssignments()}</section>` : html`<e-loader></e-loader>`}
      </section>
    `;
  }


  renderAnnouncement(){
    return html`
      <div id="welcomeBanner">
        <label class="header xlarge-heading">The Hive Review Portal</label>
        <label class="subtitle small-subtext-label">Use this online portal to provide valuable feedback to your coworkers.</label>
      </div>
    `;
  }

  renderFeedbackAssignments() {
    if (this.outstandingUserReviews?.length > 0) {
      return html`
        ${this.outstandingUserReviews.map((reviewType) => {
          return this.renderReviewTypeAssignmentSection(reviewType);
        })}
      `;
    } else {
      return html`
        <section id="noRequests">
          <label id="noRequestHeading" class="xlarge-heading">Good job!</p>
          <label id="noRequestInfo" class="xx-large-subtext-label">Your reviews are up to date.</label>
        </section>
      `;
    }
  }

  renderReviewTypeAssignmentSection(reviewType) {
    return Object.keys(reviewType).map((key) => {
      return html`
        <section>
          <label class="reviewTypeSectionHeading large-heading">${key} Reviews</label>
          <section class="cards">
            ${reviewType[key].map((assignment) => {
              return this.renderCard(assignment)
            })}
          </section>
        </section>
      `;
    });
  }

  renderCard(assignment){
    return html`
      <e-feedback-assignment-card class="card" .feedbackAssignment=${assignment}></e-feedback-assignment-card>
    `;
  }

 

  static get properties() {
    return {
      outstandingUserReviews: Array,
    };
  }


  async firstUpdated() {
    this.outstandingUserReviews = await reviewService.upnOutstandingReviews();
  }
}

window.customElements.define('e-feedback-dashboard', FeedbackDashboard);