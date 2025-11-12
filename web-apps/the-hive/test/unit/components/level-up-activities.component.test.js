import { html, fixture, expect } from '@open-wc/testing';
import '../../../src/components/level-up-activities.component';

describe('Component - Level Up Activities', () => {
  it('should initialise properly.', async () => {
    let activities = [
      {
        levelUpActivityId: 1,
        levelUpActivityTypeId: 1,
        levelUpActivityType: { levelUpActivityTypeId: 1, code: 'test' },
        links: [{link: 'http://test.bbd.co.za'}],
        attended: false
      },
      {
        levelUpActivityId: 2,
        levelUpActivityTypeId: 1,
        levelUpActivityType: { levelUpActivityTypeId: 1, code: 'test' },
        links: [{link: 'http://test.bbd.co.za'}],
        attended: true
      }
    ];

    let el = await fixture(
      html`
        <e-level-up-activities .levelUpActivities="${activities}"></e-level-up-activities>
      `
    );

    expect(el).to.be.ok;
    expect(el.levelUpActivities).to.be.ok;
  });
});
