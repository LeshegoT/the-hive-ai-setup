import { html } from 'lit';
import { shared, hex, link } from '../styles';
import { StatefulElement } from './stateful-element.js';

import './hex-name.component';

const styles = html`
  <style>
    ${shared()} ${hex()} ${link()}
  </style>
`;

class CourseSummaryGroup extends StatefulElement {
  render() {
    return html`
      ${styles}
      ${this.courses
        .filter(
          (course) =>
            !course.totalSections || course.completedSections !== course.totalSections
        )
        .map(
          (course, index) => html`
            <a class="hex-group" href="/course/${course.code}">
              <e-hex-name
                .icon="${course.icon}"
                .name="${course.name}"
                .index="${index}"
              ></e-hex-name>
            </a>
          `
        )}
    `;
  }

  static get properties() {
    return {
      group: String,
      courses: Array
    };
  }
}

window.customElements.define('e-course-summary-group', CourseSummaryGroup);
