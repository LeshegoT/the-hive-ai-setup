import { html } from 'lit';
import { StatefulPage } from './stateful-page-view-element.js';
import '../components/loader.component';
import { shared } from '../styles';
const styles = html`
  <style>
      ${shared()}

      section {
        min-height: 95vh;
        background-image: url('../../images/hive-background.svg');
        background-repeat: no-repeat;
        background-size: cover;
        display: flex;
        flex-direction: column;
        justify-content: center;
        font-family: 'Inter';
        background-attachment: fixed;
      }
  </style>
`;

class Waiting extends StatefulPage {
  render() {
    return html `
    ${styles}
        <section>
          <e-loader></e-loader>
        </section>
    `;
  }


  static get properties() {
    return {
    };
  }
}

window.customElements.define('e-waiting', Waiting);
