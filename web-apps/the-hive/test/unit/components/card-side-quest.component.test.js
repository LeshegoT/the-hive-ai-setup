import { html, fixture, expect } from '@open-wc/testing';
import { load_stub } from '../shared/stubs/icon.service.stub';

import '../../../src/components/card-side-quest.component';

describe('Component - Side Quest Card', () => {

    it('should initialize properly', async () => {
        let card = {
            title: 'Title',
            type: {
                typeCode: 'sideQuest',
                typeName: 'Side Quest'
            }
        }

        let el = await fixture(html`
            <e-card-side-quest .card="${card}"></e-card-side-quest >
        `);

        expect(el).to.be.ok;
    });

    it('should set the icon properly.', async () => {
        let icon = 'zomg';

        let card = {
            title: 'Title',
            type: {
                    typeCode: 'sideQuest',
                    typeName: 'Side Quest'
                },
            icon,
        };

        let el = await fixture(html`
          <e-card-side-quest .card="${card}"></e-card-side-quest>
        `);

        expect(load_stub.calledWith(icon)).to.be.ok;
        expect(el.icon).to.be.ok;
        expect(typeof el.icon).to.be.equal('object');
    });
});