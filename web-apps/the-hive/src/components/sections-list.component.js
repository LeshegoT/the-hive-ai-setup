import { html, LitElement } from 'lit';
import { shared, lists } from '../styles';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';
import { selectCourse } from '../selectors/course.selectors';
import { checkbox } from './svg';

let styles = html`
  <style>
    ${shared()} ${lists()}
  </style>
`;

class SectionsList extends connect(store)(LitElement) {
  isComplete(section) {
    return section.userSectionId ? 'completed' : 'incomplete';
  }

  render() {
    if (!this.course) return html``;

    return html`
      ${styles}

      <e-title .name="${this.course.name}" .icon="${this.course.icon}"></e-title>

      <p>${this.course.description}</p>

      <ul>
        ${this.course.sections.map(
          (section) =>
            html`
              <li>
                <a href="/course/${this.course.code}/section/${section.code}">
                  <svg viewbox="0 0 52 52" class="${this.isComplete(section)}">
                    ${checkbox}
                  </svg>
                  <span>${section.name}</span>
                </a>
              </li>
            `
        )}
      </ul>
    `;
  }

  static get properties() {
    return {
      course: Object
    };
  }

  stateChanged(state) {
    this.course = selectCourse(state);
  }
}

window.customElements.define('e-sections-list', SectionsList);
