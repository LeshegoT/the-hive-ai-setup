import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import './feedback-messages.component';
import peerFeedbackService from '../services/peer-feedback.service';
import userService from '../services/user.service';
import { selectHero } from '../selectors/hero.selectors';
import {
  selectUserAssignedFeedbacks,
  selectUserTeamMembers,
  selectFeedbackMessages,
  selectFeedbackLoadingLock,
} from '../selectors/peer-feedback.selector';
import { PEER_FEEDBACK_POST_STATE, PEER_FEEDBACK_VIEW_STATE } from '../services/peer-feedback.service';
import {
  feedbackTemplateReceived,
  userToBeReviewedReceived,
  feedbackAssignmentIdReceived,
  feedbackLoadingLock,
} from '../actions/peer-feedback.action';
import { store } from '../store.js';
import './gear-list-item.component';
import './hex.component';
import './loader.component';

const styles = html`
  <style>
    #feedbackSection {
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
    }

    #feedbackSearchPanel {
      padding: 1em;
      word-wrap: break-word;
      margin-left: 3em;
      box-shadow: 2px 3px 4px var(--app-dashboard-shadow);
      background-color: white;
      border-bottom: 5px solid var(--app-dashboard-color);
      border-radius: 5px;
      height: fit-content;
      max-height: 670px;
      min-height: 670px;
    }

    #feedbackSearchPanel:hover {
      box-shadow: 1px 1px 4px var(--app-dashboard-shadow);
      border-bottom: 5px solid var(--app-primary-color);
    }

    #feedbackSearchPanel > div {
      width: 100%;
      min-width: fit-content;
      margin-bottom: 1.5em;
      max-height: 620px;
      overflow-x: hidden;
      overflow-y: auto;
      z-index: 1;
    }


    @supports (-moz-appearance: none) {
      #feedbackSearchPanel > div {
        scrollbar-color: var(--app-primary-color);
        scrollbar-width: thin;
      }
    }

    #feedbackAssignmentPanel,
    #teamMemberPanel,
    #searchResults {
      margin-left: -1em;
      padding-right: 1.5em;
    }

    #searchResults {
      display: none;
    }

    #feedbackSearchPanel > div::-webkit-scrollbar {
      width: 10px;
      background-color: rgba(159, 159, 159, 0.2);
      border-radius: 100px;
    }

    #feedbackSearchPanel > div::-webkit-scrollbar-thumb {
      background: var(--app-dashboard-shadow);
      border-radius: 100px;
    }

    #feedbackMessagePanel {
      flex-grow: 5;
      margin-left: 2vw;
      margin-right: 3em;
    }

    .pagetitle {
      width: 90%;
      margin: auto;
      margin-bottom: 2em;
      color: var(--app-tertiary-color);
      border-bottom: 2px solid var(--app-tertiary-color);
    }

    .gearList:nth-child(even) {
      margin: -1.3em 0em 0.5em 1.6em;
    }

    .gearList:nth-child(odd) {
      margin: -1.5em 0em 0em 0em;
    }

    .view-more {
      color: var(--app-tertiary-color);
      padding: 0.3em 1em;
      margin-top: 1em;
      width: 90%;
      text-align: center;
      display: block;
    }

    .view-more:hover {
      color: var(--app-primary-color);
      cursor: pointer;
    }

    .hideAssignmentListItem {
      display: none;
    }

    .hideMemberListItem {
      display: none;
    }

    #peerSearch {
      border-radius: 100px;
      padding: 0.5em 1em;
      width: 25em;
    }

    .no-feedback {
      display: flex;
      flex-direction: row;
      justify-content: space-evenly;
    }

    .mobileNavigationButton {
      background-color: var(--app-primary-color);
      border-radius: 100px 0 0 100px;
      width: 70px;
      height: 70px;
      color: white;
      border: none;
      position: fixed;
      margin-top: -5em;
      right: 50px;
      display: none;
    }

    .noListToDisplay {
      color: var(--app-lighter-text-color);
      display: flex;
      flex-direction: row;
      justify-content: space-evenly;
    }

    @media only screen and (max-width: 1000px) {
      #peerSearch {
        width: 35vw;
      }

      .pagetitle h2 {
        font-size: medium;
      }

      #feedbackSearchPanel {
        margin-left: 1em;
        width: 40vw;
      }
    }

    @media only screen and (max-width: 850px) {
      #feedbackMessagePanel {
        display: none;
      }

      .mobileNavigationButton {
        display: block;
      }

      #feedbackSearchPanel {
        width: 80vw;
      }

      #peerSearch {
        width: 70vw;
      }

      #feedbackSearchPanel > div {
        width: 100%;
      }

      .mobileNavigationButton {
        right: 0px;
      }

      #feedbackMessagePanel {
        margin: 0;
        width: 85vw;
      }
    }
  </style>
`;
class Feedback extends StatefulElement {
  constructor() {
    super();

    this.itemsShowedWithoutExpandingContainer = 3;
  }

  render() {
    return html`
      ${styles}
      <div id="mobileNavigation">
        <button class="mobileNavigationButton" @click="${this.showMessages}" id="showMessagesButton">
          <e-hex .icon="${'images/logos/messages.svg'}"></e-hex>
        </button>
        <button
          class="mobileNavigationButton"
          @click="${this.showSearch}"
          style="display:none;"
          id="showFeedbackButton"
        >
          <e-hex .icon="${'images/logos/community.svg'}"></e-hex>
        </button>
      </div>
      <section id="feedbackSection">
        <div id="feedbackSearchPanel">
          <div id="searchUserPanel">${this.renderEmails()}</div>
          <div id="feedbackAssignmentPanel">
            <span style="border-bottom: solid 1px black;">
              <h2 class="pagetitle">Requested Feedback</h2>
            </span>

            ${this.renderFeedbackAssignments()}
             ${(this.feedbacksAssignedToUser === undefined || this.feedbacksAssignedToUser.length) == 0 ? html `<label class='noListToDisplay'>No Requested Feedback</label>` : ``}
            ${this.feedbacksAssignedToUser.length > 3
              ? html`
                  <label class="view-more" @click=${this.showMoreAssignments} id="moreAssignmentsButton">
                    View More
                  </label>
                `
              : ``}

            <label
              class="view-more"
              @click=${this.showLessAssignments}
              id="lessAssignmentsButton"
              style="display:none;"
            >
              View Less
            </label>
          </div>
          <div id="teamMemberPanel">
            <h2 class="pagetitle">Team Members</h2>
            ${this.renderTeamMembers()}
            ${(this.userTeamMembers === undefined || this.userTeamMembers.length) == 0 ? html `<label class='noListToDisplay'>No Team Members</label>` : ``}
            ${this.userTeamMembers.length > 3
              ? html`
                  <label class="view-more" @click=${this.showMoreTeamMembers} id="moreMembersButton">View More</label>
                `
              : ``}
            <label class="view-more" @click=${this.showLessTeamMembers} id="lessMembersButton" style="display:none;">
              View Less
            </label>
          </div>
        </div>
        <div id="feedbackMessagePanel">
          <span style="border-bottom: solid 1px black;">
            <h1 class="pagetitle">What People Said About You</h1>
          </span>
          ${this.messages && !!this.messages.length
            ? html`
                <e-feedback-messages .messages=${this.messages}></e-feedback-messages>
              `
            : html`
              ${this.lock 
              ? html `<e-loader></e-loader>` 
              : html `
                <div class="no-feedback">
                  <h4>You do not have any feedback yet, be the first by reviewing yourself.</h4>
                </div>` 
              }
              `}
        </div>
      </section>
    `;
  }

  renderFeedbackAssignments() {
    return html`
      ${this.feedbacksAssignedToUser &&
      this.feedbacksAssignedToUser.map(
        (assignedFeedback, index) =>
          html`
            ${assignedFeedback.messageId === null
              ? html`
                  <e-gear-list-item
                    .item=${{
                      name:  assignedFeedback.reviewee === this.hero ? 'Self Feedback' : assignedFeedback.displayName ,
                      subName: this.displayFeedbackDueDate(assignedFeedback.feedbackDeadline).values[0],
                      icon: 'images/logos/review.svg',
                      displayNumber: index,
                    }}
                    class="${this.displayFeedbackDueDate(assignedFeedback.feedbackDeadline).values[0] == 'Overdue'
                      ? 'gearList overdueGearListItem'
                      : 'gearList'}
                            ${index < 3 ? ' showAssignmentListItem' : ' hideAssignmentListItem'}"
                    id="assignedFeedback"
                    @click="${(e) =>
                      this.leaveFeedback(
                        assignedFeedback.reviewee,
                        { id: assignedFeedback.templateId, name: assignedFeedback.templateName },
                        assignedFeedback.feedbackAssignmentId
                      )}"
                  ></e-gear-list-item>
                `
              : html``}
          `
      )}
    `;
  }

  renderTeamMembers() {
    return html`
      ${this.userTeamMembers &&
      this.userTeamMembers.map((teamMember, index) => {
        return html`
                   <e-gear-list-item
                        class="gearList ${index < 3 ? ' showMemberListItem' : ' hideMemberListItem'}"
                        .item=${{
                          name: teamMember.displayName,
                          icon: 'images/logos/community.svg',
                          displayNumber: index,
                        }}
                          ? 'gearList overdueGearListItem'
                          : 'gearList'}"
                        @click="${(e) => this.viewUser(teamMember.userPrincipleName)}"
                      ></e-gear-list-item>
                      `;
      })}
    `;
  }

  showMoreAssignments() {
    const teamMembersContainer = this.shadowRoot.getElementById('teamMemberPanel');
    teamMembersContainer.style.display = 'none';
    this.shadowRoot.getElementById('moreAssignmentsButton').style.display = 'none';
    this.shadowRoot.getElementById('lessAssignmentsButton').style.display = 'block';
    const assignmentsContainer = this.shadowRoot.querySelectorAll('.hideAssignmentListItem');

    assignmentsContainer.forEach((assignmentItem) => {
      assignmentItem.style.display = 'block';
    });
  }

  showLessAssignments() {
    this.shadowRoot.getElementById('teamMemberPanel').style.display = 'block';
    this.shadowRoot.getElementById('moreAssignmentsButton').style.display = 'block';
    this.shadowRoot.getElementById('lessAssignmentsButton').style.display = 'none';
    const assignmentsContainer = this.shadowRoot.querySelectorAll('.hideAssignmentListItem');

    assignmentsContainer.forEach((assignmentItem) => {
      assignmentItem.style.display = 'none';
    });
  }

  showMoreTeamMembers() {
    this.shadowRoot.getElementById('feedbackAssignmentPanel').style.display = 'none';
    this.shadowRoot.getElementById('moreMembersButton').style.display = 'none';
    this.shadowRoot.getElementById('lessMembersButton').style.display = 'block';
    const membersContainer = this.shadowRoot.querySelectorAll('.hideMemberListItem');

    membersContainer.forEach((member) => {
      member.style.display = 'block';
    });
  }

  showLessTeamMembers() {
    this.shadowRoot.getElementById('feedbackAssignmentPanel').style.display = 'block';
    this.shadowRoot.getElementById('moreMembersButton').style.display = 'block';
    this.shadowRoot.getElementById('lessMembersButton').style.display = 'none';
    const membersContainer = this.shadowRoot.querySelectorAll('.hideMemberListItem');

    membersContainer.forEach((member) => {
      member.style.display = 'none';
    });
  }

  daysRemaining(feedbackExpirationDate) {
    const oneDay = 24 * 60 * 60 * 1000;
    const today = new Date();
    const daysRemaining = ((feedbackExpirationDate.getTime() - today.getTime()) / oneDay).toFixed(0);

    return daysRemaining;
  }

  displayFeedbackDueDate(feedbackExpirationDate) {
    return html`
      ${this.daysRemaining(feedbackExpirationDate) > 0
        ? this.daysRemaining(feedbackExpirationDate) + ' Days left'
        : 'Overdue'}
    `;
  }

  renderEmails() {
    return html`
      <div id="searchBar">
        <input
          type="email"
          list="emails"
          id="peerSearch"
          name="user-search-field"
          placeholder="Search for person to provide feedback..."
          @input=${(e) => this.searchUsers(e.target.value)}
        />
      </div>
      <div id="searchResults">
        <span style="border-bottom: solid 1px black;">
          <h2 class="pagetitle">Search Results</h2>
        </span>

        <label class="noListToDisplay" id="no-results" >No Results Found</label>

        ${!!this.userSearchOptions
          ? this.userSearchOptions.map(
              (searchedUser, index) =>
                html`
                  <e-gear-list-item
                    .item=${{
                      name: searchedUser.userPrincipalName,
                      subName: searchedUser.city ? searchedUser.displayName.concat(' - ', searchedUser.city) : searchedUser.displayName,
                      icon: 'images/logos/group-prac.svg',
                      displayNumber: index
                    }}
                    class="gearList"
                    @click="${(e) => this.viewUser(searchedUser.userPrincipalName)}"
                  ></e-gear-list-item>
                `
            )
          : html``}
      </div>
      <div>
        <span class="invalid-email" id="invalid-email">${this.validationMessage}</span>
      </div>
    `;
  }

  async searchUsers(searchQuery) {
    if (searchQuery && searchQuery.length > 2) {
      this.userSearchOptions = (await userService.findUsers(searchQuery)).value;
    } else if (!searchQuery || searchQuery.length == 0) {
      this.userSearchOptions = [];
    }
    if (this.userSearchOptions && this.userSearchOptions.length > 0) {
      this.shadowRoot.getElementById('feedbackAssignmentPanel').style.display = 'none';
      this.shadowRoot.getElementById('teamMemberPanel').style.display = 'none';
      this.shadowRoot.getElementById('searchResults').style.display = 'block';
      this.shadowRoot.getElementById('no-results').style.display = 'none';
    }else if (searchQuery.length >= 1) {
       this.shadowRoot.getElementById('no-results').style.display = 'flex';
       
       if (searchQuery.length <= 2 ){
        this.shadowRoot.getElementById('no-results').innerHTML = 'Search Requires Atleast 3 Characters';
       }else{
         this.shadowRoot.getElementById('no-results').innerHTML = 'No Results Found';
       }
       
       this.shadowRoot.getElementById('feedbackAssignmentPanel').style.display = 'none';
        this.shadowRoot.getElementById('teamMemberPanel').style.display = 'none';
        this.shadowRoot.getElementById('searchResults').style.display = 'block';
    } else {
      this.shadowRoot.getElementById('feedbackAssignmentPanel').style.display = 'block';
      this.shadowRoot.getElementById('teamMemberPanel').style.display = 'block';
      this.shadowRoot.getElementById('searchResults').style.display = 'none';
      this.shadowRoot.getElementById('no-results').style.display = 'none';
      this.showLessTeamMembers();
      this.showLessAssignments();
    }
  }

  displayNoFeedbacksText() {
    if (this.shadowRoot.getElementById('assignedFeedback')) {
      return html``;
    } else {
      return html`
        <i>No Pending Feedbacks</i>
      `;
    }
  }

  leaveFeedback(reviewedUser, reviewTemplate, assignmentId) {
    store.dispatch(userToBeReviewedReceived(reviewedUser));
    store.dispatch(feedbackTemplateReceived(reviewTemplate));
    store.dispatch(feedbackAssignmentIdReceived(assignmentId));
    peerFeedbackService.updateFeedbackState(PEER_FEEDBACK_POST_STATE);
  }

  showMessages() {
    this.shadowRoot.getElementById('feedbackMessagePanel').style.display = 'block';
    this.shadowRoot.getElementById('feedbackSearchPanel').style.display = 'none';
    this.shadowRoot.getElementById('showMessagesButton').style.display = 'none';
    this.shadowRoot.getElementById('showFeedbackButton').style.display = 'block';
  }

  showSearch() {
    this.shadowRoot.getElementById('feedbackMessagePanel').style.display = 'none';
    this.shadowRoot.getElementById('feedbackSearchPanel').style.display = 'block';
    this.shadowRoot.getElementById('showMessagesButton').style.display = 'block';
    this.shadowRoot.getElementById('showFeedbackButton').style.display = 'none';
  }

  viewUser(upn) {
    store.dispatch(feedbackTemplateReceived(undefined));
    store.dispatch(userToBeReviewedReceived(upn));
    peerFeedbackService.updateFeedbackState(PEER_FEEDBACK_VIEW_STATE);
  }

  stateChanged(state) {
    this.feedbacksAssignedToUser = selectUserAssignedFeedbacks(state);
    this.messages = selectFeedbackMessages(state);
    this.hero = selectHero(state);
    this.userTeamMembers = selectUserTeamMembers(state);
    this.lock = selectFeedbackLoadingLock(state);
  }

  static get properties() {
    return {
      hero: String,
      messages: Array,
      feedbacksAssignedToUser: Array,
      userTeamMembers: Array,
      itemsShowedWithoutExpandingContainer: Number,
      template: String,
      userSearchOptions: Array,
      lock: Boolean,
    };
  }

  async firstUpdated() {
    store.dispatch(feedbackLoadingLock(true));
    await peerFeedbackService.getFeedbackMessages(this.hero);
    await peerFeedbackService.getAllFeedbacksAssignedToUser(this.hero);
    await peerFeedbackService.populateTeamMembers();
    await peerFeedbackService.getAllRetractioReason();
    this.userSearchOptions = [];
    store.dispatch(feedbackLoadingLock(false));
  }
}

window.customElements.define('e-feedback', Feedback);
