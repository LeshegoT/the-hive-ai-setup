import { html, fixture, expect } from '@open-wc/testing';
import { load_stub } from '../shared/stubs/icon.service.stub';

import '../../../src/components/card-assigned-training.component';

describe('Component - Assigned Training Card', () => {
  
  it('should initialise properly.', async () => {
    let card = {
      title: 'Title',
      type: {
        typeCode: 'test',
        typeName: 'Test'
      }
    };

    let el = await fixture(
      html`
        <e-card-assigned-training .card="${card}"></e-card-assigned-training>
      `
    );

    expect(el).to.be.ok;
  });

  it('should set the icon properly.', async () => {
    let icon = 'zomg';

    let card = {
      title: 'Title',
      type: {
        typeCode: 'test',
        typeName: 'Test'
      },
      icon
    };

    let el = await fixture(html`
      <e-card-assigned-training .card="${card}"></e-card-assigned-training>
    `);

    expect(load_stub.calledWith(icon)).to.be.ok;
    expect(el.icon).to.be.ok;
    expect(typeof el.icon).to.be.equal('object');
  });
});
