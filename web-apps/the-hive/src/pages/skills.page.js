import { html } from 'lit';
import '../components/skill-form.component';
import '../components/user-skills.component';
import { animations, shared } from '../styles';
import { StatefulPage } from './stateful-page-view-element';
const styles = html`
  <style>
    ${shared()} ${animations()} :host {
      font-family: 'Inter';
    }
    #skills {
      background: var(--app-light-text-color);
      padding: var(--large-padding);
      margin: auto;
      box-shadow: var(--shadow);
      > * {
        padding: 0;
      }
    }
    .info {
      font-size: var(--font-size-tiny);
      font-weight: var(--medium-font-weight);
    }
    p {
      margin-block: var(--small-margin);
    }
    .subtext {
      font-size: var(--font-size-medium-small);
      font-weight: var(--light-font-weight);
    }
    h1 {
      font-size: var(--font-size-large);
      font-weight: var(--large-font-weight);
      margin: 0;
    }
  </style>
`;
class Skills extends StatefulPage {

  static properties = {
    editableAttribute: { type: Object }
  };

  constructor() {
    super();
    this.editableAttribute = undefined;
  }

  setEditableAttribute(event) {
    this.editableAttribute = event.detail;
  }

  cancelEdit() {
    this.editableAttribute = undefined;
  }

  render() {
    return html`
      ${styles}
      <div class="fade-in">
        <section class="fade-in">
          <section id="skills">
            <h1>Portfolio</h1>
            <p class="subtext">
              Build your portfolio below. We require you to add any skills, qualifications, certifications, industry knowledge or qualities that you have.
            </p>
            <p class="info">
              Your portfolio (CV) will be looked at in your annual review and for any suitable project opportunities that arise.
            </p>
             <p class="info">
              Use the input field below to add all of your information.
            </p>
            <e-skill-form @cancel-edit="${this.cancelEdit}" .editableAttribute="${this.editableAttribute}"></e-skill-form>
            <e-user-skills @edit-attribute="${this.setEditableAttribute}"></e-user-skills>
          </section>
        </section>
      </div>
    `;
  }
}
window.customElements.define('e-skills', Skills);
