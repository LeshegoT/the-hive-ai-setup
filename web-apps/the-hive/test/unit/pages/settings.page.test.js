import { html, fixture, expect } from '@open-wc/testing';
import '../../../src/pages/settings.page';
import '../shared/stubs/globals';

describe('Page - Settings', () => {
  it('should initialise properly.', async () => {
    let el = await fixture(
      html`
        <e-settings></e-settings>
      `
    );
    expect(el).to.be.ok;
  });

  it('should change settings and save properly.', async () => {
    let el = await fixture(
      html`
        <e-settings></e-settings>
      `
    );

    el.changeSettings(1, 0);

    el.save();

    expect(el.settingsHaveChanged).to.equal(false);
  });

  it('should toggle cells and save properly.', async () => {
    let el = await fixture(
      html`
        <e-settings></e-settings>
      `
    );

    el.toggleCell(3, 4);

    el.save();

    expect(el.settingsHaveChanged).to.equal(false);
  });

  it('should render in mobile view properly.', async () => {
    window.innerWidth = 500; // Set window width to simulate mobile view

    let el = await fixture(
      html`
        <e-settings></e-settings>
      `
    );

    const table = el.shadowRoot.querySelector('table');
    const accordion = el.shadowRoot.querySelector('.accordion');

    expect(table).to.be.null;
    expect(accordion).to.be.null;

    window.innerWidth = 1024;
  });

  it('should toggle cells and mark settings as changed', async () => {
    const el = await fixture(
      html`
        <e-settings></e-settings>
      `
    );
    el.toggleCell(1, 2);
    expect(el.settingsHaveChanged).to.equal(true);
  });

  it('should save settings and reset changes flag', async () => {
    const el = await fixture(
      html`
        <e-settings></e-settings>
      `
    );
    el.changeSettings(1, 'someValue');
    el.save();
    expect(el.settingsHaveChanged).to.equal(false);
  });

  it('should render accordion section properly', async () => {
    const el = await fixture(
      html`
        <e-settings></e-settings>
      `
    );

    el.tableData = [
      {
        officeId: 1,
        officeName: 'International',
        eventCategoryId: 2,
        eventCategory: 'HR',
        selected: false,
      },
      {
        officeId: 1,
        officeName: 'International',
        eventCategoryId: 3,
        eventCategory: 'Lunch',
        selected: false,
      },
      {
        officeId: 2,
        officeName: 'Johannesburg',
        eventCategoryId: 5,
        eventCategory: 'Social Event',
        selected: false,
      },
      {
        officeId: 2,
        officeName: 'Johannesburg',
        eventCategoryId: 6,
        eventCategory: 'Company Event',
        selected: false,
      },
      {
        officeId: 5,
        officeName: 'Pretoria',
        eventCategoryId: 2,
        eventCategory: 'HR',
        selected: false,
      },
      {
        officeId: 5,
        officeName: 'Pretoria',
        eventCategoryId: 3,
        eventCategory: 'Lunch',
        selected: false,
      },
    ];

    const office = 'Pretoria';
    const eventCategories = ['HR', 'Lunch', 'Company Event', 'Social Event'];

    const accordionSection = el.renderAccordionSection(office, eventCategories);
    expect(accordionSection).to.be.ok;

    const accordionSectionElement = await fixture(accordionSection);
    expect(accordionSectionElement.querySelector('.accordion-label')).to.be.ok;
  });

});
