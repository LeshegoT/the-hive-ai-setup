import { TestBed } from '@angular/core/testing';

import { BursarAssessmentService } from './bursar-assessment.service';

describe('BursarAssessmentService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BursarAssessmentService = TestBed.get(BursarAssessmentService);
    expect(service).toBeTruthy();
  });
});
