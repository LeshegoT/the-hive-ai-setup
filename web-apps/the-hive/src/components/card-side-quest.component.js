import { html, LitElement } from 'lit';
import { material_card, material_button, material_icon_button } from '../styles';
import { formatDateTime } from '../services/format.service';
import { link } from './svg';
import { SideQuestRegistration } from './side-quest-registration.component';
import iconService from '../services/icon.service';
import Card from './card.component';

class CardSideQuest extends Card {
  renderSubtitle() {
    return html`
      <div class="subtitle">
        ${this.card.type.typeName} ${this.card.subtitle && this.card.subtitle.length ? `- ${this.card.subtitle}` : ''}
      </div>
    `;
  }
    
  render() {
    return super.render();
  }

  renderAction() {
    return html`
        <e-side-quest-registration .id="${this.card.sideQuestId}" page="home"></e-side-quest-registration>
    `;
  }

  updated(changedProps) {
    if (changedProps.has('card')) {
      iconService.load(this.card.icon).then((icon) => (this.icon = icon));
    }
  }
}

window.customElements.define('e-card-side-quest', CardSideQuest);
