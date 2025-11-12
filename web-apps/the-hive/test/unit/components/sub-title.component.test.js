import { html, fixture, expect } from '@open-wc/testing';

import '../../../src/components/sub-title.component';

describe('Component - Sub-title', () => {
  it('should initialise properly', async () => {
    let el = await fixture('<e-sub-title></e-sub-title>');

    expect(el).to.be.ok;
  });

  it('should render properly', async () => {
    let text = "wat";
    let el = await fixture(html`
      <e-sub-title .text=${text}></e-sub-title>
    `);

    expect(el).shadowDom.to.equal(`
      <e-hex></e-hex>
      <span class="text">wat</span>
    `);
  });
});
