import { html } from 'lit';
import { navigateComponent } from '../actions/app.action';
import { selectMultiplier } from '../selectors/multiplier.selector';
import { selectMessageTypes } from '../selectors/reference-data.selectors';
import authService from '../services/auth.service';
import multiplierService from '../services/multiplier.service';
import questionService from '../services/question.service';
import sectionService from '../services/sections.service';
import { store } from '../store';
import { animations, shared } from '../styles';
import { StatefulPage } from './stateful-page-view-element';

import '../components/content.component';
import '../components/points-display.component';
import '../components/questions.component';
import '../components/title.component';
import '../components/youtube-content.component';

import {
  selectActivePrescribedCourses,
  selectAllCompletedCourses,
  selectCourse,
  selectNextSection,
  selectSection,
} from '../selectors/course.selectors.js';
import coursesService from '../services/courses.service';

import { selectUserSections } from '../selectors/sections.selector';

const styles = html`
  <style>
    ${shared()} ${animations()} .buttons {
      display: flex;
      justify-content: space-between;
      flex-direction: column-reverse;
    }

    button {
      margin-bottom: 1em;
    }

    button,
    a {
      font-size: 1em;
      text-align: center;
    }

    h4 {
      margin: -2em 0 0 5.2em;
    }
    h3 {
      text-align: center;
    }

    .points-div {
      float: left;
      height: 48px;
      padding: 0;
      display: block;
    }

    .points {
      position: absolute;
      color: var(--app-primary-color);
      font-weight: bold;
      font-size: 22px;
      text-align: center;
      margin: 0;
      padding: 0;
      top: 22%;
      transform: translateX(-100%);
    }

    #logo {
      margin-left: 5px;
      width: 30px;
      height: 48px;
      float: left;
    }

    #points-main {
      float: right;
      transform: translateY(-90px);
    }

    .container {
      background-color: #eee;
      margin-bottom: 1em;
      border-radius: 1em;
    }

    .external-content {
      margin-top: 0.5rem;
      padding-bottom: 0px;
    }

    .complete-course {
      margin-top: 0rem;
      padding-top: 0px;
    }

    @media (min-width: 460px) {
      .buttons {
        flex-direction: row;
      }

      button {
        margin-bottom: 0;
      }
    }
  </style>
`;

class Section extends StatefulPage {

  getHeight(){
    return (0.70*Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0));
  }

  renderExternalContent(){
    if( !this.section.externalRenderable) return html ``;

    return html`
      <h3>The content for this section of the course is provided externally and as such, may take a bit longer to load.</h3>
      <section class='external-content'>
        <iframe
          width=1600;
          height="${this.getHeight()}"
          src="${this.section.externalLink}" 
          frameborder="0"
        >
        </iframe>
        <p>The section's content is sourced from an <a href="${this.section.externalLink}" target="_blank" rel="noopener noreferrer">external site</a>.</p>
      </section>
    `
  }

  linkToExternalContent(){
    if( this.section.externalRenderable) return html ``;

    return html `
      <section>
        <p>The section's content is hosted externally and cannot be rendered on this site.</p>
        <p>Please view the content on the source site. <a class="button" href="${this.section.externalLink}" target="_blank" rel="noopener noreferrer">visit content source</a></p>
      </section>
    `;
  }

  renderMarkDownContent(){
    if(!this.section.pathToMarkdown) return html ``;
    return html`
      <e-content .pathToMarkdown="${this.section.pathToMarkdown}"></e-content>
    `;
  }

  renderNextButtonPlea(){
    if (!this.section.externalSection) return html ``;
    
    return html `
      <section class="complete-course">
        Please only click the ${this.nextSection ? 'next' : 'complete course'} button once you've completed the section provided by the external platform
      </section>
    `
  }
  renderYoutubeContent(){
    if (!this.section.youtubeContentKey) return html ``;
    
    return html `
      <section class="fade-in">
        <p>Please watch this video.</p>
        <e-youtube-content .youtubeKey="${this.section.youtubeContentKey}" ></e-youtube-content>
      </section>
    `;
  }
  renderSectionContent() {
    if (!this.section.externalSection) return html ``;
    
    return html`
      <h1>External Content</h1>
      <article>
       ${this.renderExternalContent()}
       ${this.linkToExternalContent()}
      </article>
    `;
  }
  renderQuestions() {
    if (!this.section.questions.length) return html``;

    return html`
      <e-questions
        .questions="${this.section.questions}"
        .done="${this.section.userSectionId}"
      ></e-questions>
    `;
  }

  markSectionAsUnRead(){
    if(this.section.userSectionId) {
      sectionService.unreadSection(this.section.sectionId);
    } 
  }

  async checkIfCoursePrescribed() {
    await coursesService.getPrescribedTraining();
    return this.prescribedCourses.some(
      (course) => course.courseId === this.course.courseId && course.dateCompleted === null
    );
  }

  renderButtons() {
    return html`
      <div class="buttons">
        <a class="button" href="/course/${this.course.code}" }">Back to course</a>
        ${this.section.userSectionId
          ? html`<a class="button" href="/course/${this.course.code}"  @click="${(e) => this.markSectionAsUnRead()}">Mark as unread</a>`
          :html ``
        }
        ${this.nextSection
          ? html`
              <button type="button" class="next primary" @click="${(e) => this.next()}">
                Next: ${this.nextSection.name}
              </button>
            `
          : html`
              <button type="button" class="next primary" @click="${(e) => this.finish()}">Complete course</button>
            `}
      </div>
    `;
  }

  checkIfSectionCompletedAlready(){
    return this.userSections.some((section) => section.sectionId === this.sectionId);
  }

  checkIfCourseCompletedAlready(){
    return this.userCourses.some((course) => course.courseId === this.course.courseId);
  }

  render() {
    if (!this.section) return html``;
    return html`
      ${styles}
      <section class="fade-in">
        <e-title .name="${this.section.name}" .icon="${this.course.icon}"></e-title>
        <h4>${this.course.name}</h4>

        ${this.renderSectionContent()} ${this.renderMarkDownContent()} ${this.renderYoutubeContent()}
        ${this.renderQuestions()} ${this.renderNextButtonPlea()}
        ${this.renderButtons()}
      </section>
    `;
  }

  static get properties() {
    return {
      course: Object,
      section: Object,
      nextSection: Object,
      sectionId: String,
      multiplier:Number,
      userSections:Object,
      userCourses: Object,
      prescribedCourses: Object,
    };
  }

  completeSectionAndNavigate(url) {
    if(!this.checkIfSectionCompletedAlready()){
      if (this.section.questions.length && !this.section.userSectionId) {
        if (!questionService.checkUserAnswers(this.section.questions)) {
          return;
        }
      }

      sectionService.completeSection(this.section.sectionId);

      sectionService.addTimeToSection(this.sectionId, this.startTime);
    }

    store.dispatch(navigateComponent(url));
  }

  next() {
    const url = `/course/${this.course.code}/section/${this.nextSection.code}`;
    this.completeSectionAndNavigate(url);
    this.startTime = new Date();
  }

  completeCourseAndNavigate(url) {
    if (this.section.questions.length && !this.section.userSectionId) {
      if (!questionService.checkUserAnswers(this.section.questions)) {
        return false;
      }
    }

    if (!this.checkIfSectionCompletedAlready()) {
      sectionService.addTimeToSection(this.sectionId, this.startTime);
      sectionService.completeSection(this.section.sectionId);
      
      coursesService.updateCompleteDate(this.course.courseId);
    }
    store.dispatch(navigateComponent(url));

    return true;
  }

  async finish() {
    const url = `/course/${this.course.code}`;
    // TODO: RE - this course completion code assumes all courses are prescribed
    // training!

    // The business logic for most of this function and related fucntions really 
    // should sit in the backend and should not rely so heavily on the app

    const completed = this.completeCourseAndNavigate(url);

    if (!this.checkIfCourseCompletedAlready() && completed){
      //mark course as completed.
      const isCoursePrescribed = await this.checkIfCoursePrescribed();
      if (isCoursePrescribed){
        coursesService.completePrescribedTraining(this.course.courseId);
      } else{
        // Do nothing, since user will be navigated back to track section page/view through completeCourseAndNavigation function.
      }
    }
  }

  firstUpdated(){
    const userPrincipleName = authService.getUserPrincipleName();
    multiplierService.getMultiplier();
    coursesService.getCompletedCourses(userPrincipleName);
  }

  stateChanged(state) {
    super.stateChanged(state);
    this.course = selectCourse(state);
    this.section = selectSection(state);
    this.nextSection = selectNextSection(state);
    this.multiplier = selectMultiplier(state);
    this.userSections = selectUserSections(state);
    this.userCourses = selectAllCompletedCourses(state);
    this.messageTypes = selectMessageTypes(state);
    this.prescribedCourses = selectActivePrescribedCourses(state);

    if (this.section) this.sectionId = this.section.sectionId;
  }

  connectedCallback() {
    super.connectedCallback();
    this.startTime = new Date();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    sectionService.addTimeToSection(this.sectionId, this.startTime);
  }
}

window.customElements.define('e-section', Section);
