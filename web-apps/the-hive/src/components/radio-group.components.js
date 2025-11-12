import {LitElement, html} from 'lit';
import './info-icon.component';
import { shared } from '../styles';

const styles = html`
  <style>
    ${shared()} .radio-group {
      display: flex;
      flex-wrap:wrap;
      font-size: var(--font-size-medium-small);
      gap: var(--medium-grid-gap);
    }
    .checked ,.error-state {
      color: var(--primary-red-color);
    }
    .unchecked {
      color: var(--neutral-grey-color);
    }
    .radio-button  {
      font-weight: var(--regular-font-weight);
      font-size: var(--font-size-large);
    }
    input[type='radio'] {
      display: none;
    }
    label,
    .inline-flex-items {
      gap: var(--medium-gap);
    }
    h3 {
      font-size: var(--font-size-medium-small);
      font-weight: var(--regular-font-weight);
      margin: 0;
      &.error-state{
        color:var(--primary-red-color)
      }
    }
    ul {
      width: fit-content;
      font-size: var(--font-size-tiny);
      font-weight: var(--light-font-weight);
      padding-inline: var(--large-padding);
      margin-block: 0;
    }
  </style>
`;

class RadioGroup extends LitElement {
  static get properties() {
    return {
      name: { type: String },
      label: { type: String },
      checked: { type: String },
      error: { type: String },
      options: { type: Array },
      required: { type: Boolean },
      optionsDescriptions: { type: Array },
    };
  }

  toggleChecked(value) {
    this.checked = value;
    this.error = '';
    this.dispatchEvent(new CustomEvent('change', { detail: value }));
  }

  handleErrors() {
    if (!this.checked && this.required) {
      this.error = 'Please select an option';
    } else {
      this.error = '';
    }
    this.requestUpdate();
  }
  getClassName(option) {
    if (this.error) {
      return 'error-state';
    } else if (this.checked === option) {
      return 'checked';
    } else {
      return 'unchecked';
    }
  }

  findOptionDescription(option) {
    const a = this.optionsDescriptions.find((el) => el.option === option);
    return a ? a.descriptions : [];
  }

  render() {
    return html`
      <h3 class ="${this.error?'error-state':''}">${this.label}</h3>
      <div class="radio-group">
        ${styles}
        ${this.options.map((option, index) => {
          const id = `${this.name}-${index}`;
          return html`
          <div class="inline-flex-items">
            <input
              type="radio"
              id="${id}"
              name="${this.name}"
              value="${option}"
              ?required="${this.required}"
              ?checked="${this.checked === option}"
              @change="${() => this.toggleChecked(option)}"
            />
            <label for="${id}" class="inline-flex-items" @click="${() => this.toggleChecked(option)}">
              <span class="${this.getClassName(option)} material-icons radio-button ">
                ${this.checked === option ? 'radio_button_checked' : 'radio_button_unchecked'}
              </span>
              ${option}
            </label>
             ${this.optionsDescriptions
                ? html`
                    <e-info infoTitle="${option}" infoMessage="">
                      <ul slot="description">
                        ${this.findOptionDescription(option).map((description) => {
                          return html`
                            <li>${description}</li>
                          `;
                        })}
                      </ul>
                    </e-info>
                  `
                : html``}
            </div>
          `;
        })}
      </div>
      <p class="error-message radio-groups">${this.error}</p>
    `;
  }
}

customElements.define('e-radio-group', RadioGroup);
