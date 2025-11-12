import { html, fixture, expect } from '@open-wc/testing';
import '../../../src/components/message.component';
import { user_service_stubs } from '../shared/stubs/user.service.stub';
import { auth_service_stubs } from '../shared/stubs/auth.service.stub';
import { convertMarkdownToHtml_stub } from '../shared/stubs/markdown.service.stub';

describe('Component - Message', () => {
  let message = {
    messageId: 1,
    messageTypeId: 1,
    heroUserPrincipleName: 'test@bbd.co.za',
    createdByUserPrincipleName: 'test@bbd.co.za',
    creationDate: new Date(2019, 0, 1, 0, 0, 0, 0),
    text: 'This is a messge',
    mission: null,
    course: null,
    messageType: {
      selfDirected: false
    }
  };
  let me = true;
  let displayName = 'test';

  let hero = 'test@bbd.co.za';

  auth_service_stubs.uses_select_hero(hero);

  beforeEach(() => {
    user_service_stubs.getActiveDirectoryProfile.returns(
      Promise.resolve({
        displayName
      })
    );
    convertMarkdownToHtml_stub.returns('markdown');
  });

  afterEach(async () => {
    user_service_stubs.getActiveDirectoryProfile.reset();
    convertMarkdownToHtml_stub.reset();
  });

  it('should initialise properly.', async () => {
    let el = await fixture(
      html`
        <e-message .message="${message}"></e-message>
      `
    );

    expect(el).to.be.ok;
    expect(user_service_stubs.getActiveDirectoryProfile.called).to.be.ok;
    expect(el.message).to.deep.equal(message);
  });

  it('should display message from me', async () => {
    let el = await fixture(
      html`
        <e-message .message="${message}" .me="${me}"></e-message>
      `
    );

    expect(el).to.be.ok;
    expect(convertMarkdownToHtml_stub.called).to.be.ok;
    expect(el.message).to.deep.equal(message);
    expect(el.me).to.equal(true);
  });

  it('should display message from someone else', async () => {
    let el = await fixture(
      html`
        <e-message .message="${message}" .me="${false}"></e-message>
      `
    );

    expect(el).to.be.ok;
    expect(convertMarkdownToHtml_stub.called).to.be.ok;
    expect(el.message).to.deep.equal(message);
    expect(el.me).to.equal(false);
  });

  it('should set the display name.', async () => {
    let el = await fixture(
      html`
        <e-message .message="${message}" .me="${me}"></e-message>
      `
    );

    expect(user_service_stubs.getActiveDirectoryProfile.calledOnce).to.be.ok;
    expect(el.displayName).to.equal(displayName);
  });

  describe('Message Title', () => {
    it('should show mission name if mission', async () => {
      let mission_message = {
        ...message,
        missionId: 1
      };
      let el = await fixture(
        html`
          <e-message .message="${mission_message}" .me="${me}"></e-message>
        `
      );

      expect(el).to.be.ok;
      expect(el).shadowDom.to.equal(`
        <e-profile></e-profile>
        <div class="container">
          <span>${displayName}</span>
          <time>${message.creationDate.toLocaleString()}</time>
          <div></div>
          <e-mission-name size="small"></e-mission-name>
          <div class="message">
            markdown
          </div>
        </div>
      `);
    });

    it('should show course name if course', async () => {
      let course_message = {
        ...message,
        courseId: 1,
        code: 'cs'
      };
      let el = await fixture(
        html`
          <e-message .message="${course_message}" .me="${me}"></e-message>
        `
      );

      expect(el).to.be.ok;
      expect(el).shadowDom.to.equal(`
        <e-profile></e-profile>
        <div class="container">
          <span>${displayName}</span>
          <time>${message.creationDate.toLocaleString()}</time>
          <div></div>
          <a class="hex-group" href="/course/${course_message.code}">
            <e-hex-name size="small"></e-hex-name>
          </a>
          <div class="message">
            markdown
          </div>
        </div>
    `);
    });

    it('should show self directed name if self directed', async () => {
      let learning_message = {
        ...message,
        link: '#',
        messageTypeId: 1,
        selfDirected: 1
      };
      let el = await fixture(
        html`
          <e-message .message="${learning_message}" .me="${me}"></e-message>
        `
      );

      expect(el).to.be.ok;
      expect(el).shadowDom.to.equal(`
        <e-profile></e-profile>
        <div class="container">
          <span>${displayName}</span>
          <time>${message.creationDate.toLocaleString()}</time>
          <div></div>
          <a class="hex-group" target="_blank" href="#">
            <e-hex-name size="small"></e-hex-name>
          </a>
          <div class="message">
            markdown
          </div>
        </div>
    `);
    });
  });
});
