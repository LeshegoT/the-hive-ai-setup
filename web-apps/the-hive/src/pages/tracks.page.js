import { html } from 'lit';
import { StatefulPage } from './stateful-page-view-element.js';
import { shared, animations } from '../styles';
import { selectTracks } from '../selectors/track.selectors.js';

import '../components/title.component';
import '../components/track-summary.component';

const styles = html`
  <style>
    ${shared()} ${animations()} em {
      font-style: normal;
      font-weight: bold;
      color: var(--app-primary-color);
    }

    .title {
      display: flex;
    }

    .hex {
      height: 5em;
      width: 5em;
    }

    .track-name {
      flex: auto;
      border: 0 solid var(--app-secondary-color);
      border-width: 0 0 3px 0;
      font-size: 1.5em;
      margin: 0.55em 0 0.95em -0.6em;
      font-weight: lighter;
    }

    .track-name span {
      padding: 0.25em 1.5em;
    }
  </style>
`;

class Tracks extends StatefulPage {
  render() {
    return html`
      ${styles}
      ${this.tracks &&
        this.tracks.map(
          (track) => html`
            <section class="fade-in">
              <e-title .name="${track.name}" .icon="${track.icon}"></e-title>
              <e-track-summary .track="${track}"></e-track-summary>
            </section>
          `
        )}
    `;
  }

  static get properties() {
    return {
      tracks: { type: Array }
    };
  }

  stateChanged(state) {
    this.tracks = selectTracks(state);
  }
}

window.customElements.define('e-tracks', Tracks);
