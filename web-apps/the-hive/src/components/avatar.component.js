import {LitElement, html} from 'lit';
import avatarDrawingService from '../services/avatar-drawing.service';

class Avatar extends LitElement {
  render() {
    return html`
      ${this.avatar}
    `;
  }

  static get properties() {
    return {
      avatar: Object,
      body: Object,
      parts: Array
    };
  }

  updated(changedProps) {
    if (!this.body || !this.body.level) return;

    if (changedProps.has('body') || changedProps.has('parts')) {
      avatarDrawingService.getAvatar(this.body, this.parts).then((avatar) => (this.avatar = avatar));
    }
  }
}

window.customElements.define('e-avatar', Avatar);
