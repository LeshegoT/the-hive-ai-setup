import { html, fixture, expect } from '@open-wc/testing';

import '../../../src/components/title.component';

describe('Component - Title', () => {
  it('should initialise properly', async () => {
    let el = await fixture('<e-title name="wat"></e-title>');

    expect(el).to.be.ok;
  });

  it('should render properly', async () => {
    let name = "wat";
    let el = await fixture(html`
      <e-title .name=${name}></e-title>
    `);

    expect(el).shadowDom.to.equal(`
      <h3 class="title">
        <e-hex>
        </e-hex>
        <span class="name">
          <span>
            <em>
              wat
            </em>
          </span>
        </span>
      </h3>
    `);
  });
});
