import { TestBed } from '@angular/core/testing';

import { SpecialisationsService } from './specialisations.service';

describe('SpecialisationsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SpecialisationsService = TestBed.get(SpecialisationsService);
    expect(service).toBeTruthy();
  });
});
