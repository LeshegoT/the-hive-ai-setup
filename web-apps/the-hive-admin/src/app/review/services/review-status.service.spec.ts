import { TestBed } from '@angular/core/testing';

import { ReviewStatusService } from './review-status.service';

describe('ReviewStatusService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ReviewStatusService = TestBed.get(ReviewStatusService);
    expect(service).toBeTruthy();
  });
});
