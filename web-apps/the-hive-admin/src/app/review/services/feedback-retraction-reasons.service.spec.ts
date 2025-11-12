import { TestBed } from '@angular/core/testing';

import { FeedbackRetractionReasonsService } from './feedback-retraction-reasons.service';

describe('FeedbackRetractionReasonsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FeedbackRetractionReasonsService = TestBed.get(FeedbackRetractionReasonsService);
    expect(service).toBeTruthy();
  });
});
