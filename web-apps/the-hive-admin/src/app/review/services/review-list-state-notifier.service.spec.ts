import { TestBed } from '@angular/core/testing';

import { ReviewListStateNotifierService } from './review-list-state-notifier.service';

describe('ReviewListStateNotifierService', () => {
  let service: ReviewListStateNotifierService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReviewListStateNotifierService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
