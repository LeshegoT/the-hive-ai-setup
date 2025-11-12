import { html } from 'lit';
import { StatefulPage } from './stateful-page-view-element';
import { shared, animations } from '../styles';
import { selectLevelUpActivityType } from '../selectors/reference-data.selectors';
import markdownService from '../services/markdown.service';

import '../components/title.component';

const styles = html`
  <style>
    ${shared()} ${animations()}

    .buttons {
      margin-top: 2em;
    }
  </style>
`;

class ActivityType extends StatefulPage {
  render() {
    if (!this.activityType) return html``;

    return html`
      ${styles}

      <section class="fade-in">
        <e-title .name="${this.activityType.name}" .icon="${this.activityType.icon}"></e-title>
        <p>${this.description}</p>

        <div class="buttons">
          <button type="button" class="back big" @click=${(e) => this.back()}>Back</button>
        </div>
      </section>
    `;
  }

  static get properties() {
    return {
      activityType: Object,
      description: String
    };
  }

  updated() {
    if (this.activityType && !this.description) {
      this.description = markdownService.convertMarkdownToHtml(this.activityType.description);
    }
  }

  back () {
    window.history.back();
  }

  stateChanged(state) {
      this.activityType = selectLevelUpActivityType(state);
  }
}

window.customElements.define('e-activity-type', ActivityType);
