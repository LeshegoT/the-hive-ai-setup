import {LitElement, html, css} from 'lit';

class EventsNotFound extends LitElement {
  static get properties() {
    return {
      filterValue: String,
    };
  }

  static styles = css`
    :host {
      display: block;
      text-align: center;
    }

    h1 {
      font-size: xx-large;
    }

    .error-message {
      font-style: italic;
    }
  `;

  render() {
    return html`
      <h1>No Events Found</h1>
      ${this.filterValue
        ? html`
            <p class="error-message">No Events found for the selected filter: ${this.filterValue}</p>
          `
        : html`
            <p class="error-message">No Events found try selecting other filters or come back later...</p>
          `}
    `;
  }
}

window.customElements.define('e-events-not-found', EventsNotFound);
