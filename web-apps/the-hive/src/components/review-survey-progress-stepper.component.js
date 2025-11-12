import { html } from 'lit';
import { StatefulElement } from './stateful-element';
import { reviewShared } from '../styles';

const styles = html`
  <style>
    ${reviewShared()} .circle {
      width: 2em;
      height: 2em;
      border-radius: 50%;
      border: 1.5px solid #b8c0cc;
      margin-left: 0.5em;
      margin-right: 0.5em;
      background: #e7eaee;
      color: var(--app-disabled-button-color);
      display: flex;
      flex-wrap: wrap;
      align-content: center;
      justify-content: center;
    }

    .currentCircle {
      width: 2em;
      height: 2em;
      border-radius: 50%;
      border: 1.5px solid var(--app-warning-font-color);
      margin-left: 0.5em;
      margin-right: 0.5em;
      background: #ffffff;
      color: var(--app-warning-font-color);
      display: flex;
      flex-wrap: wrap;
      align-content: center;
      justify-content: center;
    }

    .completedCircle {
      width: 2em;
      height: 2em;
      border-radius: 50%;
      background-image: url('../../images/icons/checkmark.svg');
      background-position: center;
      margin-left: 0.5em;
      margin-right: 0.5em;
      background-size: cover;
    }

    #allSections {
      display: flex;
      flex-direction: row;
    }

    .singleSection {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .sectionName {
      font-size: 10px;
      max-width: 5em;
      text-align: center;
      margin-top: 0.5em;
    }

    .line {
      border: 1px solid #b8c0cc;
      width: 3em;
      height: 0px;
      margin-top: 1em;
    }

    .redacted-line {
      border: 1px dashed #b8c0cc;
    }

    .linesAndCircles {
      display: flex;
      flex-direction: row;
    }

    @media only screen and (max-width: 650px) {
      .line {
        width: 2em;
      }
    }

    @media only screen and (max-width: 550px) {
      .circle {
        width: 1.6em;
        height: 1.6em;
      }

      .currentCircle {
        width: 1.6em;
        height: 1.6em;
      }

      .completedCircle {
        width: 1.5em;
        height: 1.5em;
      }

      .line {
        margin-top: 0.75em;
      }

      .sectionName {
        font-size: 8px;
      }
    }

    @media only screen and (max-width: 500px) {
      #allSections {
        overflow-x: scroll;
        max-width: 100%;
        padding: 1em;
      }
    }

  </style>
`;

export class ReviewSurveyProgressStepper extends StatefulElement {
  constructor() {
    super();
  }

  render() {
    if (this.shadowRoot.getElementById('allSections')) {
      let totalOffset = this.shadowRoot.getElementById('allSections').scrollWidth;
      let totalSections = this.sections.length;
      let currentSection = this.sections.findIndex((section) => section.name == this.currentSection.name);
      let offset = (totalOffset / totalSections) * currentSection;
      this.shadowRoot.getElementById('allSections').scrollLeft = offset;
    }
    this.isCompleted = true;
    let sectionsToRender = [];

    const redactionThresholdLength = 5;

    if (this.sections.length <= redactionThresholdLength) {
      sectionsToRender = this.sections.map((section, index) => ({ type: 'section', section, index }));
    } else {
      const currentIndex = this.sections.findIndex((section) => section.name === this.currentSection.name);
      const redactedStart = 2;
      const redactedEnd = this.sections.length - 3;
      const isCurrentRedacted = currentIndex >= redactedStart && currentIndex <= redactedEnd;

      for (let i = 0; i < redactedStart; i++) {
        sectionsToRender.push({ type: 'section', section: this.sections[i], index: i });
      }

      if (isCurrentRedacted) {
        sectionsToRender.push({ type: 'redacted-line' });
        sectionsToRender.push({ type: 'section', section: this.sections[currentIndex], index: currentIndex, suppressLine: true });
        sectionsToRender.push({ type: 'redacted-line' });
      } else {
        sectionsToRender.push({ type: 'redacted-line' });
      }

      for (let i = this.sections.length - 2; i < this.sections.length; i++) {
        const suppressLine = sectionsToRender.length > 0 && sectionsToRender[sectionsToRender.length - 1].type === 'redacted-line';
        sectionsToRender.push({
          type: 'section',
          section: this.sections[i],
          index: i,
          suppressLine
        });
      }
    }

    return html`
      ${styles}
      <section id="allSections">
        ${sectionsToRender.map((item) => {
          if (item.type === 'redacted-line') {
            return html`<section class="line redacted-line"></section>`;
          } else {
            return this.renderSection(item.section, item.index, item.suppressLine);
          }
        })}
      </section>
    `;
  }

  renderSection(section, index, suppressLine = false) {
    let circleClass;
    if (section.name.toLowerCase() == this.currentSection.name.toLowerCase()){
     circleClass = "currentCircle";
      this.isCompleted = false;
    }
    else if (this.isCompleted){
      circleClass = "completedCircle"}
    else {circleClass = "circle"}

    return html`
      <section class="linesAndCircles">
        ${!suppressLine && index !== 0
          ? html`<section class="line"></section>`
          : ''}
        <section class="singleSection">
          <section class='${circleClass} x-small-subtext-label'>${this.isCompleted? "" :index+1}</section>
          <label class="sectionName">${section.name}</label>
        </section>
      </section>
    `;
  }

  static get properties() {
    return {
      sections: Object,
      currentSection: Object,
      isCompleted: Boolean,
    };
  }
}

window.customElements.define('e-review-survey-progress-stepper', ReviewSurveyProgressStepper);
