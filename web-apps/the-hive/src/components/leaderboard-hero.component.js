import { html, LitElement } from 'lit';
import { shared } from '../styles';

import authService from '../services/auth.service';
import userService from '../services/user.service';

import './profile.component';
import './hex.component';

let borderColour = (hc) => {
  if (!hc) return 'white';

  return `rgb(${hc.red - 80},${hc.green - 80},${hc.blue - 80})`;
};

let styles = (index, is_me, highlightColour, alternateRows = false) => html`
  <style>
    ${shared()} :host {
      display: flex;
      padding: 8px;
      background: var(
        ${alternateRows && index % 2
          ? '--app-section-even-color'
          : '--app-section-odd-color'}
      );

      max-width: var(--app-max-width);
      margin-right: auto;
      margin-left: auto;
      color: ${is_me ? 'var(--app-primary-color)' : 'inherit'};
      font-weight: ${is_me ? 'bold' : 'normal'};

      position: ${is_me ? '-webkit-sticky' : 'inherit'};
      position: ${is_me ? 'sticky' : 'inherit'};
      top: ${is_me ? '0' : 'inherit'};
      bottom: ${is_me ? '0' : 'inherit'};
      z-index: ${is_me ? '1' : 'inherit'};

      border: 2px solid ${borderColour(highlightColour)};
    }

    .position,
    e-profile,
    e-avatar,
    .person-name,
    .points-total {
      display: inline-block;
      flex: 0 1 auto;
      margin: 0.5em 0.1em;
    }

    .position {
      flex: 0 0 2.5em;
      width: 2.5em;
      height: 2.5em;
      border-radius: 2.5em;
      text-align: center;
    }

    .position e-hex {
      stroke: ${borderColour(highlightColour)};
      fill: ${borderColour(highlightColour)};
    }

    span {
      display: inline-block;
      width: 100%;
      margin-top: 0.5em;
    }

    e-profile {
      width: 3.5em;
      margin: auto;
    }

    .person-name {
      overflow: hidden;
      flex-basis: 50%;
      text-align: left;
    }

    .points-total {
      margin-right: 0.5em;
      flex-basis: 20%;
      text-align: right;
    }

    e-hex {
      display: block;
      margin-top: -2em;
    }

    .rank {
      width: 3em;
      margin: auto;
      text-align: center;
      font-size: 0.6em;
      flex-basis: 20%;
    }

    .rank.down {
      width: 0; 
      height: 0; 
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid #b44949;
    }

    .rank.up {
      width: 0; 
      height: 0; 
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 6px solid #77c673;
    }
  </style>
`;

class LeaderboardHero extends LitElement {
  render() {
    let { hero, displayName, profilePictureData, realName } = this;
    let { position, userPrincipleName, pointsTotal, lastRanking } = hero;
    let { lastPosition, lastPoints } = lastRanking;

    return html`
      ${styles(position, this.is_me, this.highlightColour, this.alternateRows)}

      <div class="position position-${position}">
        <span>${position}</span>
        <e-hex></e-hex>
      </div>
      <e-profile .person="${displayName}" .noLoad="${this.hero.appearAnonymously }"></e-profile>
      <div class="person-name">
        <span>
          ${this.hero.appearAnonymously ? displayName : realName || userPrincipleName}
        </span>
      </div>
      <div class="rank">
        <div>${lastPosition}</div>
        <div class="rank ${lastPosition? (position==lastPosition? 'same' : position<lastPosition ? 'up' : 'down') : 'none'}"></div>
      </div>
      <div class="points-total"><span>${pointsTotal}</span></div>
    `;
  }

  static get properties() {
    return {
      hero: Object,
      displayName: String,
      profilePictureData: String,
      is_me: Boolean,
      skip_auth: Boolean,
      highlightColour: String,
      alternateRows: Boolean
    };
  }

  updated(changedProperties) {
    if (changedProperties.has('hero')) {
      if (!this.skip_auth)
        this.is_me = authService.getUserPrincipleName() === this.hero.userPrincipleName;

      this.displayName = this.hero.displayName || this.hero.userPrincipleName;
      this.realName = this.hero.realName;
      this.profilePictureData = this.hero.profilePictureData;

      let shouldFetchDisplayName = !this.hero.displayName && !this.hero.appearAnonymously;
      if (shouldFetchDisplayName) {
        userService
          .getActiveDirectoryProfile(this.hero.userPrincipleName)
          .then((profile) => (this.displayName = profile.displayName));
      }
    }
  }
}

window.customElements.define('e-leaderboard-hero', LeaderboardHero);
