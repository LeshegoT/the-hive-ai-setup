import { html, LitElement } from 'lit';
import votingService from '../services/voting.service';
import { star } from '../components/svg';
import { feedbackTagRating } from '../actions/peer-feedback.action';
import { store } from '../store.js';
import { connect } from 'pwa-helpers/connect-mixin.js';

const styles = html`
  <style>
    .hilight {
      stroke: orange;
    }
    .rating-checked > svg {
      fill: orange;
    }
    .unchecked {
      fill: silver;
    }

    .star > svg {
      width: 1.9em;
      height: 1.9em;
      cursor: pointer;
    }
    .tag-name {
      word-wrap: break-word;
      font-size: 1em;
      font-weight: bold;
      color: var(--app-tertiary-color);
    }

    .tag-description {
      text-align: left;
      font-size: small;
      word-wrap: break-word;
      margin-bottom: 0.5em;
    }

    @media (max-width: 425px) {
      .star > svg {
        width: 2em;
        height: 2em;
      }
    }
  </style>
`;

class Votes extends connect(store)(LitElement) {
  renderRating(votingOption) {
    const ratingTotal = 5;
    let userVote = this.vote.rating;

    let content = [];
    for (let i = 0; i < ratingTotal; i++) {
      content.push(html`
        <span
          class="button ${this.type === 'feedback' ? 'star' : ''} ${userVote > i ? 'rating-checked' : 'unchecked'} ${this.shouldHilight(i)}"
          @click="${(e) => this.updateVote(votingOption, i + 1)}"
          @mouseover="${(e) => this.hoverOverRating(i)}"
          @mouseout="${(e) => this.cancelHover()}"
        >
          ${star}
        </span>
      `);
    }

    return html`
      ${content}
    `;
  }

  render() {
    return html`
      ${styles}
      <section>
        ${this.type === 'feedback'
          ? html`
              <div class="tag-name">${this.option.name}</div>
              <div class="tag-description">${this.option.description}</div>
            `
          : html`
              <e-hex-name .icon="${'images/logos/battle-deck.svg'}" .name="${this.option.name}"></e-hex-name>
            `}
        <div>${this.vote ? this.renderRating(this.option) : ''}</div>
      </section>
    `;
  }

  updateVote(option, vote) {
    this.vote.rating = vote;

    if (this.type === 'feedback') {
      store.dispatch(feedbackTagRating({ tagRating: { rating: vote, tagName: option.name , description: option.description} }));
    } else {
      votingService.vote(option.votingOptionId, vote, option.votingEventId);
    }
  }

  hoverOverRating(index) {
    this.voteHighlights = index + 1;
    this.requestUpdate();
  }

  shouldHilight(i) {
    if (i + 1 <= this.voteHighlights) {
      return 'hilight';
    }

    return '';
  }

  cancelHover() {
    this.voteHighlights = 0;
  }

  firstUpdated() {
    this.cancelHover();
  }

  static get properties() {
    return {
      option: Object,
      vote: Object,
      index: Number,
      voteHighlights: Number,
      type: String,
    };
  }
}

window.customElements.define('e-votes', Votes);