import { html, fixture, expect } from '@open-wc/testing';
import { load_stub } from '../shared/stubs/icon.service.stub';

import '../../../src/components/hex.component';

describe('Component - Hex', () => {
  let icon = 'wat';

  it('should initialise properly.', async () => {
    let el = await fixture('<e-hex></e-hex>');

    expect(el).to.be.ok;
  });

  it('should set the icon properly.', async () => {
    let el = await fixture(html`
      <e-hex .icon=${icon}></e-hex>
    `);

    expect(el.icon).to.be.equal(icon);
    expect(load_stub.called).to.be.ok;
    expect(el.icon_svg).to.be.ok;
    expect(typeof el.icon_svg).to.be.equal('object');
  });
});
