import { html, fixture, expect } from '@open-wc/testing';
import { formatDate } from '../../../src/services/format.service.js';
import '../../../src/components/side-quest-name.component';

describe('Component - Side Quest Name', () => {
    let sideQuest = {
        id: '1',
        name: 'name',
        icon: 'icon',
        startDate: new Date()
    }
    let index = 1;
    let size = 'large';

    it('should initialise properly.', async () => {
        let el = await fixture(
            html`
                <e-side-quest-name .sideQuest=${sideQuest} .index=${index} .size=${size}></e-side-quest-name>
            `
        );

        expect(el).to.be.ok;
    });

    it('should render properly.', async () => {
        let el = await fixture(
            html`
                <e-side-quest-name .sideQuest=${sideQuest} .index=${index} .size=${size}></e-side-quest-name>
            `
        );

        expect(el).to.be.ok;
        expect(el).shadowDom.to.equal(`
        <a class="side-quest-link large" href="/side-quest/${index}">
        <e-hex>
        </e-hex>
        <span class="name odd-name">
        <b>${formatDate(sideQuest.startDate)}</b>
        : name
        </span>
        </a>
        `);
    });
});
