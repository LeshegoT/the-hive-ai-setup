import { html, fixture, expect } from '@open-wc/testing';
import { fetch_hero_quests_stub } from '../shared/stubs/quest.service.stub';

describe('Page - Quest History', () => {
  before(async () => {
    await import('../../../src/pages/quest-history.page');
  });

  it('should initialise properly', async () => {
    let el = await fixture(
      html`
        <e-quest-history></e-quest-history>
      `
    );
    expect(el).to.be.ok;
    expect(fetch_hero_quests_stub.called).to.be.ok;
  });

  it('should show quests properly and open accordion', async () => {
    let state = {
      referenceData: {
        missionTypes: []
      },
      quests: {
        all: [
          {missions: []},
          {missions: [], guideUserPrincipleName: 'guide@bbd.co.za'}
        ]
      },
      courses: {
        all: [
          {sectionIds: [1]}
        ]
      },
      sections: {
        all: [
          {sectionId: 1}
        ],
        user: [
          {sectionId: 1}
        ]
      },
      questions: { all: [] }
    }

    let el = await fixture(
      html`
        <e-quest-history></e-quest-history>
      `
    );

    el.stateChanged(state);

    let event = {
      target: {
        classList: {
          toggle: function() {}
        },
        nextElementSibling: {
          style: {
            padding: 1
          }
        },
        firstElementChild: {
          innerHTML: 'test'
        }
      }
    };
    el.toggleAccordion(event);
    event.target.nextElementSibling.style.maxHeight = 1;
    el.toggleAccordion(event);

    expect(el).to.be.ok;
  });
});