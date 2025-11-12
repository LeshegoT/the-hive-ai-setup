import { html, fixture, expect } from '@open-wc/testing';
import { auth_service_stubs } from '../shared/stubs/auth.service.stub';
import { resolve_quest_notifications } from '../shared/stubs/notification.service.stub';

describe('Page - Guide Feedack Page', () => {

  auth_service_stubs.uses_select_hero('test@bbd.co.za');

  before(async () => {
    await import('../../../src/pages/guide-feedback.page');
  });

  it('should initialise properly', async () => {
    let el = await fixture(
      html`
        <e-guide-feedback></e-guide-feedback>
      `
    );
    el.quest = {};

    expect(el).to.be.ok;
  });

  it('should resolve notifications when feedback is sent', async () => {
    let el = await fixture(
      html`
        <e-guide-feedback></e-guide-feedback>
      `
    );
    el.quest = {};

    el.sendFeedback();

    expect(el).to.be.ok;
    expect(resolve_quest_notifications.called).to.be.ok;
  });

  it('should drop out of sendFeedback when there is a active promise', async () => {
    let el = await fixture(
      html`
        <e-guide-feedback></e-guide-feedback>
      `
    );
    el.quest = {};
    el.activePromise = {};
    el.sendFeedback();

    expect(el).to.be.ok;
    expect(resolve_quest_notifications.notCalled).to.not.be.ok;
  });
});