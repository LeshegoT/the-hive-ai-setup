import { html } from 'lit';
import { StatefulPage } from './stateful-page-view-element.js';
import { shared, animations, hex, link } from '../styles';
import {
  selectUserVotes,
  selectVotingOptions,
  selectVotingEvent
} from '../selectors/voting.selectors';
import votingService from '../services/voting.service';
import { star } from '../components/svg';
import { selectVotingEventId } from '../selectors/route-data.selectors';


import '../components/title.component';
import '../components/side-quest-name.component';
import '../components/icon.component';
import '../components/submit-message.component';
import '../components/sub-title.component';
import '../components/message-list.component';
import '../components/votes.component';

const styles = html`
  <style>
    ${shared()} ${hex()} ${animations()} ${link()}.is-registered {
      float: right;
      margin-top: -2em;
    }

    .buttons {
      display: flex;
      justify-content: space-between;
    }

    button,
    a {
      font-size: 1em;
    }

    .details {
      display: flex;
      margin: 1em 0;
      justify-content: space-evenly;
    }

    .detail-box {
      display: inline-flex;
      padding: 0.5em 0;
    }

    .icon {
      color: var(--app-primary-color);
      flex-basis: 10%;
      margin-top: 0.1em;
    }

    .detail-text {
      flex-basis: 90%;
    }

    .youTube{
      display: flex;
      align-items: center;
    }
    
    .hide {
      visibility: hidden;
    }

    .unchecked {
      fill: silver;
    }
    .rating-checked > svg{
      fill: orange;
    }

    @media (max-width: 460px) {
      .details {
        display: inline-block;
        flex-wrap: wrap;
      }
    }
  </style>
`;

class Vote extends StatefulPage {
  render() {
    if (!this.event) return html``;
    if (this.event && this.event.endDate < new Date().toISOString() || !this.event.active)
      return html`
        ${styles}
        <section class="fade-in">
          <e-title .name="${this.event.eventName}" .icon="${'images/logos/battle-deck.svg'}"></e-title>
          <h2>This event is no longer accepting votes.</h2>
        </section>
      `;
    return html`
      ${styles}
      <section class="fade-in">
        <e-title .name="${this.event.eventName}" .icon="${'images/logos/battle-deck.svg'}"></e-title>

        ${this.votingOptions.map(
          (option, index) =>
            html`
              <e-votes .option=${option} .vote=${this.votes[index]}></e-votes>
            `
        )}
      </section>
    `;
  }

  updateVote(option, vote) {
    let optionIndex = this.votes.indexOf(this.votes.find((v) => v.votingOptionId === option.votingOptionId));
    this.votes[optionIndex].rating = vote;
    votingService.vote(option.votingOptionId, vote, option.votingEventId);
  }

  static get properties() {
    return {
      id: Number,
      votingOptions: Object,
      mission: Object,
      description: String,
      votes: Array,
      event: Object,
    };
  }

  firstUpdated() {
    if (this.votingEventId) {
      votingService.getVotingEvent(this.votingEventId);

      if (!this.votingOptions || !this.votingOptions.length) {
        votingService.getVotingOptions(this.votingEventId);
      }
      if (!this.votes || !this.votes.length) {
        votingService.getUserVotes(this.votingEventId);
      }
    }
  }

  stateChanged(state) {
    this.event = selectVotingEvent(state);
    this.votingEventId = selectVotingEventId(state);
    this.votingOptions = selectVotingOptions(state);
    this.votes = selectUserVotes(state);
  }
}

window.customElements.define('e-vote', Vote);
