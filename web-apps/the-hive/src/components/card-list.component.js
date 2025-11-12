import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { selectCards } from '../selectors/card.selectors';
import cardService from '../services/card.service';
import { material_card, material_button, material_icon_button } from '../styles';

import './card.component';
import './card-points-summary.component';
import './card-level-up.component';
import './card-assigned-training.component';
import './card-side-quest.component';

let styles = html`
  <style>
    ${material_card()} ${material_button()} ${material_icon_button()}

    :host {
      display: block;
    }

    .mdc-card {
      height: auto;
      background-repeat: no-repeat;
      background-position: 1em 3em;
      fill: var(--app-tertiary-color);
      stroke: var(--app-tertiary-color);
      font-weight: lighter;
      margin-bottom:1em;
    }

    .description {
      min-height: 7em;
      padding: 0.75em;
    }

    .compulsoryTraining .description{
      background-color: var(--app-primary-color);
      color: white;
    }

    .title {
      font-size: var(--readable-font-size);
    }

    .subtitle {
      font-size: 0.9em;
    }

    .date {
      font-size: 0.9em;
    }

    a.link {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    a.link svg {
      display: block;
      margin: auto;
    }

    a.link:hover svg {
      stroke: var(--app-primary-color);
      fill: var(--app-primary-color);
    }

    a.navigate:hover {
      color: var(--app-primary-color);
    }

    .divider {
      border-bottom: 1px solid var(--app-lighter-text-color);
    }

    .divider > .icon {
      width: 3em;
      height: 3em;
      border-radius: 3em;
      background-color: var(--app-lighter-text-color);
      margin: -1.5em auto;
    }

    .divider > .icon > svg {
      stroke: white;
      fill: white;
    }

    .mdc-card:hover .divider > .icon {
      background-color: var(--app-primary-color);
    }

    button.mdc-button {
      font-size: 0.8em;
    }

    button.mdc-button:hover {
      color: var(--app-primary-color);
    }
  </style>
`;

class CardList extends StatefulElement {
  render() {
    return html`
      ${styles}
      ${this.cards
        ? this.cards
        .filter(card => card) // filter out any undefined/null cards
        .map((card) => {
            /*
          It seems like this switch statement is the best we can do since
          'expressions cannot appear where tag or atribute names would
          appear'. - Jason, 2020-01-20
        */
        switch (card.type.typeCode) {
          case 'levelUp':
            return html`
              <e-card-level-up .card="${card}"></e-card-level-up>
            `;
          case 'pointsSummary':
            return html`
            <e-card-points-summary .card="${card}"></e-card-points-summary>
          `;
          case 'compulsoryTraining':
            return html`
            <e-card-assigned-training class="${card.type.typeCode}" .card="${card}"></e-card-assigned-training>
          `;
          case 'sideQuest':
            return html`
            <e-card-side-quest .card="${card}"></e-card-side-quest>
          `;
          default:
            return html`
              <e-card  .card="${card}"></e-card>
            `;
        }
          })
        : html``}
    `;
  }

  static get properties() {
    return { cards: Array };
  }

  firstUpdated() {
    if (!this.cards || !this.cards.length) {
      cardService.fetchCards();
    }
  }

  stateChanged(state) {
    this.cards = selectCards(state);
  }
}

window.customElements.define('e-card-list', CardList);
