import '../shared/stubs/globals';
import { html, fixture, expect } from '@open-wc/testing';
import { getSideQuests } from '../shared/stubs/side-quests.service.stub';

describe('Page - Side Quests', () => {
  before(async () => {
    await import('../../../src/pages/side-quests.page');
  });

  beforeEach(async () => getSideQuests());
  afterEach(async () => getSideQuests.reset());

  it('should initialise properly.', async () => {
    let el = await fixture(
      html`
        <e-side-quests></e-side-quests>
      `
    );

    expect(el).to.be.ok;
    expect(el.sideQuests).to.be.undefined;
  });

  it('should render no quests properly.', async () => {
    let el = await fixture(
      html`
        <e-side-quests .sideQuests=${[{}]}></e-side-quests>
      `
    );

    expect(el).shadowDom.to.equal(`
        <div class="fade-in">
        <section class="fade-in">
          <e-title
            class="title"
            icon="images/logos/side-quest.svg"
            name="Side Quests"
          >
          </e-title>
          <div class="fade-in">
            <h1>
              Oops! No available side quests.
            </h1>
            <p>
            It appears we currently don't have any upcoming side quests on record. Keep a
        constant look out on this page for side quests. They'll appear here as soon as
        they are confirmed. Contact ATC on atcteam@bbd.co.za if you think this is a
        mistake.
            </p>
            <p>
              Head back
              <a href="/">
                home
              </a>
              to work on more of your missions.
            </p>
          </div>
        </section>
      </div>
        `, { ignoreTags: ['section'] });
  });

  it('should render quests properly.', async () => {
    let sideQuests = [
      {
        id: '1',
        icon: 'icon',
        name: 'name',
        hasAttended: false,
        hasRSVPed: false,
        userSideQuest: undefined,
        startDate: new Date(Date.now() * 2)
      }
    ];

    let state = {
      app: {},
      sideQuests: { all: sideQuests, user: sideQuests },
      referenceData: { sideQuestTypes: [] }
    };

    let el = await fixture(
      html`
        <e-side-quests></e-side-quests>
      `
    );

    el.stateChanged(state);

    expect(el).dom.to.equal(`<e-side-quests></e-side-quests>`);
  });

  it('should call getSideQuests', async () => {
    let el = await fixture(
      html`
        <e-side-quests .sideQuests=${[{}]}></e-side-quests>
      `
    );

    expect(el).to.be.ok;
    expect(getSideQuests.called).to.be.ok;
  });
});
