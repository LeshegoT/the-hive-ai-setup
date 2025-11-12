import { TestBed } from '@angular/core/testing';

import { LevelUpService } from './level-up.service';

describe('LevelUpService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LevelUpService = TestBed.get(LevelUpService);
    expect(service).toBeTruthy();
  });
});
