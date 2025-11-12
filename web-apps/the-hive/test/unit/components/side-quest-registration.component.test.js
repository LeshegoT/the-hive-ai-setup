import { html, fixture, expect } from '@open-wc/testing';
import '../../../src/components/side-quest-registration.component';

describe('Component - Side Quest Registration', () => {

    it('should initialize properly', async () => {
        let el = await fixture(html`
            <e-side-quest-registration></e-side-quest-registration>
        `);

        expect(el).to.be.ok;
    });
    
    it('should return empty registration if there is no side quest', async () => {
        let state = {};

        let el = await fixture(html`
            <e-side-quest-registration></e-side-quest-registration>
        `);

        el.id = 1;
        el.stateChanged(state);

        expect(el).to.be.ok;
        expect(el.render()).to.deep.equal(html``);
        expect(el.renderRegistration()).to.deep.equal(html``);
    });

    it('should not return empty if there is a side quest', async () => {

        let el = await fixture(html`
          <e-side-quest-registration></e-side-quest-registration>
        `);

        el.id = 2;
        el.sideQuest = { sideQuestId: 2, dateCompleted: new Date() };

        expect(el).to.be.ok;
        expect(el.render()).to.not.deep.equal(html``);
        expect(el.renderRegistration()).to.not.deep.equal(html``);
    });

    it('should return an external link if the side quest is an external event', async () => {
      let el = await fixture(html`
        <e-side-quest-registration></e-side-quest-registration>
      `);

      el.id = 2;
      el.sideQuest = { sideQuestId: 2, dateCompleted: new Date(), externalEvent:true, link:'somelink.com' };

      expect(el).to.be.ok;

      expect(el.renderRegistration()).to.deep.equal(
        html`
        <a class="button" target="_blank" .href="${el.sideQuest.link}"> Go Register</a>
      `);
    });

    it('should return completed if the user has completed the side quest', async () => {
      let el = await fixture(html`
        <e-side-quest-registration></e-side-quest-registration>
      `);

      el.id = 2;
      el.sideQuest = { sideQuestId: 2, dateCompleted: new Date(), hasAttended: true};

      expect(el).to.be.ok;
      expect(el.renderRegistration()).to.deep.equal(
        html`
        <i>Completed</i><br />
      `);
    });

    it('should return missed if the side quest is over', async () => {
      let el = await fixture(html`
        <e-side-quest-registration></e-side-quest-registration>
      `);

      el.id = 2;
      el.sideQuest = { sideQuestId: 2, startDate: new Date('2019-02-02') };

      expect(el).to.be.ok;
      expect(el.renderRegistration()).to.deep.equal(
        html`
        <i>Missed</i><br />
      `);
    });
});