import { html, LitElement } from 'lit';
import { shared, animations } from '../styles';
import partsService from '../services/parts.service';
import { StatefulPage } from './stateful-page-view-element';
import {
  selectClaimParts,
  selectAvailableParts,
  selectUserParts,
  selectAvatarBody
} from '../selectors/avatar.selectors';
import { store } from '../store';

import '../components/my-avatar.component';
import '../components/part-box.component';
import { avatarPartsChanged } from '../actions/avatar-parts-changed.action';

let styles = html`
  <style>
    ${shared()} ${animations()} section {
      display: flex;
      flex-direction: column;
    }

    section > * {
      padding: 0;
      margin: 0;
    }

    e-avatar {
      display: inline-block;
      flex: 0 0 auto;
      margin: -2em auto;
    }

    h1 {
      display: inline-block;
      font-size: 2.5em;
      font-weight: lighter;
      margin: 0;
    }

    .parts,
    .choose-parts {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
    }

    .parts e-part-box,
    .choose-parts e-part-box {
      height: 6em;
      width: 6em;
      margin: 0.5em;
    }

    .part-type {
      flex: 1 0 auto;
    }

    .part-type e-part-box {
      margin: 1em 2.5em;
    }

    .heading {
      text-align: center;
      text-transform: capitalize;
    }

    .part-type .selected e-part-box {
      border: 1px solid var(--app-primary-color);
    }

    .part-type .locked {
      position: relative;
    }

    .part-type .locked img {
      position: absolute;
      width: 3em;
      height: 3em;
      top: 0.5em;
      left: 0;
      right: 0;
      margin: auto;
    }

    .part-type .locked e-part-box {
      cursor: no-drop;
    }

    button.go {
      height: 2em;
      font-size: 1.3em;
      line-height: 1em;
      align-self: flex-end;
      margin: 0.7em;
    }

    @media (min-width: 460px) {
      section {
        flex-direction: row;
      }
      e-avatar {
        margin: 0;
      }
      .congrats {
        margin: 4em 0 0 3em;
      }
      h1 {
        font-size: 3em;
      }
      .parts e-part-box {
        margin: 1em;
      }
      .part-type e-part-box {
        margin: 1em auto;
      }
    }
  </style>
`;

class ClaimParts extends StatefulPage {
  renderClaimParts() {
    return this.combinedClaimPartsList().map((part) => {
      return html`
        <e-part-box .body="${this.body}" .part="${part}" forceActiveStyle="true"></e-part-box>
      `;
    });
  }

  renderSelectablePart(part) {
    if (this.isAlreadySelected(part))
      return html`
        <div class="selected">
          <e-part-box .body="${this.body}" .part="${part}"></e-part-box>
        </div>
      `;

    if (part.selectable)
      return html`
        <div class="selectable">
          <e-part-box
          .body="${this.body}"
            .part="${part}"
            @click="${(e) => this.selectPart(part)}"
          ></e-part-box>
        </div>
      `;

    return html`
      <div class="locked">
        <img src="images/logos/locked.svg" alt="" />
        <e-part-box .body="${this.body}" .part="${part}"></e-part-box>
      </div>
    `;
  }

  render() {
    if (!this.claimParts.length) return html``;

    return html`
      ${styles}

      <section class="fade-in">
        <e-my-avatar hideEditor="true"></e-my-avatar>

        <div class="congrats">
          <h1>Congratulations!</h1>
          <div>You have been awarded the following:</div>

          <div class="parts">
            ${this.renderClaimParts()}
            <button
              type="button"
              class="go"
              ?disabled="${this.isThereAnythingLeftToSelect()}"
              @click="${(e) => this.saveSelectedParts()}"
            >
              Go!
            </button>
          </div>
        </div>
      </section>

      <!-- This is copied from the editor. Find a way to reuse this code! - Mike, 2019-07-01 -->
      <section class="choose-parts">
        ${Object.keys(this.availableParts).map((partType) => {
          let parts = this.availableParts[partType];
          return html`
            <div class="part-type">
              <div class="heading">${partType}:</div>
              ${parts.map((part) => this.renderSelectablePart(part))}
            </div>
          `;
        })}
      </section>
    `;
  }

  static get properties() {
    return {
      claimParts: Array,
      availableParts: Array,
      selectedParts: Array
    };
  }

  constructor() {
    super();
    this.selectedParts = [];
  }

  firstUpdated() {
    partsService.getClaimParts();
  }

  combinedClaimPartsList() {
    let selectedParts = [...this.selectedParts];

    return this.claimParts.map((part) => {
      if (selectedParts && selectedParts.length && !part.partId) {
        let selectedPart = selectedParts.splice(0, 1)[0];
        return { ...part, ...selectedPart };
      }

      return part;
    });
  }

  isThereAnythingLeftToSelect() {
    let numberOfSelectableParts = this.claimParts.filter((p) => !p.partId).length;
    let numberOfSelectedParts = this.selectedParts.length;
    return numberOfSelectableParts > numberOfSelectedParts;
  }

  isAlreadySelected(part) {
    return (
      this.selectedParts.find((p) => p.partId === part.partId) ||
      this.claimParts.find((p) => p.partId === part.partId)
    );
  }

  selectPart(part) {
    if (this.isAlreadySelected(part)) return;

    let selectedParts = [...this.selectedParts, part];

    if (!this.isThereAnythingLeftToSelect()) selectedParts.splice(0, 1);

    this.selectedParts = selectedParts;
  }

  saveSelectedParts() {
    partsService.chooseParts(this.combinedClaimPartsList());
  }

  stateChanged(state) {
    this.claimParts = selectClaimParts(state);
    this.userParts = selectUserParts(state);
    this.availableParts = selectAvailableParts(state);
    this.body = selectAvatarBody(state);
  }
}

window.customElements.define('e-claim-parts', ClaimParts);
