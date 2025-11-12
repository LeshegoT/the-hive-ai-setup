import { html } from 'lit';
import { shared } from '../styles';
import { add, bucks } from './svg';
import { StatefulElement } from './stateful-element';
import { store } from '../store';
import raffleService from '../services/raffle.service';
import { selectActiveRaffle } from '../selectors/raffle.selectors';
import { RAFFLE_HOME_STATE, RAFFLE_VIEW_STATE, RAFFLE_SPIN_STATE } from '../services/raffle.service';
import { selectHero } from '../selectors/hero.selectors';
import { raffleParticipantsReceived } from '../actions/raffle.action'; 
import { selectRaffleParticipants, selectRaffleEntryPrice } from '../selectors/raffle.selectors';
import './profile.component' ; 
import './raffle-spinner.component';
import './raffle-spinner-big-participant.component';
import announcementService from '../services/announcement.service';
import userService from '../services/user.service';

const styles = html`
  <style>
    ${shared()} h1 {
      text-align: center;
    }

    #hiddenParticipants{
      color: var(--app-dashboard-shadow);
    }

    .redButton {
      background: var(--app-primary-color);
      color: var(--app-light-text-color);
      box-shadow: 1px 2px 4px var(--app-dashboard-shadow);
      width: 15em;
      font-size: medium;
    }

    .redButton:hover {
      color: var(--app-dark-text-color);
    }

    .clearButton {
      margin-top: 3em;
      box-shadow: 1px 2px 4px var(--app-dashboard-shadow);
      width: 15em;
      font-size: medium;
      background: var(--app-header-background-color);
    }

    #informationPanel {
      display: flex;
      flex-direction: row;
      width: 100%;
      justify-content: space-between;
      padding-bottom: 1em;
      margin-bottom: 1em;
      border-bottom: 1px solid var(--app-header-text-color);
    }

    #raffleExtendedPanel{
      display:flex;
      flex-direction:row;
      justify-content: space-between;
    }

    #raffleExtendedPanel > div{
      flex: 1 1 auto;
    }

    #raffleSpinnerSection{
      text-align: center;
      overflow: hidden;
    }

     #raffleSpinnerSection button{
      margin-bottom: 1em;
     }


    @media(max-width: 600px){
      #informationPanel {
        flex-direction: column;
      }

      .participant {
        min-width: 100%;
      }

      #addParticipant {
        width: 85%;
      }

      .redButton{
        margin-top: 1em;
        width:100%;
      }

      #addParticipant{
        min-width: 100%;
      }

      #raffleExtendedPanel{
        flex-direction:column;
      }

      #raffleExtendedPanel > div{
        margin-bottom: 2em;
      }
    }

    #informationPanel > div {
      width: 100%;
    }

    .informationHeader {
      font-weight: bold;
    }

    .participant {
      display: flex;
      flex-direction: row;
      justify-content: space-evenly;
      padding: 0.3em 1em;
      max-width: 50vw;
    }

    .participant:nth-child(even) {
      background-color: #ffffff;
    }

    .participant:nth-child(odd) {
      background-color: #f7f7f7;
    }

    .participant label {
      margin: 0.5em;
    }

    .participantEntries {
      font-weight: bold;
      flex-grow: auto;
    }

    .participantIndex {
      flex-grow: auto;
    }

    .participantProfile {
      flex-grow: 9;
      display: flex;
      flex-direction: row;
    }

    #spinDate {
      color: var(--app-primary-color);
      font-weight: bold;
    }

    #addParticipant {
      display: flex;
      flex-direction: row;
      width: 60%;
      margin-bottom: 1em;
    }

    #addParticipant button {
      flex: 1;
      border: none;
      background: transparent;
      text-align: left;
      margin-left: 1em;
    }

    #addParticipant button > svg {
      width: 2.5em;
      height: 2.5em;
      margin-bottom: -0.8em;
    }

    #addParticipant e-peer-search {
      flex: 5;
    }

    #winner {
      background-color: rgba(4, 126, 9, 0.3);
      font-weight: bolder;
      margin-bottom: 1em;
    }

    .multiply {
      margin-left: 1em;
    }

    @media (max-width: 900px) {
      .participant {
        width: 70%;
      }

      #addParticipant {
        width: 85%;
      }
    }

    }
  </style>
`;

class RaffleView extends StatefulElement {
  constructor() {
    super();
  }

  render() {
    this.waitForElement('#spinDate').then((element) => {
      this.countDown(element);
    });

    return html`
      ${styles}
      <h1>${this.raffle.description}</h1>

      ${this.renderInformationPanel()}
      <div id="raffleExtendedPanel">${this.renderParticipants()} ${this.renderViewPastSpin()}</div>
      ${this.renderButtonPanel()}
    `;
  }

  waitForElement(selector) {
    return new Promise((resolve) => {
      if (this.shadowRoot.querySelector(selector)) {
        return resolve(this.shadowRoot.querySelector(selector));
      }

      const observer = new MutationObserver(() => {
        const element = this.shadowRoot.querySelector(selector);
        if (element) {
          resolve(element);
          observer.disconnect();
        }
      });

      observer.observe(this.shadowRoot, {
        childList: true,
        subtree: true,
      });
    });
  }

  renderInformationPanel() {
    return html`
      <div id="informationPanel">
        <div>
          <div>
            <label class="informationHeader">Winnings Up For Grabs:</label>
            <label class="informationDetails">${bucks}${this.raffle.totalWinningsAvailable}</label>
          </div>
          <div>
            <label class="informationHeader">Status:</label>
            <label class="informationDetails">${this.raffle.status.description}</label>
          </div>
          ${this.renderRaffleWinnerLabel()}
          <div>
            <label class="informationHeader">Number of entries bought by you:</label>
            <label class="informationDetails">
              ${this.raffle.participants.find((participant) => participant.userPrincipleName == this.hero).entries}
            </label>
          </div>
          <div>
            <label class="informationHeader">Spin:</label>
            <label class="informationDetails" id="spinDate"></label>
            ${this.isUserRaffleOwner && this.raffle.status.name.toLowerCase() !== 'completed'
              ? html`
                  <div>
                    <input
                      type="datetime-local"
                      id="raffelDatePicker"
                      value="${new Date(
                        new Date(this.raffle.spinDate).getTime() -
                          new Date(this.raffle.spinDate).getTimezoneOffset() * 60000
                      )
                        .toISOString()
                        .slice(0, -1)}"
                    />
                    <button type="button" @click=${this.postponeRaffle}>Postpone</button>
                  </div>
                `
              : ``}
          </div>
        </div>
        ${this.renderActionButton()}
      </div>
    `;
  }

  renderRaffleWinnerLabel() {
    if (this.raffle.status.name.toLowerCase() == 'completed') {
      return html`
        <div>
          <label class="informationHeader">Winner:</label>
          <label class="informationDetails">
            ${this.raffle.participants.find((participant) => participant.winner).displayName}
          </label>
        </div>
      `;
    }
  }

  renderParticipants() {
    return html`
      <div>
        ${this.renderWinnerParticipant()}
        <div>
          <label class="informationHeader">Top 10 Participants:</label>
        </div>

        ${this.renderAddParticipant()} ${this.rederParticipantRows()} ${this.renderHiddenParticipantCount()}
      </div>
    `;
  }

  renderViewPastSpin() {
    if (this.raffle.status.name.toLowerCase() == 'completed') {
      let participantsWithEntries = this.raffle.participants.filter((participant) => participant.entries != 0);
      if (participantsWithEntries.length < 10) {
        return html`
          <div id="raffleSpinnerSection">
            <button class="redButton" @click="${this.spinRaffleReplay}">Spin</button>
            <e-raffle-spinner
              id="spinner"
              .playMode=${false}
              .participants="${participantsWithEntries.map((participant) => participant.displayName)}"
              .winningIndex=${participantsWithEntries.map((participant) => participant.winner).indexOf(true)}
              .wedgeCount=${participantsWithEntries.length}
              .size=${'large'}
              raffleId=${this.raffle.raffleId}
            ></e-raffle-spinner>
          </div>
        `;
      } else {
        return html`
          <div id="raffleSpinnerSection">
            <button class="redButton" @click="${this.spinRaffleReplay}">Spin</button>
            <e-raffle-spinner-big-participant
              id="spinner"
              .playMode=${false}
              .participants="${participantsWithEntries.map((participant) => participant.displayName)}"
              .winningIndex=${participantsWithEntries.map((participant) => participant.winner).indexOf(true)}
              .wedgeCount=${participantsWithEntries.length}
              .size=${'large'}
              raffleId=${this.raffle.raffleId}
            ></e-raffle-spinner-big-participant>
          </div>
        `;
      }
    }
  }

  async postponeRaffle(){
    let newRaffleDate = new Date(this.shadowRoot.getElementById('raffelDatePicker').value);
 
    if( newRaffleDate <= new Date() ){
      announcementService.createAnnouncement('none', {
        title: 'Failed Raffle Date Update',
        body: 'Cannot set raffle spin to past date',
      });
    }else{
      let data = {
        raffleId: this.raffle.raffleId,
        spinDate: newRaffleDate.toISOString(),
      };

      await raffleService.postponeRaffle(data);
    }

  }

  spinRaffleReplay() {
    const child = this.shadowRoot.getElementById('spinner');
    child.spin();
  }

  rederParticipantRows() {
    return this.participants.slice(0, 10).map((participant, index) => {
      return html`
        <div class="participant">
          <label class="participantIndex">${index + 1}</label>
          <span class="participantProfile">
            <e-profile .person="${participant.userPrincipleName}"></e-profile>
            <label>${participant.displayName}</label>
          </span>
          <label class="participantEntries">${participant.entries}</label>
        </div>
      `;
    });
  }

  renderWinnerParticipant(){
    if(this.raffle.status.name.toLowerCase() == 'completed'){
      let winner = this.raffle.participants.find((participant) => participant.winner) ; 
      return html`
        <div class="participant" id="winner" }>
          <label class="participantIndex"></label>
          <span class="participantProfile">
            <e-profile .person="${winner.userPrincipleName}"></e-profile>
            <label>${winner.displayName}</label>
          </span>
          <label class="participantEntries">${winner.entries}</label>
        </div>
      `;
    }
  }

  renderHiddenParticipantCount() {
    if (this.participants.length - 10 > 0) {
      return html`
        <label id="hiddenParticipants">( ${this.participants.length - 10} participants hidden )</label>
      `;
    }
  }

  renderAddParticipant() {
    if (this.isUserRaffleOwner && this.isRaffleOpenToBuy) {
      return html`
        <span id="addParticipant">
          <e-peer-search id="newParticipant"></e-peer-search>
          <button type="botton" id="addParticipantButton" @click="${() => this.addParticipant()}">${add}</button>
        </span>
      `;
    }

    return ``;
  }

  async addParticipant() {
     let newParticipant = this.shadowRoot.getElementById('newParticipant').shadowRoot.getElementById('peerSearch').value;

     if (newParticipant.length > 0) {
       let validParticipant = (await userService.findUsers(newParticipant)).value;

       if (validParticipant.length == 1) {
          let participantUserPrincipleName = validParticipant[0].userPrincipalName;
          let participantInParticipants = this.participants.find(
            (participant) => participant.userPrincipleName == participantUserPrincipleName
          );

         if (!participantInParticipants) {
           this.shadowRoot.getElementById('newParticipant').shadowRoot.getElementById('peerSearch').value = '';
           raffleService.updateRaffleParticipants(participantUserPrincipleName.toLowerCase(), this.raffle.raffleId);
         }
       } else {
         announcementService.createAnnouncement('none', {
           title: 'Failed To Add Participant',
           body: 'Invalid staff member',
         });
       }
     }

  }

  renderActionButton() {
    if (this.isRaffleOpenToBuy) {
      return html`
        <div>
          ${bucks}${this.rafflePrice}
          <span class="multiply">x</span>
          <input value="1" class="quantity" type="number" min="1" max="100" id="buyAmount-${this.raffle.raffleId}" />
          <button class="redButton" type="button" @click=${() => this.buy()}>Buy Entries</button>
        </div>
      `;
    } else if (this.isUserRaffleOwner && this.raffle.status.name.toLowerCase() == 'closed') {
      return html`
        <div>
          <button class="redButton" type="button" @click=${() => raffleService.updateRaffleState(RAFFLE_SPIN_STATE)}>
            Spin
          </button>
        </div>
      `;
    }
  }

  renderButtonPanel() {
    return html`
      <div id="buttonPanel">
        <button
          class="clearButton"
          id="viewAllRaffles"
          type="button"
          @click=${() => raffleService.updateRaffleState(RAFFLE_HOME_STATE)}
        >
          View All My Raffles
        </button>
      </div>
    `;
  }

  countDown(element) {
    let spinDate = this.raffle.spinDate;
    let countDownTo = spinDate.getTime();
    let beforeSpinTime = countDownTo - new Date().getTime() > 0 ; 

    if (new Date().toDateString() === spinDate.toDateString() && beforeSpinTime) {
      
      let countDownInterval = setInterval(function (raffleId) {
        const now = new Date().getTime();
        const millisecondsUntillSpin = countDownTo - now;

        let hours = Math.floor((millisecondsUntillSpin % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((millisecondsUntillSpin % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0 || minutes > 0) {
          element.innerText = hours + 'h ' + minutes + 'm ';
        } else {
          element.innerText = 'Less than a minute remaining';
        }

        if (millisecondsUntillSpin < 0) {
          clearInterval(countDownInterval);
          element.innerText = spinDate.toLocaleDateString() + ' - ' + spinDate.toLocaleTimeString();
          raffleService.getRaffle(raffleId);
        }
      }, 1000, this.raffle.raffleId);
    } else {
      element.innerText = spinDate.toLocaleDateString() + ' - ' + spinDate.toLocaleTimeString();
    }
  }

  async buy() {
    let buyNumberPicker = this.shadowRoot.getElementById(`buyAmount-${this.raffle.raffleId}`);
    let buyAmount = buyNumberPicker.value;

    if (buyAmount > 0 && buyAmount <= 100) {
      await raffleService.buyEntry(buyAmount, this.raffle.raffleId);
      buyNumberPicker.value = 1;
      await raffleService.getRaffle(this.raffle.raffleId);
    }
  }

  static get properties() {
    return {
      raffle: Object,
      participants: Array,
      hero: String,
      rafflePrice: Number,
      isUserRaffleOwner: Boolean,
      isRaffleOpenToBuy: Boolean,
    };
  }

  async firstUpdated() {
    store.dispatch(raffleParticipantsReceived(this.raffle.participants));
  }

  setRaffleChecks(){
    this.isUserRaffleOwner = this.raffle.createdBy == this.hero ? true : false;
    this.isRaffleOpenToBuy =
      new Date().getTime() < this.raffle.spinDate.getTime() || this.raffle.status.name.toLowerCase() == 'pending'
        ? true
        : false;
  }

  stateChanged(state) {
    this.hero = selectHero(state);
    this.raffle = selectActiveRaffle(state);
    this.participants = [...selectRaffleParticipants(state)];
    this.rafflePrice = selectRaffleEntryPrice(state);
    this.setRaffleChecks();
  }
}

window.customElements.define('e-raffle-view', RaffleView);
