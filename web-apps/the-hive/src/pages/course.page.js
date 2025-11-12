import { html } from 'lit';
import { shared, animations, lists } from '../styles';
import { selectCourse } from '../selectors/course.selectors.js';
import { StatefulPage } from './stateful-page-view-element.js';
import coursesService from '../services/courses.service';
import '../components/title.component';
import '../components/sub-title.component';
import '../components/hex.component';
import '../components/message-list.component';
import '../components/submit-message.component';
import '../components/sections-list.component';
import config_service from '../services/config.service';


const styles = html`
  <style>
    ${shared()} ${animations()} ${lists()}
  </style>
`;

class Course extends StatefulPage {
  render() {
    if (!this.course) return html``;   
    return html`
      ${styles}

      <section class="fade-in">
        <e-sections-list></e-sections-list>
      </section>

        ${config_service.config.SUBMIT_COMMENT_ENABLED
        ? html`
            <section>
              <e-sub-title text="Messages" icon="images/logos/messages.svg"></e-sub-title>
              <e-message-list .courseId="${this.course.courseId}"></e-message-list>
              <e-submit-message
                .course="${this.course}"
                rateContent="true"
                preventScrollToTop="true"
              ></e-submit-message>
            </section>
          `
        : null}
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
  
  updated(changedProperties){
    if (changedProperties.has('course') && changedProperties.get('course') && this.course) {
      coursesService.registerUserForCourse(this.course.courseId);
    } else {
      //Do nothing
    }
  }
}

window.customElements.define('e-course', Course);
