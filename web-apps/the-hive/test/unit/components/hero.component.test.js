import '../shared/stubs/globals';
import { html, fixture, expect } from '@open-wc/testing';
import '../../../src/components/hero.component';

describe('Component - Hero', () => {
  let quest = {
    heroUserPrincipleName: 'test@bbd.co.za',
    goal: 'test',
    status: 'in-progress',
    startDate: '2019-01-01 02:00',
    endDate: '2030-01-01 02:00',
    specialisation: {
      name: 'test'
    },
    questType: {
      name: 'test'
    }
  }

  it('should initialise properly.', async () => {
    let el = await fixture(html`
      <e-hero></e-hero>
    `);

    expect(el).to.be.ok;
  });

  it('should render a quest properly.', async () => {
    let el = await fixture(html`
      <e-hero .quest=${quest}></e-hero>
    `);

    expect(el).to.be.ok;
  });

  it('should have buttons.', async () => {
    let el = await fixture(html`
      <e-hero .quest=${quest} .buttons=${true}></e-hero>
    `);

    expect(el).to.be.ok;
  });

  it('should handel paused quest.', async () => {
    let testQuest = {...quest, status: 'paused'};
    let el = await fixture(html`
      <e-hero .quest=${testQuest} .buttons=${true}></e-hero>
    `);

    expect(el).to.be.ok;
  });

  it('should show out of time.', async () => {
    let testQuest = {...quest, endDate: new Date('2019-01-02 02:00')};
    let el = await fixture(html`
      <e-hero .quest=${testQuest} .buttons=${true}></e-hero>
    `);

    expect(el).to.be.ok;
  });
});
