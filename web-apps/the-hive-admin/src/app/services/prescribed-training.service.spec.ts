import { TestBed } from '@angular/core/testing';

import { PrescribedTrainingService } from './prescribed-training.service';

describe('PrescribedTrainingService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PrescribedTrainingService = TestBed.get(PrescribedTrainingService);
    expect(service).toBeTruthy();
  });
});
