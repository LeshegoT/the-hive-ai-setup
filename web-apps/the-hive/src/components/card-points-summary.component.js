import { html, LitElement } from 'lit';
import { material_card, material_button, material_icon_button } from '../styles';
import { link } from './svg';
import iconService from '../services/icon.service';
import Card from './card.component';

class CardPointsSummary extends Card {
  renderSubtitle() {
    return html ` 
      <div class="subtitle">
        ${this.card.subtitle}
      </div>

      <br>
    `;
  }
  
  render() {
    return super.render();
  }

  updated(changedProps) {
    if (changedProps.has('card')) {
      iconService.load(this.card.icon).then((icon) => (this.icon = icon));
    }
  }
}

window.customElements.define('e-card-points-summary', CardPointsSummary);
