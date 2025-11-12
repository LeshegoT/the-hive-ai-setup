import { html, LitElement } from 'lit';
import { shared } from '../styles';
import userService from '../services/user.service';

let styles = html`
  <style>
    ${shared()} .title {
      display: flex;
      align-items: center;
    }

    .title > e-profile {
      flex: 0 0 auto;
      margin: auto 0;
    }

    .title > div {
      margin: 0.3em 0.6em;
      color: var(--app-secondary-color);
      overflow: hidden;
      text-overflow: clip;
      white-space: nowrap;
      font-weight: bold;
    }

    .title > div > span {
      font-weight: lighter;
    }

    .title.right {
      flex-direction: row-reverse;
    }
  </style>
`;

class HeroTitle extends LitElement {
  renderEmail() {
    if (this.hideEmail) return html``;
    return html`
      <span>(${this.hero})</span>
    `;
  }

  render() {
    let orientation = this.orientation || 'left';
    return html`
      ${styles}

      <div class="title ${orientation}">
        <e-profile .person="${this.hero}"></e-profile>
        <div>${this.heroName} ${this.renderEmail()}</div>
      </div>
    `;
  }

  static get properties() {
    return {
      hero: String,
      heroName: String,
      orientation: String,
      hideEmail: String
    };
  }

  updated(changedProperties) {
    if (changedProperties.has('hero') && this.hero) {
      this.loadProfile();
    }
  }

  loadProfile() {
    userService.getActiveDirectoryProfile(this.hero).then(
      (profile) => (this.heroName = profile.displayName)
    );
  }
}

window.customElements.define('e-hero-title', HeroTitle);
