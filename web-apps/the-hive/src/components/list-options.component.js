import {LitElement, html} from 'lit';
import { shared } from '../styles';

const styles = html`
  <style>
    ${shared()} :host {
      --scrollbar-width: 0.3125em;
      --list-max-height: 12em;
    }
    ul {
      background: var(--app-light-text-color);
      list-style-type: none;
      margin: 0;
      padding: 0;
      border-radius: var(--small-radius);
      max-height: var(--list-max-height);
      overflow-y: auto;
      overflow-x: hidden;
      box-shadow: var(--shadow);
    }
    ::-webkit-scrollbar {
      width: var(--scrollbar-width);
    }
    ::-webkit-scrollbar-thumb {
      background: var(--secondary-blue-color);
      border-radius: var(--small-radius);
    }
    li,
    ::slotted(li) {
      padding: var(--standard-padding);
      font-size: var(--font-size-medium-small);
      font-weight: var(--light-font-weight);
      width: 100%;
    }
    li:hover,
    li:focus,
    ::slotted(li:hover),
    ::slotted(li:focus) {
      background: var(--neutral-light-grey-color);
      cursor: pointer;
      outline: none;
    }
    li[selected],
    ::slotted(li[selected]) {
      background: var(--neutral-light-grey-color);
    }
    span{
      padding-inline:var(--small-padding);
    }
  </style>
`;
class ListOptions extends LitElement {
  static get properties() {
    return {
      options: { type: Array },
      displayField: { type: String },
      selected: { type: Object },
      hoveredOption: { type: Object },
    };
  }

  updated() {
    this.scrollToSelected();
  }

  scrollToSelected() {
    const selectedOption = this.shadowRoot.querySelector('li[selected]');
    if (selectedOption) {
      selectedOption.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  handleSelectOption(option) {
    this.dispatchEvent(new CustomEvent('selected', { detail: option }));
    this.selected = option;
    this.hoveredOption = undefined;
  }

  getAllListItems() {
    const shadowItems = Array.from(this.shadowRoot.querySelectorAll('li'));
    const slot = this.shadowRoot.querySelector('slot');
    const slottedItems = slot ? slot.assignedNodes({ flatten: true }).filter(node => node.nodeType === Node.ELEMENT_NODE) : [];
    return shadowItems.concat(slottedItems);
  }

  handleKeyDown(event) {
    const allItems = this.getAllListItems();
    const currentIndex = allItems.indexOf(this.shadowRoot.activeElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % allItems.length;
      allItems[nextIndex].focus();
      this.hoveredOption = this.options.find(option => option=== allItems[nextIndex].textContent.trim());
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIndex = (currentIndex - 1 + allItems.length) % allItems.length;
      allItems[prevIndex].focus();
      this.hoveredOption = this.options.find(option => option === allItems[prevIndex].textContent.trim());
    } else if (event.key === 'Enter' && this.hoveredOption) {
      this.handleSelectOption(this.hoveredOption);
    }
  }

  handleMouseEnter(option, event) {
    this.hoveredOption = option;
    event.currentTarget.focus();
  }

  handleMouseLeave(event) {
    this.hoveredOption = undefined;
    event.currentTarget.blur();
  }

  formatDisplayOption(option) {
    if (option?.styledListItems && option.name) {
      return html`
        <span>${option.name}</span>
        ${option.styledListItems.map((text) => html` <span part="${text.class}">${text.name}</span> `)}
      `;
    } else {
      return option;
    }
  }

  render() {
    return html`
      <style>
        ${styles}
      </style>
      <ul tabindex="0" @keydown="${this.handleKeyDown}">
        ${this.options.map(
          (option) => html`
            <li
              @click="${() => this.handleSelectOption(option)}"
              @mouseenter="${(e) => this.handleMouseEnter(option, e)}"
              @mouseleave="${(e) => this.handleMouseLeave(e)}"
              ?selected="${option === this.selected || option === this.hoveredOption}"
              tabindex="0"
            >
              ${this.formatDisplayOption(option)}
            </li>
          `
        )}
        <slot></slot>
      </ul>
    `;
  }
}

customElements.define('e-list-option', ListOptions);
