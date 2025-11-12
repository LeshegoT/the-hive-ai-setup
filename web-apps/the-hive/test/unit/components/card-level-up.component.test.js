import { html, fixture, expect } from '@open-wc/testing';
import { load_stub } from '../shared/stubs/icon.service.stub';

import '../../../src/components/card-level-up.component';

describe('Component - Level Up Card', () => {
  
  it('should initialise properly.', async () => {
    let card = {
      title: 'Title',
      type: {
        typeCode: 'levelUp',
        typeName: 'Level Up'
      }
    };

    let el = await fixture(
      html`
        <e-card-level-up .card="${card}"></e-card-level-up>
      `
    );

    expect(el).to.be.ok;
  });

  it('should set the icon properly.', async () => {
    let icon = 'zomg';

    let card = {
      title: 'Title',
      type: {
        typeCode: 'levelUp',
        typeName: 'Level Up'
      },
      icon
    };

    let el = await fixture(html`
      <e-card-level-up .card="${card}"></e-card-level-up>
    `);

    expect(load_stub.calledWith(icon)).to.be.ok;
    expect(el.icon).to.be.ok;
    expect(typeof el.icon).to.be.equal('object');
  });
});
