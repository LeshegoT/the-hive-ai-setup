import { TestBed } from '@angular/core/testing';

import { VacWorkService } from './vac-work.service';

describe('VacWorkService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: VacWorkService = TestBed.get(VacWorkService);
    expect(service).toBeTruthy();
  });
});
