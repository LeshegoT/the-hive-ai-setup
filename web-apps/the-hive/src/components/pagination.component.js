import {LitElement, html} from 'lit';
import { shared, animations } from '../styles';
import { doubleLeftArrow, doubleRightArrow, leftArrow, rightArrow } from "./svg";

const style = html`
  <style>
    ${shared()} ${animations()} .card {
      padding: 1em;
      margin-top: 0em;
      background: var(--app-dashboard-panel);
      box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.25);
      border-radius: 4px;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      height: 2em;
    }

    section:nth-of-type(even) {
      background: none;
    }

    .card > * {
      margin: 0em 2em;
      padding: 0em;
    }

    #pageSize,
    #controlButton {
      display: flex;
      align-items: center;
    }

    #pageSize > * {
      margin: 0em;
    }

    #controlButton > * {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0em;
      padding: 0em;
    }

    @media only screen and (max-width: 900px) {
      .card {
        justify-content: space-between;
      }
      .card > * {
        margin-inline: 5px;
      }
    }

    @media only screen and (max-width: 700px) {
      #pageSize p {
        display: none;
      }
    }

    @media only screen and (max-width: 530px) {
      .card {
        font-size: 0.8em;
      }
      svg {
        padding: 4px;
      }
      select {
        padding: 1px;
      }
    }
  </style>
`;

class Pagination extends LitElement {
  static properties = {
    resultSetSize: { type: Number },
    size: { type: Number },
    totalPages: { type: Number },
    page: { type: Number },
  };

  constructor() {
    super();
    this.pageSizeRange = [5, 10, 25, 50];
  }

  render() {
    return html`
      ${style}
      <section class="card">
        ${this.renderPageSize()} ${this.renderResultSetSize()} ${this.renderPageController()}
      </section>
    `;
  }

  renderPageSize() {
    return html`
      <section id="pageSize">
        <p>Items per page:</p>
        <select
          @change=${(e) => {
            this.dispatchEvent(this.buildEvent('size', e.target.value));
          }}
        >
          ${this.pageSizeRange.map((size) => {
            return html`
              <option ?selected=${this.size === size}>${size}</option>
            `;
          })}
        </select>
      </section>
    `;
  }

  renderResultSetSize() {
    let startItem = (this.page - 1) * this.size + 1;
    let endItem = Math.min(this.page * this.size, this.resultSetSize);

    return html`
      <section id="resultSetSize">${startItem} - ${endItem} of ${this.resultSetSize}</section>
    `;
  }

  renderPageController() {
    return html`
      <section id="controlButton">
        <section @click=${() => {this.updateCurrentPage(1)}}>${doubleLeftArrow}</section>
        <section @click=${() => this.updateCurrentPage(this.page - 1)}>${leftArrow}</section>
        <section @click=${() => this.updateCurrentPage(this.page + 1)}>${rightArrow}</section>
        <section @click=${() => this.updateCurrentPage(this.totalPages)}>${doubleRightArrow}</section>
      </section>
    `;
  }

  updateCurrentPage(page) {
    if (page > 0 && page <= this.totalPages) {
      this.dispatchEvent(this.buildEvent('page', page));
    }
  }

  buildEvent(key, value) {
    return new CustomEvent('page-information-changed', { detail: { [key]: value } });
  }
}

window.customElements.define('e-pagination', Pagination);