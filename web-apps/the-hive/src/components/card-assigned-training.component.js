import { html } from 'lit';
import iconService from '../services/icon.service';
import Card from './card.component';
import navigationService from '../services/navigation.service';

class CardAssignedTraining extends Card {
  renderSubtitle() {
    return html`
      <div class="subtitle">
        ${this.card.type.typeName}
        ${this.card.subtitle && this.card.subtitle.length
          ? `- ${this.card.subtitle}`
          : ''}
      </div>
    `;
  }

  executeAction() {
    let path = `/course/${this.card.course.code}/section/${this.card.course.nextSectionCode}`;
    navigationService.navigate(path)
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

window.customElements.define('e-card-assigned-training', CardAssignedTraining);
