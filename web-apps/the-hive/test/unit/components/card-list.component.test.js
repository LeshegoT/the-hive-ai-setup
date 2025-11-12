import { html, fixture, expect } from '@open-wc/testing';
import '../../../src/components/card-list.component';

describe('Component - Card list', () => {
  it('should initialise properly.', async () => {
    let el = await fixture(html`<e-card-list></e-card-list>`);

    expect(el).to.be.ok;
  });
});
