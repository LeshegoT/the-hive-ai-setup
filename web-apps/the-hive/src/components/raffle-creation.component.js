import { html, LitElement } from 'lit';
import { connect } from 'pwa-helpers/connect-mixin';
import { store } from '../store';
import { shared, form, material_card, material_button, material_icon_button } from '../styles';
import { add, trash } from './svg';
import { selectHero } from '../selectors/hero.selectors';
import raffleService, { RAFFLE_HOME_STATE } from '../services/raffle.service';
import { selectRaffleParticipants } from '../selectors/raffle.selectors';
import { raffleParticipantsReceived } from '../actions/raffle.action';
import announcementService from '../services/announcement.service';
import userService from '../services/user.service';

const styles = html`
  <style>
    ${shared()} ${form()}${material_card()} ${material_button()} ${material_icon_button()} .details {
      display: flex;
      margin: 1em 0;
      justify-content: space-evenly;
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
      margin-top: 0.5em;
      box-shadow: 1px 2px 4px var(--app-dashboard-shadow);
      width: 15em;
      font-size: medium;
      background: var(--app-header-background-color);
    }

    .transparentButton {
      border: none;
      background: transparent;
      margin: 0.1em;
    }

    .transparentButton:hover {
      border: none;
      background: transparent;
    }

    #addParticipantButton > svg {
      width: 2.5em;
      height: 2.5em;
      margin-bottom: -0.8em;
    }

    #raffleCreationPanel {
      display: flex;
      flex-direction: row;
      align-content: space-between;
    }

    #raffleCreationPanel > div {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-content: flex-start;
    }

    #raffleCreationPanel label {
      display: block;
      color: var(--app-dashboard-shadow);
    }

    #leftPanel div,
    #rightPanel div {
      width: 100%;
    }

    input {
      width: 90%;
    }

    #raffelParticipantSection span {
      display: flex;
      flex-direction: row;
    }

    #newParticipant {
      width: 80%;
    }

    #buttonPanel {
      margin-top: 3em;
    }

    #addedParticipantsHeading {
      display: block;
      width: 85%;
      border-bottom: 2px solid var(--app-dashboard-shadow);
    }

    #participantsPanel {
      display: flex;
      flex-direction: column;
      margin-top: 2em;
    }

    #participantsPanel ul {
      width: 75%;
    }

    #participantsPanel svg {
      width: 1.3em;
      height: 1.3em;
    }

    #participantsPanel li div {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      min-height: 2em;
    }

    @media (max-width: 1200px) {
      #newParticipant {
        width: 72%;
      }
    }

    @media (max-width: 900px) {
      #raffleCreationPanel {
        flex-direction: column;
      }
    }

    @media (max-width: 600px) {
      #newParticipant {
        width: 70%;
      }
    }

    @media (max-width: 400px) {
      #newParticipant {
        width: 65%;
      }
    }
  </style>
`;

class RaffleCreation extends connect(store)(LitElement) {
  constructor() {
    super();
  }

  render() {
    return html`
      ${styles}
      <h2>New Raffle Details</h2>
      <div id="raffleCreationPanel">
        <div id="leftPanel">
          <div id="raffelDescriptionSection">
            <label>Give Your Raffel A Description</label>
            <input type="text" placeholder="Raffel Description" id="raffelDescription" />
          </div>
          <div id="raffelDateSection">
            <label>Choose A Spin Date</label>
            <input type="datetime-local" id="raffelDate" />
          </div>
        </div>
        <div id="rightPanel">
          <div id="raffelParticipantSection">
            <label id="participantsLabel">Add Participants</label>
            <span>
              <e-peer-search id="newParticipant"></e-peer-search>
              <button type="botton" class="transparentButton" id="addParticipantButton" @click="${() => this.addParticipant()}">${add}</button>
            </span>
          </div>
          ${this.renderRaffelAddedParticipants()}
        </div>
      </div>

      ${this.renderButtonPanel()}
    `;
  }

  renderButtonPanel(){
    return html`
      <div id="buttonPanel">
        <button class="clearButton" type="button" @click=${() => raffleService.updateRaffleState(RAFFLE_HOME_STATE) }>
          Cancel Creation
        </button>
        <button class="redButton" type="button" @click=${this.createNewRaffel}>Create New Raffle Group</button>
      </div>
    `;
  }

  async addParticipant() {
    let newParticipant = this.shadowRoot.getElementById('newParticipant').shadowRoot.getElementById('peerSearch').value;
    
    if (newParticipant.length > 0) {
        let validParticipant = (await userService.findUsers(newParticipant)).value;

        if(validParticipant.length == 1){
          let participantUserPrincipleName = validParticipant[0].userPrincipalName;
          let participantInParticipants = this.participants.indexOf(participantUserPrincipleName);

          if (participantInParticipants == -1 || this.participants.length == 0){
            this.shadowRoot.getElementById('newParticipant').shadowRoot.getElementById('peerSearch').value = '';
            this.participants.push(participantUserPrincipleName);
            this.updateParticipants();
          }

        }else{
          announcementService.createAnnouncement('none', {
            title: 'Failed To Add Participant',
            body: 'Invalid staff member',
          });
        }
    }

  }

  renderRaffelAddedParticipants() {
    return html`
      <div id="participantsPanel">
        <label id="addedParticipantsHeading">Participants</label>
        <ul>
          ${this.participants.map(
            (participant, index) =>
              html`
                <li>
                  <div>
                    <label>${participant}</label>
                    ${index != 0
                      ? html`
                          <button class="transparentButton" @click=${() => this.removeParticipantFromList(index)}>
                            ${trash}
                          </button>
                        `
                      : ``}
                  </div>
                </li>
              `
          )}
        </ul>
      </div>
    `;
  }

  removeParticipantFromList(index){
    this.participants.splice(index, 1);
    this.updateParticipants();
  }

  updateParticipants(){
    this.participants = [...this.participants];
    store.dispatch(raffleParticipantsReceived(this.participants));
  }

  async createNewRaffel() {
    let data = {
      description: this.shadowRoot.getElementById('raffelDescription').value,
      spinDate: new Date(this.shadowRoot.getElementById('raffelDate').value),
      participants: this.participants.map((participant) => participant.toLowerCase()),
    };

    let invalidMessage = '';

    if (!data.spinDate || this.shadowRoot.getElementById('raffelDate').value.length == 0 || data.spinDate <= new Date()) {
      invalidMessage += 'Invalid date. ';
    } else {
      data.spinDate = data.spinDate.toISOString();
    }

    if (data.description.length == 0) {
      invalidMessage += 'No description provided.';
    }

    if(data.participants.length < 3){
       invalidMessage += 'Atleast 3 participants required.';
    }

    if (invalidMessage.length > 0) {
      announcementService.createAnnouncement('none', {
        title: 'Failed Raffle Creation',
        body: invalidMessage,
      });
    } else {
      await raffleService.createRaffle(data);
      this.raffleCreation = false;
    }
  }

  static get properties() {
    return {
      participants: Array,
      raffleOwner: String,
    };
  }

  firstUpdated() {
    store.dispatch(raffleParticipantsReceived([this.raffleOwner]));
  }

  stateChanged(state) {
    this.participants = selectRaffleParticipants(state);
    this.raffleOwner = selectHero(state);
  }
}

window.customElements.define('e-raffle-creation', RaffleCreation);

