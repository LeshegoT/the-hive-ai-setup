import { html, fixture, expect } from '@open-wc/testing';
import { fetch_level_ups_stub } from '../shared/stubs/level-up.service.stub';

describe('Page - Level Ups', () => {
  before(async () => {
    await import('../../../src/pages/level-ups.page');
  });

  after(() => {
    fetch_level_ups_stub.reset();
  });

  it('should initialise properly', async () => {
    let el = await fixture(
      html`
        <e-level-ups></e-level-ups>
      `
    );
    expect(el).to.be.ok;
    expect(fetch_level_ups_stub.called).to.be.ok;
  });

  it('should load level-ups correctly', async () => {
    let el = await fixture(
      html`
        <e-level-ups></e-level-ups>
      `
    );

    let someFutureEndDate = new Date();
    someFutureEndDate.setFullYear(someFutureEndDate.getFullYear() + 1);
    
    el.stateChanged({
      app: {},
      levelUps: {
        all: [{ levelUpId: 1, endDate: someFutureEndDate,startDate: someFutureEndDate }, { levelUpId: 2, endDate: someFutureEndDate, startDate:someFutureEndDate }, { levelUpId: 3, endDate: '2019-01-01', startDate:'2019-01-01' }],
        user: []
      },
      levelUpActivities: { all: [] },
      referenceData: { levelUpActivityTypes: [] },
      courses: { all: [] },
      sections: { all: [], user: [] },
      questions: { all: [] }
    });

    expect(el.levelUps).to.be.ok;
    expect(el.levelUps.length).to.equal(2);

    expect(el.pastLevelUps).to.be.ok;
    expect(el.pastLevelUps.length).to.equal(1);

    expect(el.levelUpsToRender).to.be.ok;
    expect(el.levelUpsToRender.length).to.equal(1);

    expect(el.pastLevelUpYears).to.be.ok;
    expect(el.pastLevelUpYears.length).to.equal(1);
  });
});
