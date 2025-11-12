import { html, fixture, expect } from '@open-wc/testing';
import { auth_service_stubs } from '../shared/stubs/auth.service.stub';
import { markQuestComplete, markQuestPaused, markQuestAbandoned } from '../shared/stubs/quest.service.stub';

describe('Page - change quest status', () => {

  auth_service_stubs.uses_select_hero('test@bbd.co.za');

  let state = {
    app: {
      routeData: [1]
    },
    referenceData: {
      questTypes: [1],
      specialisations: [1]
    },
    quests: {
      current:  {
        questId: 1,
        questType: 1
      }
    }
  }

  before(async () => {
    await import('../../../src/pages/change-quest-status.page');
  });

  it('should initialise properly', async () => {
    let el = await fixture(
      html`
        <e-change-quest-status></e-change-quest-status>
      `
    );
    expect(el).to.be.ok;
  });

  it('should handle complete status', async () => {
    let el = await fixture(
      html`
        <e-change-quest-status></e-change-quest-status>
      `
    );

    state.app.routeData[1] = 'complete';

    el.stateChanged(state);

    el.completeQuest();

    expect(el).to.be.ok;
    expect(markQuestComplete.called).to.be.ok;
  });

  it('should handle pause status', async () => {
    let el = await fixture(
      html`
        <e-change-quest-status status='pause'></e-change-quest-status>
      `
    );

    state.app.routeData[1] = 'pause';

    el.stateChanged(state);

    el.pauseQuest();

    expect(el).to.be.ok;
    expect(markQuestPaused.called).to.be.ok;
  });

  it('should handle abandon status', async () => {
    let el = await fixture(
      html`
        <e-change-quest-status status='abandon'></e-change-quest-status>
      `
    );

    state.app.routeData[1] = 'abandon';

    el.stateChanged(state);

    el.abandonQuest();

    expect(el).to.be.ok;
    expect(markQuestAbandoned.called).to.be.ok;
  });
});
