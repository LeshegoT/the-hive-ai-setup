import { html, fixture, expect } from '@open-wc/testing';

import '../../../src/components/hex-name.component';

describe('Component - Hex Name', () => {
  it('should initialise properly', async () => {
    let el = await fixture('<e-hex-name name="wat"></e-hex-name>');

    expect(el).to.be.ok;
  });

  it('should render properly for odd name', async () => {
    let name = 'wat';
    let el = await fixture(html`
      <e-hex-name .name=${name} done="done" size="small" index="1"></e-hex-name>
    `);

    expect(el).shadowDom.to.equal(`
      <span class="hex-name small done">
        <e-hex></e-hex>
        <span class="name odd-name">
          wat
        </span>
      </span>
    `);
  });

  it('should render properly for even name', async () => {
    let name = 'wat';
    let el = await fixture(html`
      <e-hex-name .name=${name} done="done" size="small" index="2"></e-hex-name>
    `);

    expect(el).shadowDom.to.equal(`
      <span class="hex-name small done">
        <e-hex></e-hex>
        <span class="name">
          wat
        </span>
      </span>
    `);
  });
});
