import { html, fixture, expect } from '@open-wc/testing';

import '../../../src/components/course-summary-group.component';

describe('Component - Course Summary Group', () => {
    let courses = [{courseId: 1, code: 'cs', totalSections: 10, completedSections: 1}];

    it('should initialise properly', async () => {
      let el = await fixture(html`<e-course-summary-group .courses="${courses}"></e-course-summary-group>`);
  
      expect(el).to.be.ok;
    });
});