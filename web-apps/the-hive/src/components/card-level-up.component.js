import {LitElement, html} from 'lit';
import { material_card, material_button, material_icon_button } from '../styles';
import { formatDateTime } from '../services/format.service';
import { link } from './svg';
import levelUpService from '../services/level-up.service';
import iconService from '../services/icon.service';
import Card from './card.component';

class CardLevelUp extends Card {
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

  executeAction() {
    levelUpService.registerForLevelUp(this.card.levelUp.levelUpId)
  }

  updated(changedProps) {
    if (changedProps.has('card')) {
      iconService.load(this.card.icon).then((icon) => (this.icon = icon));
    }
  }
}

window.customElements.define('e-card-level-up', CardLevelUp);
