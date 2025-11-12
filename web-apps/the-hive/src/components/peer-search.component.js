import {LitElement, html} from 'lit';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';
import { navigateComponent } from '../actions/app.action';
import userService from '../services/user.service';

const styles = html`
  <style>
    section {
      width:100%;
    }

    div.searchBar input[type='email'] {
      padding: 0.6em;
      font-size: 1em;
      width: 100%;
      background: var(--app-header-background-color);
      border: 1px solid var(--app-dashboard-shadow);
      outline: none;
    }

    div.searchBar::after {
      content: '';
      clear: both;
      display: table;
    }

  </style>
`;
class PeerSearch extends connect(store)(LitElement) {
  constructor() {
    super();
    this.validationMessage = '';
  }
  renderEmails() {
    return html`
      <div class="searchBar">
        <input
          type="email"
          list="emails"
          id="peerSearch"
          name="user-search-field"
          placeholder="Search for a colleague"
          @input=${(e) => this.searchUsers(e.target.value)}
        />
      </div>
      <datalist id="emails">
        ${!!this.userSearchOptions
          ? this.userSearchOptions.map(
              (searchedUser) =>
                html`
                  <option value="${searchedUser.userPrincipalName}">
                    ${searchedUser.displayName} - ${searchedUser.city}
                  </option>
                `
            )
          : html``}
      </datalist>
      <div>
        <span class="invalid-email" id="invalid-email">${this.validationMessage}</span>
      </div>
    `;
  }

  async searchUsers(searchQuery) {
    if (searchQuery.length > 2) this.userSearchOptions = (await userService.findUsers(searchQuery)).value;
  }

  render() {
    return html`
      ${styles}
      <section>${this.renderEmails()}</section>
    `;
  }

  static get properties() {
    return {
      bbdEmailRegex: String,
      validationMessage: String,
      userSearchOptions: Array,
      selectedEmail: String,
    };
  }
}

window.customElements.define('e-peer-search', PeerSearch);