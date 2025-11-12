import {LitElement, html} from 'lit';
import { shared } from '../styles';

const styles = html`
  <style>
    ${shared()} 
    :host{
      font-size:var(--font-size-medium-small);
      font-weight:var( --regular-font-weight);
      margin:0;
    }
    .checked {
      color: var(--primary-red-color);
    }
    .unchecked {
      color: var(--neutral-grey-color);
    }
    .checked,
    .unchecked {
      font-size: var(--font-size-medium-small);
      margin-right:var(--small-margin);
    }
    input[type='checkbox'] {
      position: absolute;
      opacity: 0;
      height: 0;
      width: 0;
    }
    input[type='checkbox']:disabled+label, input[type='checkbox']:disabled+label > span {
      color: #929292;
      pointer-events: none;
    }
    label {
      cursor: pointer;
    }
  </style>
`;
class CheckBox extends LitElement {
  static get properties() {
    return {
      name: { type: String },
      checked: { type: Boolean },
      label: { type: String },
      disabled: { type: Boolean }
    };
  }

  toggleChecked(e) {
    this.checked = e.target.checked;
    this.dispatchEvent(new CustomEvent('change', { detail: this.checked }));
  }

  render() {
    return html`
      <div>
        ${styles}
        <input
          type="checkbox"
          name="${this.name}"
          id="${this.name}"
          ?checked="${this.checked}"
          ?disabled="${this.disabled}"
          @change="${this.toggleChecked}"
        />

        <label for="${this.name}" class="inline-flex-items">
          ${this.checked
            ? html`
                <span class="material-icons checked">check_box</span>
              `
            : html`
                <span class="material-symbols-outlined unchecked">check_box_outline_blank</span>
              `}
          ${this.label}
        </label>
      </div>
    `;
  }
}

customElements.define('e-checkbox', CheckBox);
