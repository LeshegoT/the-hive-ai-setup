import { html, fixture, expect } from '@open-wc/testing';
import { load_stub } from '../shared/stubs/icon.service.stub';

import '../../../src/components/card-points-summary.component';

describe('Component - Points Summary Card', () => {
  
  it('should initialise properly.', async () => {
    let card = {
      title: 'Title'
    };

    let el = await fixture(
      html`
        <e-card-points-summary .card="${card}"></e-card-points-summary>
      `
    );

    expect(el).to.be.ok;
  });

  it('should set the icon properly.', async () => {
    let icon = 'zomg';

    let card = {
      title: 'Title',
      icon
    };

    let el = await fixture(html`
      <e-card-points-summary .card="${card}"></e-card-points-summary>
    `);

    expect(load_stub.calledWith(icon)).to.be.ok;
    expect(el.icon).to.be.ok;
    expect(typeof el.icon).to.be.equal('object');
  });
});
