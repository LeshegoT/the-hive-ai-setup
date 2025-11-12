import { html, LitElement } from 'lit';

let styles = html`
  <style>
    #loader {
      display: flex;
      flex-direction: row;
      justify-content: center;
      text-align: center;
      font-family: 'Inter';
    }

    #loader section {
      display: flex;
      flex-direction: column;
    }

    embed {
      width: 20em;
    }

    @media only screen and (max-width: 500px) {
      embed {
        width: 10em;
      }
    }
  </style>
`;

class Loader extends LitElement {
  render() {
    return html`
      ${styles}
      <article id="loader">
        <section>
          <embed src="../../images/hive-loader.svg" />
          <h1>${this.message || 'Loading'}</h1>
        </section>
      </article>
    `;
  }

  static get properties() {
    return  {
      message: { type: String },
    };
  }
}

window.customElements.define('e-loader', Loader);
