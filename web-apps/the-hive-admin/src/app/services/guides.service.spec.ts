import { TestBed } from '@angular/core/testing';

import { GuidesService } from './guides.service';

describe('GuidesService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GuidesService = TestBed.get(GuidesService);
    expect(service).toBeTruthy();
  });
});
