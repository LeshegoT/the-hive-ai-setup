import { html, fixture, expect } from '@open-wc/testing';
import { fetch_level_ups_stub } from '../shared/stubs/level-up.service.stub';
import { convertMarkdownToHtml_stub } from '../shared/stubs/markdown.service.stub';

describe('Page - Level Up Details', () => {
  before(async () => {
    await import('../../../src/pages/level-up-details.page');
  });

  after(() => {
    fetch_level_ups_stub.reset();
  });

  beforeEach(() => {
    convertMarkdownToHtml_stub.returns('markdown');
  });

  afterEach(async () => {
    convertMarkdownToHtml_stub.reset();
  });

  it('should initialise properly', async () => {
    let el = await fixture(
      html`
        <e-level-up-details></e-level-up-details>
      `
    );
    expect(el).to.be.ok;
    expect(fetch_level_ups_stub.called).to.be.ok;
  });

  it('should load level-up correctly', async () => {
    let el = await fixture(
      html`
        <e-level-up-details></e-level-up-details>
      `
    );

    el.stateChanged({
      app: { routeData: [1] },
      levelUps: {
        all: [{ levelUpId: 1 }, { levelUpId: 2 }],
        user: []
      },
      levelUpActivities: { all: [] },
      referenceData: { levelUpActivityTypes: [] },
      courses: { all: [] },
      sections: { all: [], user: [] },
      levelUpUsers: {all: []},
      questions: { all: [] }
    });

    expect(el.levelUp).to.be.ok;
  });

  it('should load level-up description correctly', async () => {
    let el = await fixture(
      html`
        <e-level-up-details></e-level-up-details>
      `
    );

    el.stateChanged({
      app: { routeData: [1] },
      levelUps: {
        all: [{ levelUpId: 1 }, { levelUpId: 2 }],
        user: []
      },
      levelUpActivities: { all: [] },
      referenceData: { levelUpActivityTypes: [] },
      courses: { all: [] },
      sections: { all: [], user: [] },
      levelUpUsers: {all: []},
      questions: { all: [] }
    });

    expect(el.levelUp).to.be.ok;

    el.updated();

    expect(convertMarkdownToHtml_stub.called).to.be.ok;
    expect(el.description).to.equal('markdown');
  });
});
