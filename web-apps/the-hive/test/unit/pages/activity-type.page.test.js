import { html, fixture, expect } from '@open-wc/testing';
import { convertMarkdownToHtml_stub } from '../shared/stubs/markdown.service.stub';
import '../../../src/pages/activity-type.page';

describe('Page - Activity Type', () => {
  beforeEach(() => {
    convertMarkdownToHtml_stub.returns('markdown');
  });

  afterEach(async () => {
    convertMarkdownToHtml_stub.reset();
  });

  it('should initialise properly', async () => {
    let el = await fixture(
      html`
        <e-activity-type></e-activity-type>
      `
    );
    expect(el).to.be.ok;
  });

  it('should load level-up description correctly', async () => {
    let el = await fixture(
      html`
        <e-activity-type></e-activity-type>
      `
    );

    el.stateChanged({
      app: { routeData: ['1'] },
      referenceData: {
        levelUpActivityTypes: [{ levelUpActivityTypeId: 1, code: '1' }, { levelUpActivityTypeId: 2, code: '2' }]
      }
    });

    expect(el.activityType).to.be.ok;

    el.updated();

    expect(convertMarkdownToHtml_stub.called).to.be.ok;
    expect(el.description).to.equal('markdown');
  });
});
